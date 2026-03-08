'use client';

type ReportPoint = { date?: string; label?: string; count?: number; revenue?: number };
type ReportBucket = { label?: string; value?: number; color?: string };
type CustomerProfile = {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  age?: number | null;
  visits?: number;
  monthVisits?: number;
  monthRevenue?: number;
  totalRevenue?: number;
  lastVisit?: string | null;
};
type SummaryCard = {
  totalVisits?: number;
  totalRevenue?: number;
  avgTicket?: number;
  uniqueClients?: number;
  newClients?: number;
  returningClients?: number;
  series?: ReportPoint[];
};

export type AdvancedReportView = {
  chartData?: ReportPoint[];
  genderData?: ReportBucket[];
  ageData?: ReportBucket[];
  clientsCsvData?: Record<string, unknown>[];
  visitsCsvData?: Record<string, unknown>[];
  totalRevenue?: number;
  avgTicket?: number;
  clvAverage?: number;
  weekSummary?: SummaryCard;
  monthSummary?: SummaryCard;
  customerProfiles?: CustomerProfile[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0);
}

function formatShortDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function renderMiniBars(series: ReportPoint[], colorClass: string) {
  const max = Math.max(...series.map((item) => Number(item.count || 0)), 1);
  return (
    <div className="mt-4 grid grid-cols-7 gap-2">
      {series.slice(-7).map((item) => {
        const height = Math.max((Number(item.count || 0) / max) * 84, 6);
        return (
          <div key={`${item.date}-${item.label}`} className="flex flex-col items-center gap-1">
            <div className="h-[88px] w-full rounded-lg bg-gray-100 p-1">
              <div className={`w-full rounded-md ${colorClass}`} style={{ height }} />
            </div>
            <span className="text-[10px] font-bold text-gray-500">{item.label || formatShortDate(item.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  tenantName: string;
  reportData: AdvancedReportView | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportClientsCsv: () => void;
  onExportVisitsCsv: () => void;
  onExportDatabaseJson: () => void;
  onGoQr: () => void;
  onGoRedeem: () => void;
  onGoSettings: () => void;
};

export default function AdvancedDashboard(props: Props) {
  const { reportData } = props;
  const week = reportData?.weekSummary || {};
  const month = reportData?.monthSummary || {};
  const weekSeries = week.series || [];
  const monthSeries = month.series || reportData?.chartData || [];
  const clients = reportData?.customerProfiles || [];
  const genderData = reportData?.genderData || [];
  const ageData = reportData?.ageData || [];
  const totalClients = reportData?.clientsCsvData?.length || 0;
  const totalVisits = Number(reportData?.chartData?.reduce((sum, point) => sum + Number(point.count || 0), 0) || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-300">Dashboard avanzado</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">{props.tenantName}</h2>
            <p className="mt-1 text-sm text-gray-300">Analítica semanal y mensual para operar con decisiones de alto nivel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={props.onRefresh}
              disabled={props.isRefreshing}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/20 disabled:opacity-60"
            >
              {props.isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button type="button" onClick={props.onExportClientsCsv} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-gray-900">
              Clientes CSV
            </button>
            <button type="button" onClick={props.onExportVisitsCsv} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-gray-900">
              Visitas CSV
            </button>
            <button type="button" onClick={props.onExportDatabaseJson} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-black text-white">
              Base completa JSON
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Clientes totales</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{totalClients}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Visitas totales</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{totalVisits}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Ingreso total</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{formatCurrency(Number(reportData?.totalRevenue || 0))}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">CLV promedio</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{formatCurrency(Number(reportData?.clvAverage || 0))}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Comportamiento semanal</h3>
          <p className="mt-1 text-xs font-semibold text-gray-500">Últimos 7 días de visitas e ingreso.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Visitas: <span className="font-black">{Number(week.totalVisits || 0)}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Ticket prom: <span className="font-black">{formatCurrency(Number(week.avgTicket || 0))}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Clientes nuevos: <span className="font-black">{Number(week.newClients || 0)}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Clientes recurrentes: <span className="font-black">{Number(week.returningClients || 0)}</span></p>
          </div>
          {weekSeries.length > 0 ? renderMiniBars(weekSeries, 'bg-gradient-to-t from-indigo-500 to-fuchsia-500') : <p className="mt-4 text-sm text-gray-400">Sin datos semanales.</p>}
        </article>

        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Comportamiento mensual</h3>
          <p className="mt-1 text-xs font-semibold text-gray-500">Acumulado del mes y tendencia.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Visitas: <span className="font-black">{Number(month.totalVisits || 0)}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Ingreso: <span className="font-black">{formatCurrency(Number(month.totalRevenue || 0))}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Clientes activos: <span className="font-black">{Number(month.uniqueClients || 0)}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Ticket prom: <span className="font-black">{formatCurrency(Number(month.avgTicket || 0))}</span></p>
          </div>
          {monthSeries.length > 0 ? renderMiniBars(monthSeries, 'bg-gradient-to-t from-orange-500 to-pink-500') : <p className="mt-4 text-sm text-gray-400">Sin datos mensuales.</p>}
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Perfil de clientes por género</h3>
          <div className="mt-4 space-y-3">
            {genderData.length === 0 ? <p className="text-sm text-gray-400">Sin datos.</p> : genderData.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                  <span>{item.label}</span>
                  <span>{item.value || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (Number(item.value || 0) / Math.max(...genderData.map((entry) => Number(entry.value || 0)), 1)) * 100)}%`, backgroundColor: item.color || '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Perfil por edades</h3>
          <div className="mt-4 space-y-3">
            {ageData.length === 0 ? <p className="text-sm text-gray-400">Sin datos.</p> : ageData.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                  <span>{item.label}</span>
                  <span>{item.value || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${Math.min(100, (Number(item.value || 0) / Math.max(...ageData.map((entry) => Number(entry.value || 0)), 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-gray-900">Top clientes (comportamiento mensual)</h3>
          <p className="text-xs font-semibold text-gray-500">Visitas, ticket y recurrencia</p>
        </div>
        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Sin datos de clientes para mostrar.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Visitas mes</th>
                  <th className="py-2 pr-4">Ingreso mes</th>
                  <th className="py-2 pr-4">Visitas total</th>
                  <th className="py-2">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 12).map((customer) => (
                  <tr key={`${customer.phone}-${customer.name}`} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-800">{customer.name || 'Cliente'}</p>
                      <p className="text-xs text-gray-500">{customer.phone || '—'} {customer.age ? `· ${customer.age} años` : ''}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-700">{customer.monthVisits || 0}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-700">{formatCurrency(Number(customer.monthRevenue || 0))}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-700">{customer.visits || 0}</td>
                    <td className="py-3 text-gray-600">{formatShortDate(customer.lastVisit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button onClick={props.onGoQr} className="rounded-2xl border border-gray-100 bg-white p-4 text-left hover:border-gray-200 hover:shadow-sm">
          <p className="text-sm font-black text-gray-800">QR diario</p>
          <p className="text-xs text-gray-500">Genera y comparte QR de check-in.</p>
        </button>
        <button onClick={props.onGoRedeem} className="rounded-2xl border border-gray-100 bg-white p-4 text-left hover:border-gray-200 hover:shadow-sm">
          <p className="text-sm font-black text-gray-800">Validar canje</p>
          <p className="text-xs text-gray-500">Atiende premios con rapidez en caja.</p>
        </button>
        <button onClick={props.onGoSettings} className="rounded-2xl border border-gray-100 bg-white p-4 text-left hover:border-gray-200 hover:shadow-sm">
          <p className="text-sm font-black text-gray-800">Configurar negocio</p>
          <p className="text-xs text-gray-500">Ajusta reglas, wallet y operación.</p>
        </button>
      </div>
    </div>
  );
}
