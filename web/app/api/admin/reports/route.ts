import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';
import { getRedemptionChannel, getRedemptionRewardLabel } from '@/app/lib/redemption-display';

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

type VisitRow = {
  id: string;
  visitedAt: Date;
  visitDay: string;
  userId: string;
  purchaseAmount: number;
  ticketNumber: string;
  purchaseTracked: boolean;
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
      targetMonth: (v: unknown): string | undefined => typeof v === 'string' && /^\d{4}-\d{2}$/.test(v) ? v : undefined,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { tenantId, tenantUserId, tenantSessionToken, targetMonth } = parsedBody.data;
    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    // Calcular las fechas usando targetMonth o la fecha actual
    const now = new Date();
    let monthStart: Date;
    let nextMonthStart: Date;
    let startOfToday: Date;
    let prevMonthStart: Date;

    if (targetMonth) {
      const [year, month] = targetMonth.split('-').map(Number);
      monthStart = new Date(year, month - 1, 1);
      nextMonthStart = new Date(year, month, 1);
      prevMonthStart = new Date(year, month - 2, 1);
      startOfToday = new Date(year, month - 1, new Date(year, month, 0).getDate()); // Último día del mes seleccionado para los cálculos de semana
    } else {
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
    }

    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);
    const chartStart = new Date(startOfToday);
    chartStart.setDate(chartStart.getDate() - 29);

    const visits: VisitRow[] = await (async () => {
      try {
        const rows = await prisma.visit.findMany({
          where: { membership: { tenantId: access.tenantId } },
          orderBy: { visitedAt: 'asc' },
          select: {
            id: true,
            visitedAt: true,
            visitDay: true,
            purchaseAmount: true,
            ticketNumber: true,
            membership: { select: { userId: true } },
          },
        });
        return rows.map((visit) => ({
          id: visit.id,
          visitedAt: visit.visitedAt,
          visitDay: visit.visitDay,
          userId: String(visit.membership.userId || ''),
          purchaseAmount: Number(visit.purchaseAmount || 0),
          ticketNumber: String(visit.ticketNumber || ''),
          purchaseTracked: true,
        }));
      } catch (error: unknown) {
        if (!isMissingTableOrColumnError(error)) throw error;
        const rows = await prisma.visit.findMany({
          where: { membership: { tenantId: access.tenantId } },
          orderBy: { visitedAt: 'asc' },
          select: {
            id: true,
            visitedAt: true,
            visitDay: true,
            membership: { select: { userId: true } },
          },
        });
        return rows.map((visit) => ({
          id: visit.id,
          visitedAt: visit.visitedAt,
          visitDay: visit.visitDay,
          userId: String(visit.membership.userId || ''),
          purchaseAmount: 0,
          ticketNumber: '',
          purchaseTracked: false,
        }));
      }
    })();

    const memberships = await prisma.membership.findMany({
      where: { tenantId: access.tenantId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            gender: true,
            birthDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastVisitAt: 'desc' },
    });

    const sumRevenue = (rows: Array<{ purchaseAmount: number }>) => rows.reduce((sum, row) => sum + Number(row.purchaseAmount || 0), 0);
    const avgTicket = (rows: Array<{ purchaseAmount: number }>) => {
      const withAmount = rows.filter((row) => Number(row.purchaseAmount || 0) > 0).length;
      return withAmount > 0 ? sumRevenue(rows) / withAmount : 0;
    };

    const formatDate = (value?: Date | null) => (value ? value.toISOString().split('T')[0] : '-');
    const formatDateTime = (value?: Date | null) => (value ? value.toISOString() : '-');
    const daysSince = (value?: Date | null) => {
      if (!value) return '-';
      const ms = startOfToday.getTime() - value.getTime();
      return ms >= 0 ? Math.floor(ms / (1000 * 60 * 60 * 24)) : 0;
    };
    const safeAvg = (sum: number, count: number) => (count > 0 ? sum / count : 0);

    const revenueByUser = new Map<string, number>();
    const visitsByDate = new Map<string, { count: number; revenue: number }>();
    const userMetrics = new Map<string, {
      visits: number;
      paidVisits: number;
      revenue: number;
      firstVisitAt: Date | null;
      lastVisitAt: Date | null;
    }>();
    visits.forEach((visit) => {
      const dateKey = visit.visitedAt.toISOString().split('T')[0];
      const bucket = visitsByDate.get(dateKey) || { count: 0, revenue: 0 };
      bucket.count += 1;
      bucket.revenue += Number(visit.purchaseAmount || 0);
      visitsByDate.set(dateKey, bucket);
      revenueByUser.set(visit.userId, (revenueByUser.get(visit.userId) || 0) + Number(visit.purchaseAmount || 0));

      const current = userMetrics.get(visit.userId) || { visits: 0, paidVisits: 0, revenue: 0, firstVisitAt: null, lastVisitAt: null };
      current.visits += 1;
      if (visit.purchaseAmount > 0) current.paidVisits += 1;
      current.revenue += Number(visit.purchaseAmount || 0);
      if (!current.firstVisitAt) current.firstVisitAt = visit.visitedAt;
      current.lastVisitAt = visit.visitedAt;
      userMetrics.set(visit.userId, current);
    });

    const chartData = Array.from(visitsByDate.entries())
      .filter(([date]) => new Date(`${date}T00:00:00`) >= chartStart)
      .map(([date, value]) => ({ date, label: date.slice(5), count: value.count, revenue: value.revenue }));

    const genderCounters: Record<string, number> = { Hombres: 0, Mujeres: 0, Otros: 0 };
    const ageCounters: Record<string, number> = { '<18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-65': 0, '>65': 0 };
    memberships.forEach((membership) => {
      const gender = String(membership.user.gender || '').toLowerCase();
      if (gender === 'hombre' || gender === 'm') genderCounters.Hombres += 1;
      else if (gender === 'mujer' || gender === 'f') genderCounters.Mujeres += 1;
      else genderCounters.Otros += 1;

      if (membership.user.birthDate) {
        const referenceYear = targetMonth ? Number(targetMonth.split('-')[0]) : now.getFullYear();
        const age = referenceYear - new Date(membership.user.birthDate).getFullYear();
        if (age < 18) ageCounters['<18'] += 1;
        else if (age <= 25) ageCounters['18-25'] += 1;
        else if (age <= 35) ageCounters['26-35'] += 1;
        else if (age <= 45) ageCounters['36-45'] += 1;
        else if (age <= 65) ageCounters['46-65'] += 1;
        else ageCounters['>65'] += 1;
      }
    });

    const weekVisits = visits.filter((visit) => visit.visitedAt >= weekStart && visit.visitedAt < nextMonthStart);
    const monthVisits = visits.filter((visit) => visit.visitedAt >= monthStart && visit.visitedAt < nextMonthStart);
    const prevMonthVisitsList = visits.filter((visit) => visit.visitedAt >= prevMonthStart && visit.visitedAt < monthStart);
    
    // Promedios semanales del mes anterior
    const daysInPrevMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0).getDate() || 30;
    const prevMonthWeeks = daysInPrevMonth / 7;
    const prevMonthAvgVisits = prevMonthVisitsList.length / prevMonthWeeks;
    const prevMonthAvgRevenue = sumRevenue(prevMonthVisitsList) / prevMonthWeeks;

    const weekClients = new Set(weekVisits.map((visit) => visit.userId));
    const monthClients = new Set(monthVisits.map((visit) => visit.userId));
    const hadPreviousVisit = (userId: string, before: Date) => visits.some((visit) => visit.userId === userId && visit.visitedAt < before);

    const weekSeriesMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekSeriesMap.set(d.toISOString().split('T')[0], { count: 0, revenue: 0 });
    }
    weekVisits.forEach((visit) => {
      const key = visit.visitedAt.toISOString().split('T')[0];
      const bucket = weekSeriesMap.get(key);
      if (!bucket) return;
      bucket.count += 1;
      bucket.revenue += Number(visit.purchaseAmount || 0);
    });
    const weekSeries = Array.from(weekSeriesMap.entries()).map(([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'short' }),
      count: value.count,
      revenue: value.revenue,
    }));

    const monthSeriesMap = new Map<string, { count: number; revenue: number }>();
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      monthSeriesMap.set(d.toISOString().split('T')[0], { count: 0, revenue: 0 });
    }
    monthVisits.forEach((visit) => {
      const key = visit.visitedAt.toISOString().split('T')[0];
      const bucket = monthSeriesMap.get(key);
      if (!bucket) return;
      bucket.count += 1;
      bucket.revenue += Number(visit.purchaseAmount || 0);
    });
    const monthSeries = Array.from(monthSeriesMap.entries()).map(([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit' }),
      count: value.count,
      revenue: value.revenue,
    }));

    const monthMetrics = new Map<string, { visits: number; paidVisits: number; revenue: number }>();
    monthVisits.forEach((visit) => {
      const current = monthMetrics.get(visit.userId) || { visits: 0, paidVisits: 0, revenue: 0 };
      current.visits += 1;
      if (visit.purchaseAmount > 0) current.paidVisits += 1;
      current.revenue += Number(visit.purchaseAmount || 0);
      monthMetrics.set(visit.userId, current);
    });

    const customerByUserId = new Map(
      memberships.map((membership) => [
        String(membership.userId || ''),
        {
          name: membership.user.name || 'Anónimo',
          phone: membership.user.phone || '',
          email: membership.user.email || '',
          createdAt: membership.user.createdAt || null,
          totalVisits: Number(membership.totalVisits || 0),
          firstVisitAt: userMetrics.get(String(membership.userId || ''))?.firstVisitAt || null,
          lastVisitAt: membership.lastVisitAt || userMetrics.get(String(membership.userId || ''))?.lastVisitAt || null,
          totalRevenue: Number(revenueByUser.get(String(membership.userId || '')) || 0),
          averageTicket: safeAvg(
            Number(revenueByUser.get(String(membership.userId || '')) || 0),
            Number(userMetrics.get(String(membership.userId || ''))?.paidVisits || 0),
          ),
        },
      ]),
    );

    const clientsCsvData = memberships.map((membership) => {
      const userId = String(membership.userId || '');
      const totals = userMetrics.get(userId) || { visits: 0, paidVisits: 0, revenue: 0, firstVisitAt: null, lastVisitAt: null };
      const month = monthMetrics.get(userId) || { visits: 0, paidVisits: 0, revenue: 0 };
      const lastVisitAt = membership.lastVisitAt || totals.lastVisitAt;

      return {
        Nombre: membership.user.name || 'Anónimo',
        Telefono: membership.user.phone || '',
        Celular: membership.user.phone || '',
        Email: membership.user.email || '',
        Genero: membership.user.gender || '',
        FechaCreacionCliente: formatDate(membership.user.createdAt),
        FechaPrimeraVisita: formatDate(totals.firstVisitAt),
        FechaUltimaVisita: formatDate(lastVisitAt),
        DiasDesdeUltimaVisita: daysSince(lastVisitAt),
        VisitasTotales: Number(membership.totalVisits || totals.visits || 0),
        VisitasMesActual: month.visits,
        NumeroUltimaVisita: Number(membership.totalVisits || totals.visits || 0),
        GastoTotal: totals.revenue.toFixed(2),
        GastoMesActual: month.revenue.toFixed(2),
        TicketPromedio: safeAvg(totals.revenue, totals.paidVisits).toFixed(2),
        TicketPromedioMes: safeAvg(month.revenue, month.paidVisits).toFixed(2),
        Segmento: Number(membership.totalVisits || totals.visits || 0) >= 5 ? 'Frecuente' : Number(membership.totalVisits || totals.visits || 0) >= 2 ? 'Recurrente' : 'Nuevo',
      };
    });

    const sequentialVisitCounter = new Map<string, number>();
    const visitsCsvData = visits.map((visit) => {
      const customer = customerByUserId.get(visit.userId);
      const currentCount = (sequentialVisitCounter.get(visit.userId) || 0) + 1;
      sequentialVisitCounter.set(visit.userId, currentCount);

      const totals = userMetrics.get(visit.userId) || { visits: 0, paidVisits: 0, revenue: 0, firstVisitAt: null, lastVisitAt: null };
      const averageTicket = safeAvg(totals.revenue, totals.paidVisits);

      return {
        FechaVisita: formatDateTime(visit.visitedAt),
        Dia: visit.visitDay || visit.visitedAt.toISOString().split('T')[0],
        Cliente: customer?.name || 'Anónimo',
        Telefono: customer?.phone || '',
        Celular: customer?.phone || '',
        Email: customer?.email || '',
        FechaCreacionCliente: formatDate(customer?.createdAt || null),
        NumeroVisita: currentCount,
        NumeroUltimaVisita: customer?.totalVisits || totals.visits || 0,
        FechaPrimeraVisita: formatDate(customer?.firstVisitAt || totals.firstVisitAt),
        FechaUltimaVisita: formatDate(customer?.lastVisitAt || totals.lastVisitAt),
        MontoCompra: Number(visit.purchaseAmount || 0).toFixed(2),
        TicketPromedioCliente: averageTicket.toFixed(2),
        GastoAcumuladoCliente: totals.revenue.toFixed(2),
        Ticket: visit.ticketNumber || '',
      };
    });

    const customerProfiles = memberships.map((membership) => {
      const userId = String(membership.userId || '');
      const month = monthMetrics.get(userId) || { visits: 0, paidVisits: 0, revenue: 0 };
      const age = membership.user.birthDate ? now.getFullYear() - new Date(membership.user.birthDate).getFullYear() : null;
      return {
        userId,
        name: membership.user.name || 'Anónimo',
        phone: membership.user.phone || '',
        email: membership.user.email || '',
        gender: membership.user.gender || '',
        age,
        visits: Number(membership.totalVisits || 0),
        monthVisits: month.visits,
        monthRevenue: month.revenue,
        totalRevenue: Number(revenueByUser.get(userId) || 0),
        lastVisit: membership.lastVisitAt ? membership.lastVisitAt.toISOString() : null,
      };
    }).sort((a, b) => (b.monthVisits - a.monthVisits) || (b.monthRevenue - a.monthRevenue));

    const totalRevenue = sumRevenue(visits);
    const overallAvgTicket = avgTicket(visits);
    const clvAverage = revenueByUser.size > 0 ? totalRevenue / revenueByUser.size : 0;

    // Métricas de Canjes (Redemptions)
    let redemptionsList: { name: string; count: number }[] = [];
    let pendingMonth = 0;
    let validatedMonth = 0;
    let milestoneValidatedMonth = 0;
    let coalitionValidatedMonth = 0;
    let finalValidatedMonth = 0;
    let redemptionActivity: Array<{
      id: string;
      code: string;
      customer: string;
      itemName: string;
      channel: 'FINAL' | 'MILESTONE' | 'COALITION';
      status: 'PENDING' | 'VALIDATED';
      requestedAt: string;
    }> = [];
    const redemptionsByItem = new Map<string, number>();
    
    try {
      const redemptions = await prisma.redemption.findMany({
        where: {
          tenantId: access.tenantId,
          createdAt: { gte: monthStart, lt: nextMonthStart }
        },
        include: {
          tenant: { select: { prize: true } },
          user: { select: { name: true, phone: true } },
          loyaltyMilestone: { select: { reward: true, emoji: true, visitTarget: true } },
          coalitionRewardUnlock: {
            include: { reward: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      redemptions.forEach(r => {
        const itemName = getRedemptionRewardLabel({
          tenantPrize: r.tenant.prize,
          rewardSnapshot: r.rewardSnapshot,
          code: r.code,
          loyaltyMilestone: r.loyaltyMilestone,
          coalitionRewardUnlock: r.coalitionRewardUnlock,
        });
        const channel = getRedemptionChannel({
          loyaltyMilestoneId: r.loyaltyMilestoneId,
          coalitionRewardUnlockId: r.coalitionRewardUnlockId,
        });

        if (!r.isUsed) pendingMonth += 1;
        if (r.isUsed) {
          validatedMonth += 1;
          if (channel === 'COALITION') coalitionValidatedMonth += 1;
          if (channel === 'MILESTONE') milestoneValidatedMonth += 1;
          if (channel === 'FINAL') finalValidatedMonth += 1;
        }

        redemptionsByItem.set(itemName, (redemptionsByItem.get(itemName) || 0) + 1);

        redemptionActivity.push({
          id: r.id,
          code: r.code,
          customer: r.user?.name || r.user?.phone || 'Cliente',
          itemName,
          channel,
          status: r.isUsed ? 'VALIDATED' : 'PENDING',
          requestedAt: r.createdAt.toISOString(),
        });
      });

      redemptionsList = Array.from(redemptionsByItem.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      redemptionActivity = redemptionActivity.slice(0, 25);
    } catch (e) {
      console.error('Error fetching redemptions:', e);
    }
    
    const monthlyRedemptionsTotal = redemptionsList.reduce((acc, curr) => acc + curr.count, 0);

    const totalProfilesWithGender = genderCounters.Hombres + genderCounters.Mujeres + genderCounters.Otros;
    const formatPercent = (val: number, total: number) => total > 0 ? ` (${Math.round((val / total) * 100)}%)` : '';
    
    const totalProfilesWithAge = Object.values(ageCounters).reduce((sum, val) => sum + val, 0);

    return apiSuccess({
      requestId,
      data: {
        chartData,
        genderData: [
          { label: `Hombres${formatPercent(genderCounters.Hombres, totalProfilesWithGender)}`, value: genderCounters.Hombres, color: '#3b82f6' },
          { label: `Mujeres${formatPercent(genderCounters.Mujeres, totalProfilesWithGender)}`, value: genderCounters.Mujeres, color: '#ec4899' },
          { label: `Otros${formatPercent(genderCounters.Otros, totalProfilesWithGender)}`, value: genderCounters.Otros, color: '#9ca3af' },
        ],
        ageData: Object.entries(ageCounters).map(([label, value]) => ({ label: `${label}${formatPercent(value, totalProfilesWithAge)}`, value })),
        clientsCsvData,
        visitsCsvData,
        customerProfiles,
        totalRevenue,
        avgTicket: overallAvgTicket,
        clvAverage,
        weekSummary: {
          totalVisits: weekVisits.length,
          totalRevenue: sumRevenue(weekVisits),
          avgTicket: avgTicket(weekVisits),
          uniqueClients: weekClients.size,
          newClients: memberships.filter((membership) => membership.user.createdAt >= weekStart).length,
          returningClients: Array.from(weekClients).filter((userId) => hadPreviousVisit(userId, weekStart)).length,
          series: weekSeries,
          compare: { prevAvgVisits: prevMonthAvgVisits, prevAvgRevenue: prevMonthAvgRevenue }
        },
        monthSummary: {
          totalVisits: monthVisits.length,
          totalRevenue: sumRevenue(monthVisits),
          avgTicket: avgTicket(monthVisits),
          uniqueClients: monthClients.size,
          newClients: memberships.filter((membership) => membership.user.createdAt >= monthStart).length,
          returningClients: Array.from(monthClients).filter((userId) => hadPreviousVisit(userId, monthStart)).length,
          series: monthSeries,
        },
        purchaseDataTracked: visits.some((visit) => visit.purchaseTracked),
        redemptions: {
          totalMonth: monthlyRedemptionsTotal,
          pendingMonth,
          validatedMonth,
          validatedByType: {
            final: finalValidatedMonth,
            milestone: milestoneValidatedMonth,
            coalition: coalitionValidatedMonth,
          },
          items: redemptionsList,
          activity: redemptionActivity,
        }
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al generar reportes',
    });
  }
}
