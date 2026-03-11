'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';type ReportPoint = { date?: string; label?: string; count?: number; revenue?: number };
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
  compare?: { prevAvgVisits: number; prevAvgRevenue: number };
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
  redemptions?: {
    totalMonth: number;
    items: { name: string; count: number }[];
  }
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

function renderComparisonBadge(current: number, previous: number) {
  if (!previous) return null;
  const pctDiff = Math.round(((current - previous) / previous) * 100);
  const isPositive = pctDiff >= 0;
  return (
    <span className={`ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} title={`Vs promedio mensual anterior: ${previous.toFixed(1)}`}>
      {isPositive ? '+' : ''}{pctDiff}%
    </span>
  );
}

function renderAreaChart(series: ReportPoint[], color: string, _fill?: string) {
  return (
    <div className="mt-4 h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af' }} 
            dy={8}
            minTickGap={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
          />
          <Tooltip 
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
             labelStyle={{ fontWeight: 'bold', color: '#374151' }}
             formatter={(value: number) => [`${value}`, 'Visitas']} 
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${color})`} />
        </AreaChart>
      </ResponsiveContainer>
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
  targetMonth?: string;
  onMonthChange?: (month: string) => void;
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
  const redemptions = reportData?.redemptions;

  // Generar últimos 12 meses para el selector
  const generateMonths = () => {
    const months = [];
    const d = new Date();
    for(let i=0; i<12; i++) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        months.push({ value: `${year}-${month}`, label: d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) });
        d.setMonth(d.getMonth() - 1);
    }
    return months;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-300">Dashboard avanzado</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">{props.tenantName}</h2>
            <p className="mt-1 text-sm text-gray-300">Analítica semanal y mensual para operar con decisiones de alto nivel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {props.onMonthChange && (
              <select 
                value={props.targetMonth || ''} 
                onChange={(e) => props.onMonthChange?.(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white outline-none cursor-pointer hover:bg-white/20 appearance-none min-w-[150px]"
              >
                <option value="" className="text-gray-900">Seleccionar Mes (Actual)</option>
                {generateMonths().map(m => (
                    <option key={m.value} value={m.value} className="text-gray-900 capitalize">{m.label}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={props.onRefresh}
              disabled={props.isRefreshing}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/20 disabled:opacity-60"
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
          <p className="mt-1 text-xs font-semibold text-gray-500">Últimos 7 días respecto al promedio del mes anterior.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Visitas: <span className="font-black">{Number(week.totalVisits || 0)}</span>{renderComparisonBadge(Number(week.totalVisits || 0), Number(week.compare?.prevAvgVisits || 0))}</p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Ingreso: <span className="font-black">{formatCurrency(Number(week.totalRevenue || 0))}</span>{renderComparisonBadge(Number(week.totalRevenue || 0), Number(week.compare?.prevAvgRevenue || 0))}</p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Clientes nuevos: <span className="font-black">{Number(week.newClients || 0)}</span></p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-700">Recurrentes: <span className="font-black">{Number(week.returningClients || 0)}</span></p>
          </div>
          {weekSeries.length > 0 ? renderAreaChart(weekSeries, '#6366f1', '#e0e7ff') : <p className="mt-4 text-sm text-gray-400">Sin datos semanales.</p>}
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
          {monthSeries.length > 0 ? renderAreaChart(monthSeries, '#f43f5e', '#ffe4e6') : <p className="mt-4 text-sm text-gray-400">Sin datos mensuales.</p>}
        </article>
      </div>

      {redemptions && (
        <section className="rounded-3xl border border-gray-100 bg-white p-6">
          <div className="mb-4">
             <h3 className="text-lg font-black text-gray-900">Reporte de Premios y Canjes</h3>
             <p className="mt-1 text-xs font-semibold text-gray-500">Actividad de recompensas durante el mes seleccionado.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
             <article className="rounded-2xl border border-gray-100 bg-orange-50/50 p-5">
               <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">Canjes Totales (Mes)</p>
               <p className="mt-2 text-4xl font-black text-orange-600">{redemptions.totalMonth}</p>
             </article>
             <article className="col-span-2 rounded-2xl border border-gray-100 bg-gray-50 p-5">
               <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-3">Premios Favoritos</p>
               {redemptions.items.length === 0 ? (
                 <p className="text-sm font-semibold text-gray-400">Ningún canje registrado este mes.</p>
               ) : (
                 <div className="space-y-3">
                   {redemptions.items.slice(0, 3).map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600">{idx + 1}</span>
                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                         </div>
                         <span className="text-sm font-black text-gray-500">{item.count} canje{item.count !== 1 && 's'}</span>
                      </div>
                   ))}
                 </div>
               )}
             </article>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Perfil de clientes por género</h3>
          <div className="mt-4 h-[200px] w-full">
            {genderData.length === 0 ? <p className="text-sm text-gray-400">Sin datos.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
            {genderData.map(entry => (
              <div key={entry.label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color || '#6366f1' }}></span>
                {entry.label}: {entry.value}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Perfil por edades</h3>
          <div className="mt-4 h-[200px] w-full">
            {ageData.length === 0 ? <p className="text-sm text-gray-400">Sin datos.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {ageData.map((entry, index) => {
                      const colors = ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
            {ageData.map((entry, index) => {
               const colors = ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];
               return (
                <div key={entry.label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></span>
                  {entry.label}: {entry.value}
                </div>
              );
            })}
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
