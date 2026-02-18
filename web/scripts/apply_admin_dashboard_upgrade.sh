#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f "app/admin/page.tsx" ]]; then
  echo "Error: no encuentro app/admin/page.tsx. Ejecuta desde /web o usa web/scripts/..."
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const path = 'app/admin/page.tsx';
let text = fs.readFileSync(path, 'utf8');

const oldHeader = "const [team, setTeam] = useState<any[]>([]);\nconst [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });\n";
const newHeader = `${oldHeader}\nconst trendData = reportData?.chartData ?? [];\nconst genderData = reportData?.genderData ?? [];\nconst ageData = reportData?.ageData ?? [];\nconst totalClients = reportData?.csvData?.length || 0;\nconst totalCheckins = trendData.reduce((sum: number, item: any) => sum + Number(item.count || 0), 0);\nconst peakDay = trendData.reduce((max: any, item: any) => {\n  return Number(item.count || 0) > Number(max?.count || 0) ? item : max;\n}, null);\nconst trendMax = Math.max(...trendData.map((d: any) => Number(d.count || 0)), 1);\nconst genderMax = Math.max(...genderData.map((d: any) => Number(d.value || 0)), 1);\nconst ageMax = Math.max(...ageData.map((d: any) => Number(d.value || 0)), 1);\n`;

if (!text.includes('const trendData = reportData?.chartData ?? [];')) {
  if (!text.includes(oldHeader)) {
    console.error('❌ No encontré el bloque base de estados para insertar métricas.');
    process.exit(1);
  }
  text = text.replace(oldHeader, newHeader);
}

const dashboardStart = text.indexOf("{tab === 'dashboard' && userRole === 'ADMIN' && (");
const teamStart = text.indexOf("\n\n{tab === 'team' && userRole === 'ADMIN' && (");
if (dashboardStart === -1 || teamStart === -1 || teamStart <= dashboardStart) {
  console.error('❌ No pude localizar el bloque de dashboard en app/admin/page.tsx');
  process.exit(1);
}

const dashboardReplacement = `{tab === 'dashboard' && userRole === 'ADMIN' && (\n<div className="space-y-8 animate-fadeIn">\n<div className="flex items-center justify-between gap-4 flex-wrap">\n  <div>\n    <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>\n    <p className="text-sm text-gray-500 font-medium mt-1">Tendencia de check-ins, género y edades de tus clientes.</p>\n  </div>\n  <button className="bg-gradient-to-br from-orange-400 to-pink-500 px-5 py-3 rounded-2xl shadow-lg text-white font-black text-sm" onClick={downloadCSV}>Exportar base (CSV)</button>\n</div>\n\n<div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Clientes registrados</p><p className="text-4xl font-black text-gray-900 mt-2">{totalClients}</p></div>\n<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Check-ins acumulados</p><p className="text-4xl font-black text-gray-900 mt-2">{totalCheckins}</p></div>\n<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Día más fuerte</p><p className="text-xl font-black text-gray-900 mt-2">{peakDay ? \`${'${peakDay.date} · ${peakDay.count}'}\` : 'Sin datos'}</p></div>\n</div>\n\n<div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">\n  <h3 className="text-lg font-bold text-gray-800 mb-1">Tendencia de check-ins</h3>\n  <p className="text-xs text-gray-500 font-medium mb-5">Actividad diaria de tus clientes.</p>\n  <div className="h-44 flex items-end justify-between gap-2">\n    {trendData.length > 0 ? trendData.map((d:any,i:number)=>(\n      <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">\n        <div className="w-full bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-lg" style={{height:\`${'${Math.max((Number(d.count || 0) / trendMax) * 170, 8)}'}px\`}}></div>\n        <span className="text-[10px] font-bold text-gray-400 truncate w-full text-center">{String(d.date).slice(5)}</span>\n      </div>\n    )) : <p className="text-sm text-gray-400">Aún no hay check-ins para mostrar.</p>}\n  </div>\n</div>\n\n<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">\n  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">\n    <h3 className="text-lg font-bold text-gray-800 mb-1">Distribución por género</h3>\n    <p className="text-xs text-gray-500 font-medium mb-5">Clientes por segmento.</p>\n    <div className="space-y-4">\n      {genderData.length > 0 ? genderData.map((item:any) => {\n        const width = Math.max((Number(item.value || 0) / genderMax) * 100, item.value ? 8 : 0);\n        return (\n          <div key={item.label}>\n            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">\n              <span>{item.label}</span>\n              <span>{item.value}</span>\n            </div>\n            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">\n              <div className="h-full rounded-full" style={{ width: \`${'${width}%'}\`, backgroundColor: item.color || '#fb7185' }}></div>\n            </div>\n          </div>\n        );\n      }) : <p className="text-sm text-gray-400">Sin datos de género.</p>}\n    </div>\n  </div>\n\n  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">\n    <h3 className="text-lg font-bold text-gray-800 mb-1">Distribución por edades</h3>\n    <p className="text-xs text-gray-500 font-medium mb-5">Rangos de edad de tus clientes.</p>\n    <div className="space-y-3">\n      {ageData.length > 0 ? ageData.map((item:any, idx:number) => {\n        const width = Math.max((Number(item.value || 0) / ageMax) * 100, item.value ? 8 : 0);\n        return (\n          <div key={item.label} className="flex items-center gap-3">\n            <span className="w-14 text-[11px] font-bold text-gray-500">{item.label}</span>\n            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">\n              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: \`${'${width}%'}\`, opacity: 0.6 + (idx % 4) * 0.1 }}></div>\n            </div>\n            <span className="w-6 text-right text-xs font-bold text-gray-700">{item.value}</span>\n          </div>\n        );\n      }) : <p className="text-sm text-gray-400">Sin datos de edades.</p>}\n    </div>\n  </div>\n</div>\n</div>\n)}`;

text = text.slice(0, dashboardStart) + dashboardReplacement + text.slice(teamStart);

fs.writeFileSync(path, text);
console.log('✅ Dashboard de admin actualizado en app/admin/page.tsx');
NODE

echo "\nListo. Siguiente:\n  cd /home/runner/workspace/web\n  npm install && npm run build\n  cd .. && git add web/app/admin/page.tsx web/scripts/apply_admin_dashboard_upgrade.sh\n  git commit -m 'feat(admin): dashboard upgrade in replit flow'\n  git push origin main"
