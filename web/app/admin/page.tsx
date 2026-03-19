'use client';
import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedDashboard, { type AdvancedReportView } from '../components/admin/AdvancedDashboard';
import { buildMilestonesPayloadForSave, normalizeMilestonesForEditor } from '../lib/loyalty-milestones';
import { DEFAULT_REQUIRED_VISITS, MAX_REQUIRED_VISITS, sanitizeRequiredVisits } from '../lib/loyalty-program';

const AdminMap = dynamic(() => import('../components/AdminMap'), { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse text-center pt-10 text-gray-400">Cargando...</div> });

const QRScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-gray-100 animate-pulse text-center pt-24 text-gray-400">Cargando cámara...</div>,
});


type TenantView = {
  [key: string]: unknown;
  id?: string;
  slug?: string;
  codePrefix?: string;
  name?: string;
  prize?: string;
  instagram?: string;
  requiredVisits?: number;
  rewardPeriod?: string;
  logoData?: string;
  walletBackgroundColor?: string;
  walletForegroundColor?: string;
  walletLabelColor?: string;
  walletStripImageData?: string;
  lat?: number;
  lng?: number;
  address?: string;
  coalitionOptIn?: boolean;
  coalitionDiscountPercent?: number;
  coalitionProduct?: string;
};

type MilestoneRow = { id?: string; visitTarget: string; reward: string; emoji: string };

type TeamMember = { id: string; name?: string; username?: string; role?: string };
type AdminTab = 'dashboard' | 'team' | 'qr' | 'redeem' | 'push' | 'settings';
type NavItem = { key: AdminTab; icon: string; label: string; adminOnly?: boolean };

export default function AdminPage() {
const [tenant, setTenant] = useState<TenantView | null>(null);
const [tenantUserId, setTenantUserId] = useState<string>('');
const [tenantSessionToken, setTenantSessionToken] = useState<string>('');
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');

const [, setCode] = useState('');
const [reportData, setReportData] = useState<AdvancedReportView | null>(null);
const [targetMonth, setTargetMonth] = useState<string>('');
const [baseUrl, setBaseUrl] = useState('');
const [tab, setTab] = useState<AdminTab>('qr');
const [userRole, setUserRole] = useState('');

const [prizeName, setPrizeName] = useState('');
const [prizeEmoji, setPrizeEmoji] = useState('🏆');
const [requiredVisits, setRequiredVisits] = useState(String(DEFAULT_REQUIRED_VISITS));
const [rewardPeriod, setRewardPeriod] = useState('OPEN');
const [logoData, setLogoData] = useState<string>('');
const [walletBackgroundColor, setWalletBackgroundColor] = useState('#1f2937');
const [walletForegroundColor, setWalletForegroundColor] = useState('#ffffff');
const [walletLabelColor, setWalletLabelColor] = useState('#bfdbfe');
const [walletStripImageData, setWalletStripImageData] = useState<string | null>('');

const [instagram, setInstagram] = useState('');
const [coalitionOptIn, setCoalitionOptIn] = useState(false);
const [coalitionDiscountPercent, setCoalitionDiscountPercent] = useState('10');
const [coalitionProduct, setCoalitionProduct] = useState('');
const [addressSearch, setAddressSearch] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [coords, setCoords] = useState<[number, number]>([19.4326, -99.1332]);

const [redeemCode, setRedeemCode] = useState('');
const [msg, setMsg] = useState('');
const [uiNotice, setUiNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
const [scannerOpen, setScannerOpen] = useState(false);
const [scannerMsg, setScannerMsg] = useState('');
const lastScanRef = useRef<string>('');
const [scannerSuccessFlash, setScannerSuccessFlash] = useState(false);

const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* ignore */ }
};

const [team, setTeam] = useState<TeamMember[]>([]);
const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });
const [lastScannedCustomerId, setLastScannedCustomerId] = useState('');
const [visitPurchaseAmount, setVisitPurchaseAmount] = useState('');

const [pushMessage, setPushMessage] = useState('');
const [pushLoading, setPushLoading] = useState(false);
const [pushResult, setPushResult] = useState('');
const [pushRemaining, setPushRemaining] = useState<number | null>(null);
const [pushHistory, setPushHistory] = useState<Array<{ message: string; devices: number; sentAt: string }>>([]);
const [pushCoverage, setPushCoverage] = useState<{
  appleRegisteredDevices: number;
  customerMemberships: number;
  appleConfigured: boolean;
  googleConfigured: boolean;
} | null>(null);
const [pushDiagnostics, setPushDiagnostics] = useState<{
  apple?: { sent?: number; failed?: number; targetedDevices?: number; reasons?: Record<string, number> };
  google?: { sent?: number; failed?: number; reasons?: Record<string, number> };
} | null>(null);
const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
const [isSavingMilestones, setIsSavingMilestones] = useState(false);

const [isLoggingIn, setIsLoggingIn] = useState(false);
const [isCreatingStaff, setIsCreatingStaff] = useState(false);
const [isSavingSettings, setIsSavingSettings] = useState(false);
const [isValidatingRedeem, setIsValidatingRedeem] = useState(false);
const [isRefreshingReports, setIsRefreshingReports] = useState(false);

const navItems: NavItem[] = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', adminOnly: true },
  { key: 'team', icon: '👥', label: 'Equipo', adminOnly: true },
  { key: 'qr', icon: '📷', label: 'QR' },
  { key: 'redeem', icon: '🎁', label: 'Canje' },
  { key: 'push', icon: '📢', label: 'Push', adminOnly: true },
  { key: 'settings', icon: '⚙️', label: 'Config', adminOnly: true },
];

const visibleNavItems = navItems.filter((item) => !item.adminOnly || userRole === 'ADMIN');
const normalizedRequiredVisits = sanitizeRequiredVisits(requiredVisits || DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS);

const notify = (type: 'success' | 'error' | 'info', text: string) => {
  setUiNotice({ type, text });
};

const sanitizeCurrencyInput = (value: string) => {
  const clean = value.replace(/[^0-9.]/g, '');
  const [intPart = '', ...decParts] = clean.split('.');
  const decimals = decParts.join('').slice(0, 2);
  if (clean.includes('.')) {
    return `${intPart}.${decimals}`;
  }
  return intPart;
};

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoggingIn(true);
  try {
    const res = await fetch('/api/tenant/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setTenant(data.tenant);
      setUserRole(data.user.role);
      setTenantUserId(data.user.id || '');
      setTenantSessionToken(String(data.tenantSessionToken || ''));
      setPrizeName(data.tenant.prize || '');
      setInstagram(data.tenant.instagram || '');
      setCoalitionOptIn(Boolean(data.tenant.coalitionOptIn));
      setCoalitionDiscountPercent(String(data.tenant.coalitionDiscountPercent ?? 10));
      setCoalitionProduct(String(data.tenant.coalitionProduct ?? ''));
      setRequiredVisits(String(sanitizeRequiredVisits(data.tenant.requiredVisits ?? DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS)));
      setRewardPeriod(String(data.tenant.rewardPeriod ?? 'OPEN'));
      setLogoData(String(data.tenant.logoData ?? ''));
      setWalletBackgroundColor(String(data.tenant.walletBackgroundColor ?? '#1f2937'));
      setWalletForegroundColor(String(data.tenant.walletForegroundColor ?? '#ffffff'));
      setWalletLabelColor(String(data.tenant.walletLabelColor ?? '#bfdbfe'));
      setWalletStripImageData(data.tenant.walletStripImageData || '');

      if (data.tenant.lat && data.tenant.lng) {
        setCoords([data.tenant.lat, data.tenant.lng]);
        if (data.tenant.address) setAddressSearch(data.tenant.address);
      }
      if (typeof window !== 'undefined') setBaseUrl(window.location.origin);

      setTab(data.user.role === 'ADMIN' ? 'dashboard' : 'qr');
      if (data.user.role === 'ADMIN') {
        loadReports(data.tenant.id, data.user.id || '', String(data.tenantSessionToken || ''), targetMonth);
        loadTeam(data.tenant.id, data.user.id || '', String(data.tenantSessionToken || ''));
        loadPushStatus(data.tenant.id, data.user.id || '', String(data.tenantSessionToken || ''));
        loadMilestones(
          data.tenant.id,
          data.user.id || '',
          String(data.tenantSessionToken || ''),
          data.tenant.requiredVisits ?? DEFAULT_REQUIRED_VISITS,
        );
      }
    } else {
      notify('error', String(data.error || 'No se pudo iniciar sesión'));
    }
  } catch {
    notify('error', 'Ocurrió un error de conexión.');
  } finally {
    setIsLoggingIn(false);
  }
};

const loadReports = async (tid: string, currentTenantUserId = tenantUserId, currentTenantSessionToken = tenantSessionToken, monthToLoad = targetMonth) => {
  setIsRefreshingReports(true);
  try {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tenantId: tid, 
        tenantUserId: currentTenantUserId, 
        tenantSessionToken: currentTenantSessionToken,
        targetMonth: monthToLoad || undefined 
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify('error', String(data?.error || data?.message || 'No se pudo cargar la reportería.'));
      return;
    }
    setReportData(data);
  } catch {
    notify('error', 'No se pudo conectar para obtener reportería.');
  } finally {
    setIsRefreshingReports(false);
  }
};

const loadPushStatus = async (tid: string, currentTenantUserId = tenantUserId, currentTenantSessionToken = tenantSessionToken) => {
  try {
    const res = await fetch(`/api/admin/push?tenantId=${tid}&tenantUserId=${currentTenantUserId}&tenantSessionToken=${encodeURIComponent(currentTenantSessionToken)}`);
    const data = await res.json();
    if (data.remaining != null) setPushRemaining(data.remaining);
    if (data.recent) setPushHistory(data.recent);
    if (data.coverage) setPushCoverage(data.coverage);
  } catch {}
};

const sendPush = async () => {
  if (!tenant || !pushMessage.trim()) return;
  setPushLoading(true);
  setPushResult('');
  try {
    const res = await fetch('/api/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: (tenant as Record<string, unknown>).id, tenantUserId, tenantSessionToken, message: pushMessage.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      const delivered =
        Number(data?.apple?.sent || 0) > 0 ||
        Number(data?.google?.sent || 0) > 0;
      if (delivered) {
        setPushResult(`✅ ${data.message}`);
      } else {
        setPushResult(`⚠️ ${data.message}`);
      }
      setPushDiagnostics({
        apple: data?.apple,
        google: data?.google,
      });
      setPushMessage('');
      if (data.remaining != null) setPushRemaining(data.remaining);
      loadPushStatus(String((tenant as Record<string, unknown>).id));
    } else {
      setPushResult(`❌ ${data.error}`);
    }
  } catch {
    setPushResult('❌ Error de conexión');
  }
  setPushLoading(false);
};

const loadTeam = async (tid: string, currentTenantUserId = tenantUserId, currentTenantSessionToken = tenantSessionToken) => {
try { const res = await fetch(`/api/tenant/users?tenantId=${tid}&tenantUserId=${currentTenantUserId}&tenantSessionToken=${encodeURIComponent(currentTenantSessionToken)}`); const data = await res.json(); if(data.users) setTeam(data.users); } catch {}
};

  const loadMilestones = async (
    tid: string,
    currentTenantUserId = tenantUserId,
    currentTenantSessionToken = tenantSessionToken,
    requiredVisitsOverride?: number | string,
  ) => {
  try {
    const res = await fetch(`/api/admin/milestones?tenantId=${tid}&tenantUserId=${currentTenantUserId}&tenantSessionToken=${encodeURIComponent(currentTenantSessionToken)}`);
    const data = await res.json();
    if (data.milestones) {
      const req = sanitizeRequiredVisits(
        requiredVisitsOverride ?? requiredVisits ?? DEFAULT_REQUIRED_VISITS,
        DEFAULT_REQUIRED_VISITS,
      );
      const { intermediateMilestones, finalMilestone } = normalizeMilestonesForEditor(data.milestones, req);
      if (finalMilestone?.emoji) setPrizeEmoji(finalMilestone.emoji);
      setMilestones(intermediateMilestones);
    }
  } catch {}
};

const saveMilestones = async () => {
  if (!tenant?.id) return;
  setIsSavingMilestones(true);
  try {
    const required = sanitizeRequiredVisits(requiredVisits || DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS);
    const validation = buildMilestonesPayloadForSave({
      milestones,
      requiredVisits: required,
      finalReward: prizeName || 'Premio Final',
      finalEmoji: prizeEmoji || '🏆',
    });

    if (!validation.ok) {
      notify('error', validation.message);
      setIsSavingMilestones(false);
      return;
    }

    const res = await fetch('/api/admin/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantUserId,
        tenantSessionToken,
        milestones: validation.milestones.map(({ visitTarget, reward, emoji }) => ({ visitTarget, reward, emoji })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify('error', String(data.error || 'No se pudo guardar la escalera'));
      return;
    }
    if (data.milestones) {
      const req = sanitizeRequiredVisits(requiredVisits || DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS);
      const { intermediateMilestones, finalMilestone } = normalizeMilestonesForEditor(data.milestones, req);
      if (finalMilestone?.emoji) setPrizeEmoji(finalMilestone.emoji);
      setMilestones(intermediateMilestones);
    }
    notify('success', 'Escalera de beneficios guardada correctamente.');
  } catch {
    notify('error', 'Error de conexión al guardar la escalera.');
  } finally {
    setIsSavingMilestones(false);
  }
};

const createStaff = async () => {
if(!newStaff.name || !newStaff.username || !newStaff.password) return notify('error', 'Faltan datos para crear empleado.');
setIsCreatingStaff(true);
try {
const res = await fetch('/api/tenant/users', { 
method: 'POST', headers: {'Content-Type': 'application/json'}, 
body: JSON.stringify({ tenantId: tenant.id, tenantUserId, tenantSessionToken, ...newStaff }) 
});
if(res.ok) { 
notify('success', 'Empleado creado correctamente.');
setNewStaff({ name: '', username: '', password: '', role: 'STAFF' }); 
loadTeam(tenant.id, tenantUserId); 
} else { const d = await res.json(); notify('error', String(d.error || 'No se pudo crear el empleado')); }
} catch { notify('error', 'Ocurrió un error de conexión.'); }
setIsCreatingStaff(false);
};

const deleteStaff = async (id: string) => {
if(!confirm("¿Eliminar empleado?")) return;
try { await fetch('/api/tenant/users', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id, tenantId: tenant.id, tenantUserId, tenantSessionToken }) }); loadTeam(tenant.id, tenantUserId); } catch {}
};

const searchLocation = async () => {
if (!addressSearch) return;
setIsSearching(true);
try {
const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
const data = await res.json();
if (data && data.length > 0) { setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); notify('success', 'Ubicación encontrada y aplicada al mapa.'); } else notify('info', 'No se encontró la dirección.');
} catch { notify('error', 'No se pudo buscar la dirección.'); }
setIsSearching(false);
};
  const toPngStripDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Formato inválido.'));
    image.onload = () => {
      const targetWidth = 624;
      const targetHeight = 246;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (targetWidth - drawWidth) / 2;
      const offsetY = (targetHeight - drawHeight) / 2;
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      const pngDataUrl = canvas.toDataURL('image/png');
      const approxBytes = Math.ceil((pngDataUrl.length - 'data:image/png;base64,'.length) * 0.75);
      if (approxBytes > 400 * 1024) {
        reject(new Error('Imagen muy pesada después de convertirla a PNG (máx 400KB).'));
        return;
      }

      resolve(pngDataUrl);
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
  });

const saveSettings = async () => {
  setIsSavingSettings(true);
  try {
    const res = await fetch('/api/tenant/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantUserId,
        tenantSessionToken,
        prize: prizeName,
        requiredVisits: normalizedRequiredVisits,
        rewardPeriod,
        logoData, // ✅ AHORA SÍ SE ENVÍA
        lat: coords[0],
        lng: coords[1],
        address: addressSearch,
        instagram: instagram,
        coalitionOptIn,
        coalitionDiscountPercent,
        coalitionProduct,
        walletBackgroundColor: walletBackgroundColor || undefined,
        walletForegroundColor: walletForegroundColor || undefined,
        walletLabelColor: walletLabelColor || undefined,
        walletStripImageData: walletStripImageData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      notify('error', String(data.error || 'Error guardando'));
      return;
    }

    // ✅ Persistencia: actualiza tenant en UI con lo que regresa el backend
    if (data?.tenant) {
      setTenant(data.tenant);
      setLogoData(String(data.tenant.logoData ?? ''));
      setPrizeName(data.tenant.prize || '');
      setInstagram(data.tenant.instagram || '');
      setCoalitionOptIn(Boolean(data.tenant.coalitionOptIn));
      setCoalitionDiscountPercent(String(data.tenant.coalitionDiscountPercent ?? 10));
      setCoalitionProduct(String(data.tenant.coalitionProduct ?? ''));
      setRequiredVisits(String(sanitizeRequiredVisits(data.tenant.requiredVisits ?? DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS)));
      setRewardPeriod(String(data.tenant.rewardPeriod ?? 'OPEN'));
      setWalletBackgroundColor(String(data.tenant.walletBackgroundColor ?? walletBackgroundColor));
      setWalletForegroundColor(String(data.tenant.walletForegroundColor ?? walletForegroundColor));
      setWalletLabelColor(String(data.tenant.walletLabelColor ?? walletLabelColor));
      setWalletStripImageData(data.tenant.walletStripImageData || '');

    }

    notify('success', 'Configuración guardada correctamente.');
  } catch {
    notify('error', 'Ocurrió un error de conexión.');
  } finally {
    setIsSavingSettings(false);
  }
};

const triggerDownload = (filename: string, content: string, type: 'text/csv' | 'application/json') => {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const jsonToCsv = (items: Record<string, unknown>[]) => {
  if (!items || items.length === 0) return '';
  const headers = Object.keys(items[0]);
  const rows = items.map(row => 
    headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
};

const downloadClientsCsv = () => {
  if (!reportData?.clientsCsvData?.length) {
    notify('error', 'No hay datos de clientes para exportar');
    return;
  }
  const csv = jsonToCsv(reportData.clientsCsvData);
  triggerDownload(`clientes-${tenant?.slug || 'export'}-${new Date().toISOString().split('T')[0]}.csv`, csv, 'text/csv');
  notify('success', 'Archivo CSV de clientes descargado');
};

const downloadVisitsCsv = () => {
  if (!reportData?.visitsCsvData?.length) {
    notify('error', 'No hay datos de visitas para exportar');
    return;
  }
  const csv = jsonToCsv(reportData.visitsCsvData);
  triggerDownload(`visitas-${tenant?.slug || 'export'}-${new Date().toISOString().split('T')[0]}.csv`, csv, 'text/csv');
  notify('success', 'Archivo CSV de visitas descargado');
};

const downloadDatabaseJson = () => {
  if (!reportData) {
    notify('error', 'No hay datos cargados para exportar');
    return;
  }
  const fullExport = {
    tenant: tenant?.name,
    exportedAt: new Date().toISOString(),
    metrics: {
      totalRevenue: reportData.totalRevenue,
      avgTicket: reportData.avgTicket,
      clvAverage: reportData.clvAverage,
    },
    clients: reportData.customerProfiles,
    visits: reportData.visitsCsvData,
  };
  triggerDownload(`db-completa-${tenant?.slug || 'export'}.json`, JSON.stringify(fullExport, null, 2), 'application/json');
  notify('success', 'Base de datos descargada en JSON');
};

const validateRedeem = async () => {
  setMsg('Validando...');
  setIsValidatingRedeem(true);
  try {
    const res = await fetch('/api/redeem/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, tenantUserId, tenantSessionToken, code: redeemCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(` ENTREGAR A: ${data.user}`);
      setRedeemCode('');
      if (userRole === 'ADMIN') loadReports(tenant.id, tenantUserId);
    } else {
      setMsg(` ${data.error}`);
    }
  } catch {
    setMsg('Error');
  } finally {
    setIsValidatingRedeem(false);
  }
};

const onboardingQrValue = tenant?.id ? `${baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/?clientes=1&business_id=${encodeURIComponent(String(tenant.id))}&flow=create-pass&auth=welcome` : '';

const printOnboardingQr = () => {
  if (typeof window === 'undefined') return;
  window.print();
};

const ensureDailyCode = async () => {
  const res = await fetch('/api/admin/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: tenant.id, tenantUserId, tenantSessionToken }),
  });
  const data = await res.json();
  if (!res.ok || !data?.code) throw new Error(data?.error || 'No se pudo generar código diario');
  setCode(data.code);
  return String(data.code);
};

const resolveScannedCustomerId = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) throw new Error('QR vacío');

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('customer_id') || url.searchParams.get('customerId');
    if (fromQuery) return fromQuery;
  } catch {}

  const uuidMatch = raw.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  if (uuidMatch?.[0]) return uuidMatch[0];

  const res = await fetch('/api/pass/resolve-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrValue: raw }),
  });
  const data = await res.json();
  if (!res.ok || !data?.customerId) throw new Error(data?.error || 'No se pudo resolver cliente del QR');
  return String(data.customerId);
};

const handleAdminScan = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) return;
  if (lastScanRef.current === raw) return;
  lastScanRef.current = raw;

  setScannerMsg('Procesando QR...');
  try {
    const customerId = await resolveScannedCustomerId(raw);
    const todayCode = await ensureDailyCode();

    const res = await fetch('/api/check-in/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: customerId, code: todayCode, tenantUserId, tenantSessionToken, purchaseAmount: visitPurchaseAmount }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'No se pudo registrar visita');

    const amount = Number(data.purchaseAmount || 0);
    const amountBadge = amount > 0 ? ` · Compra: $${amount.toFixed(2)}` : '';
    setScannerMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})${amountBadge}`);
    setMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})${amountBadge}`);
    setLastScannedCustomerId(customerId);
    setVisitPurchaseAmount('');
    playSuccessSound();
    setScannerSuccessFlash(true);
    setTimeout(() => setScannerSuccessFlash(false), 800);
  } catch (error: unknown) {
    const text = error instanceof Error ? error.message : 'Error al escanear';
    setScannerMsg(`❌ ${text}`);
    setMsg(`❌ ${text}`);
  } finally {
    setTimeout(() => {
      lastScanRef.current = '';
    }, 1200);
  }
};

if (!tenant) return <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4"><div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700"><div className="text-center mb-8"><h1 className="text-3xl font-black text-white tracking-tighter">punto<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">IA</span></h1><p className="text-gray-400 text-sm mt-2">Acceso de Personal</p></div><form onSubmit={handleLogin} className="space-y-4"><input className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 outline-none" placeholder="Usuario (Ej: PIZZA.juan)" value={username} onChange={e=>setUsername(e.target.value)} disabled={isLoggingIn} /><input type="password" className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 outline-none" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} disabled={isLoggingIn} /><button disabled={isLoggingIn} className="w-full bg-gradient-to-r from-orange-500 to-pink-600 font-bold py-4 rounded-xl text-white shadow-lg disabled:opacity-60">{isLoggingIn ? 'Ingresando...' : 'Iniciar Sesión'}</button></form></div></div>;


return (
<div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
<div className="w-full md:w-64 bg-gray-950/95 text-white flex md:flex-col p-3 md:p-6 fixed inset-x-4 bottom-4 md:inset-x-0 md:bottom-auto md:relative z-50 md:h-full justify-between md:justify-start border border-gray-800/80 md:border-t-0 md:border-l-0 md:border-b-0 md:border-r rounded-[2rem] md:rounded-none shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
<h1 className="text-2xl font-black tracking-tighter mb-4 hidden md:block">punto<span className="text-pink-500">IA</span></h1>
<div className="hidden md:block mb-6"><span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-sm ring-1 ring-white/10 ${userRole==='ADMIN'?'bg-gradient-to-r from-purple-600 to-pink-600':'bg-gradient-to-r from-sky-600 to-blue-700'}`}>{userRole}</span></div>
<nav className="flex md:flex-col gap-2 w-full justify-around md:justify-start">
  {visibleNavItems.map((item) => (
    <button
      key={item.key}
      onClick={() => setTab(item.key)}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab===item.key?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
      aria-current={tab === item.key ? 'page' : undefined}
    >
      <span className="text-xl leading-none">{item.icon}</span>
      <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">{item.label}</span>
    </button>
  ))}
</nav>
<div className="hidden md:block mt-auto pt-6 border-t border-gray-800"><p className="font-bold text-sm truncate">{tenant.name}</p><button onClick={() => setTenant(null)} className="text-xs text-red-400 mt-4 hover:text-red-300 border border-red-900 p-2 rounded w-full">Cerrar Sesión</button></div>
</div>
<button onClick={() => setTenant(null)} className="md:hidden fixed top-4 right-4 z-50 bg-red-600 text-white w-8 h-8 rounded-full font-bold flex items-center justify-center shadow-lg">✕</button>

<div className="flex-1 p-6 md:p-8 overflow-y-auto pb-32 md:pb-0">
{uiNotice ? (
  <div className={`mb-5 rounded-2xl border p-3 text-sm font-semibold flex items-center justify-between gap-3 ${uiNotice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : uiNotice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
    <span>{uiNotice.text}</span>
    <button onClick={() => setUiNotice(null)} className="text-xs font-black opacity-70 hover:opacity-100">Cerrar</button>
  </div>
) : null}
{tab === 'dashboard' && userRole === 'ADMIN' && (
<AdvancedDashboard
  tenantName={String(tenant.name || 'Negocio')}
  reportData={reportData}
  isRefreshing={isRefreshingReports}
  targetMonth={targetMonth}
  onMonthChange={(m) => {
    setTargetMonth(m);
    loadReports(tenant.id, tenantUserId, tenantSessionToken, m);
  }}
  onRefresh={() => {
    loadReports(tenant.id, tenantUserId, tenantSessionToken, targetMonth);
    loadTeam(tenant.id, tenantUserId, tenantSessionToken);
  }}
  onExportClientsCsv={downloadClientsCsv}
  onExportVisitsCsv={downloadVisitsCsv}
  onExportDatabaseJson={downloadDatabaseJson}
  onGoQr={() => setTab('qr')}
  onGoRedeem={() => setTab('redeem')}
  onGoSettings={() => setTab('settings')}
/>
)}

{tab === 'team' && userRole === 'ADMIN' && (
<div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">👥</span>
        <div>
          <h2 className="text-lg font-black">Agregar Personal</h2>
          <p className="text-white/80 text-xs font-semibold">Crea cuentas para tu equipo operativo o administrativo</p>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-300 focus:bg-white transition text-sm font-semibold" placeholder="Nombre (ej: Pedro)" value={newStaff.name} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} />
        <div className="flex items-center bg-gray-50 rounded-xl px-3.5 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:bg-white transition">
          <span className="text-gray-400 font-mono text-xs font-bold mr-1 select-none shrink-0">{tenant.codePrefix || '???'}.</span>
          <input className="bg-transparent w-full py-3.5 outline-none font-semibold text-gray-900 placeholder:text-gray-400 text-sm" placeholder="usuario" value={newStaff.username} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, username: e.target.value})} />
        </div>
        <input type="password" className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-300 focus:bg-white transition text-sm font-semibold" placeholder="Contraseña" value={newStaff.password} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, password: e.target.value})} />
        <select className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-300 text-sm font-semibold" value={newStaff.role} onChange={e=>setNewStaff({...newStaff, role: e.target.value})} disabled={isCreatingStaff}>
          <option value="STAFF">👤 Operativo (QR + Canje)</option>
          <option value="ADMIN">👑 Administrador (Total)</option>
        </select>
      </div>
      <button onClick={createStaff} disabled={isCreatingStaff} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3.5 rounded-xl shadow-md text-sm hover:shadow-lg transition-all disabled:opacity-60">{isCreatingStaff ? 'Creando...' : 'Agregar Empleado'}</button>
    </div>
  </div>

  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black text-gray-800">Mi Equipo</h2>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">{team.length}</span>
      </div>
    </div>
    <div className="divide-y divide-gray-50">
      {team.length > 0 ? team.map((u: TeamMember) => (
        <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${u.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}>
              {u.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{u.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] text-gray-400 font-semibold truncate">{u.username}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role === 'ADMIN' ? 'Admin' : 'Staff'}</span>
              </div>
            </div>
          </div>
          <button onClick={() => deleteStaff(String(u.id))} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition shrink-0" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )) : (
        <div className="px-6 py-10 text-center">
          <p className="text-gray-300 text-3xl mb-2">👥</p>
          <p className="text-gray-400 text-sm font-semibold">Sin empleados registrados</p>
        </div>
      )}
    </div>
  </div>
</div>
)}

{tab === 'qr' && (
<div className="max-w-lg mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-gray-300">
    <div className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] p-5 text-white print:bg-none print:text-gray-900 print:border-b print:border-gray-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-pink-200 print:text-pink-700">Punto IA</p>
          <h2 className="text-lg font-black">QR para crear pase</h2>
          <p className="text-gray-300 text-xs font-semibold mt-0.5 print:text-gray-600">Tus clientes escanean, se registran/inician sesión y descargan su pase en Apple o Google Wallet.</p>
        </div>
        <button onClick={printOnboardingQr} className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition shrink-0 print:hidden">
          🖨️ Imprimir
        </button>
      </div>
    </div>
    <div className="p-6 flex flex-col items-center gap-5">
      <div className="w-full rounded-3xl border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Escanea y activa tu pase</p>
        <p className="mt-1 text-xs text-gray-600 font-semibold">1) Crea tu cuenta · 2) Abre tu pase · 3) Guárdalo en tu wallet</p>
        <div className="mt-4 bg-white p-4 rounded-2xl shadow-inner border border-gray-100 inline-flex">
          {onboardingQrValue ? <QRCode value={onboardingQrValue} size={220} /> : <div className="h-[220px] w-[220px] bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-300"><span className="text-5xl mb-2">📷</span><span className="text-xs font-bold">Cargando QR…</span></div>}
        </div>
        <p className="mt-4 text-[11px] text-gray-500 font-semibold">Programa de lealtad digital powered by <span className="font-black text-pink-600">Punto IA</span>.</p>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
    <div className="bg-emerald-50 p-5 border-b border-emerald-100">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">📱</span>
        <div>
          <h3 className="text-sm font-black text-emerald-800">Escanear pase de cliente</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">Escanea el QR del Apple Wallet del cliente para registrar su visita</p>
        </div>
      </div>
    </div>
    <div className="p-5">
      <button
        onClick={() => { setScannerOpen(true); setScannerMsg('Apunta al QR del pase del cliente'); }}
        className="w-full px-4 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2"
      >
        <span className="text-lg">📷</span> Abrir Cámara
      </button>
      {scannerMsg && <p className="mt-3 text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{scannerMsg}</p>}
      {lastScannedCustomerId && <p className="mt-2 text-[11px] font-mono text-gray-400">Último cliente: {lastScannedCustomerId.slice(0, 8)}...</p>}
    </div>
  </div>
</div>
)}


{scannerOpen && (
<AnimatePresence>
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/90 p-0 md:p-8 flex items-center justify-center backdrop-blur-sm">
  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full h-full md:h-auto max-w-xl mx-auto bg-white md:rounded-3xl p-4 md:p-6 shadow-2xl md:border border-gray-200 flex flex-col relative overflow-hidden">
    
    {scannerSuccessFlash && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500/20 z-10 pointer-events-none" />
    )}

    <div className="flex items-center justify-between mb-3 shrink-0">
      <h3 className="text-lg font-black text-gray-900">Escanear pase de cliente</h3>
      <button
        onClick={() => setScannerOpen(false)}
        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold"
      >
        Cerrar
      </button>
    </div>

    <div className="relative rounded-2xl overflow-hidden border-2 border-gray-900 flex-1 bg-black min-h-[300px]">
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl"></div>
           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl"></div>
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl"></div>
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl"></div>
        </div>
      </div>
      <QRScanner
        paused={!scannerOpen}
        constraints={{ facingMode: 'environment' }}
        onScan={(codes: { rawValue: string }[]) => {
          const value = codes?.[0]?.rawValue;
          if (value) void handleAdminScan(value);
        }}
        onError={() => {
          setScannerMsg('No se pudo acceder a la cámara. Revisa permisos del navegador.');
        }}
      />
    </div>
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center shrink-0 relative z-20">
      <input
        inputMode="decimal"
        value={visitPurchaseAmount}
        onChange={(e) => setVisitPurchaseAmount(sanitizeCurrencyInput(e.target.value))}
        placeholder="Monto de compra (opcional)"
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
      />
      <span className="text-[11px] font-bold text-gray-500">Se guarda con esta visita (ej: 129.90)</span>
    </div>
    <p className="mt-2 text-xs font-semibold text-gray-500 text-center">Centra el código QR del cliente en el recuadro</p>
    {scannerMsg ? (
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`mt-4 p-4 rounded-xl text-center text-sm font-black shadow-lg ${scannerMsg.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-emerald-500 text-white'}`}>
        {scannerMsg}
      </motion.div>
    ) : null}
  </motion.div>
</motion.div>
</AnimatePresence>
)}


{tab === 'redeem' && (
<div className="max-w-md mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-orange-500 to-pink-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎁</span>
        <div>
          <h2 className="text-lg font-black">Validar Premio</h2>
          <p className="text-white/80 text-xs font-semibold">Ingresa el código alfanumérico de 8 caracteres que muestra el cliente</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-4">
        <input
          className="w-full p-4 text-center text-3xl font-mono font-black tracking-[0.35em] uppercase bg-white border-2 border-gray-200 rounded-2xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
          placeholder="A1B2C3D4"
          maxLength={8}
          value={redeemCode}
          onChange={e => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          inputMode="text"
        />
      </div>
      <button
        onClick={validateRedeem}
        disabled={isValidatingRedeem || redeemCode.length !== 8}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black py-4 rounded-2xl shadow-md disabled:opacity-40 disabled:shadow-none transition-all text-sm"
      >
        {isValidatingRedeem ? 'Validando...' : 'Validar y Entregar Premio'}
      </button>
      {msg && (
        <div className={`mt-4 p-4 rounded-2xl text-center font-bold text-sm border ${msg.includes('ENTREGAR') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : msg.includes('❌') || msg.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {msg}
        </div>
      )}
    </div>
  </div>

  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <p className="text-xs text-gray-500 font-semibold text-center">
      💡 El cliente genera un código alfanumérico seguro de 8 caracteres desde la app. Pídele el código y valídalo aquí antes de entregar el premio.
    </p>
  </div>
</div>
)}

{tab === 'push' && userRole === 'ADMIN' && (
<div className="max-w-lg mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📢</span>
        <div>
          <h2 className="text-lg font-black">Enviar Notificación</h2>
          <p className="text-white/80 text-xs font-semibold">Se envía a todos los clientes con pase instalado</p>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Envíos esta semana</p>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {pushRemaining != null ? `${2 - pushRemaining}/2` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Disponibles</p>
          <p className={`text-2xl font-black mt-0.5 ${pushRemaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {pushRemaining != null ? pushRemaining : '—'}
          </p>
        </div>
      </div>
      {pushCoverage ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-600">
          <p>Clientes con membresía: <span className="font-black text-gray-800">{pushCoverage.customerMemberships}</span></p>
          <p>Apple registrados: <span className="font-black text-gray-800">{pushCoverage.appleRegisteredDevices}</span></p>
          <p>Apple config: <span className={`font-black ${pushCoverage.appleConfigured ? 'text-emerald-600' : 'text-red-500'}`}>{pushCoverage.appleConfigured ? 'OK' : 'Falta'}</span></p>
          <p>Google config: <span className={`font-black ${pushCoverage.googleConfigured ? 'text-emerald-600' : 'text-red-500'}`}>{pushCoverage.googleConfigured ? 'OK' : 'Falta'}</span></p>
        </div>
      ) : null}

      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Mensaje de notificación</label>
        <textarea
          className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-purple-300 outline-none transition-all text-sm resize-none placeholder:text-gray-400"
          rows={3}
          maxLength={200}
          placeholder="Ej: ¡Hoy 2x1 en café! Ven y acumula puntos dobles"
          value={pushMessage}
          onChange={(e) => setPushMessage(e.target.value)}
        />
        <p className="text-[10px] text-gray-400 font-semibold mt-1 ml-1 text-right">{pushMessage.length}/200</p>
      </div>

      <button
        onClick={sendPush}
        disabled={pushLoading || !pushMessage.trim() || pushRemaining === 0}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black py-3.5 rounded-xl shadow-md disabled:opacity-40 disabled:shadow-none transition-all text-sm"
      >
        {pushLoading ? 'Enviando...' : pushRemaining === 0 ? 'Límite semanal alcanzado' : '📢 Enviar Notificación'}
      </button>

      {pushResult && (
        <div className={`p-3 rounded-xl text-center font-bold text-sm border ${pushResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : pushResult.startsWith('⚠️') ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {pushResult}
        </div>
      )}
      {pushDiagnostics ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-[11px] font-semibold text-gray-600">
          <p>Apple → enviados: <span className="font-black text-gray-800">{pushDiagnostics.apple?.sent || 0}</span> · fallidos: <span className="font-black text-gray-800">{pushDiagnostics.apple?.failed || 0}</span> · objetivo: <span className="font-black text-gray-800">{pushDiagnostics.apple?.targetedDevices || 0}</span></p>
          <p className="mt-1">Google → enviados: <span className="font-black text-gray-800">{pushDiagnostics.google?.sent || 0}</span> · fallidos: <span className="font-black text-gray-800">{pushDiagnostics.google?.failed || 0}</span></p>
        </div>
      ) : null}
    </div>
  </div>

  {pushHistory.length > 0 && (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-black text-gray-800">Historial de envíos</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {pushHistory.map((p, i) => (
          <div key={i} className="px-6 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{p.message}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                {new Date(p.sentAt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg shrink-0">
              {p.devices} dispositivo{p.devices === 1 ? '' : 's'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}

  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <p className="text-xs text-gray-500 font-semibold text-center">
      💡 La notificación aparece en la pantalla de bloqueo de tus clientes que tienen el pase en Apple Wallet. Máximo 2 envíos por semana.
    </p>
  </div>
</div>
)}

{tab === 'settings' && userRole === 'ADMIN' && (
<div className="max-w-lg mx-auto space-y-4 animate-fadeIn">

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏪</span>
      <div>
        <h2 className="text-lg font-black">Perfil del Negocio</h2>
        <p className="text-white/80 text-xs font-semibold">Datos básicos e identidad de tu marca</p>
      </div>
    </div>
  </div>
  <div className="p-6 space-y-4">
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Nombre del Negocio</label>
      <input className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 text-gray-500 font-bold border border-gray-100 cursor-not-allowed text-sm" value={tenant.name} readOnly />
    </div>
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">📸 Instagram</label>
      <input className="w-full p-3.5 bg-pink-50 rounded-xl mt-1 font-semibold text-pink-600 border border-pink-100 focus:bg-white focus:ring-2 focus:ring-pink-300 outline-none transition-all text-sm" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@tu_negocio" />
    </div>
<div>
  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Logo del negocio</label>
  <div className="mt-2 flex items-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden grid place-items-center">
      {logoData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoData} alt="Logo" className="w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icono.png" alt="Ícono Punto IA" className="w-full h-full object-cover" />
      )}
    </div>
    <div className="flex-1">
      <input
        type="file"
        accept="image/png"
        className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 200 * 1024) {
            notify('error', 'Imagen inválida o muy pesada. Usa PNG (máx ~400KB) para wallet.')

            return;
          }
          const reader = new FileReader();
          reader.onload = () => setLogoData(String(reader.result || ""));
          reader.readAsDataURL(file);
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLogoData('')}
          className="px-4 py-2 rounded-xl font-bold text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          Quitar
        </button>
        <span className="text-[11px] text-gray-400 font-semibold">Se guarda como imagen pequeña (MVP).</span>
      </div>
    </div>
  </div>
</div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">📱 Personalización Apple Wallet</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Colores e imagen del pase digital de tus clientes</p>
  </div>
  <div className="p-6 space-y-4">
  <div className="space-y-3">
    <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Personalización Apple Wallet</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label className="text-xs font-semibold text-gray-600">Fondo
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletBackgroundColor} onChange={e => setWalletBackgroundColor(e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-gray-600">Texto
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletForegroundColor} onChange={e => setWalletForegroundColor(e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-gray-600">Etiquetas
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletLabelColor} onChange={e => setWalletLabelColor(e.target.value)} />
      </label>
    </div>
  <div>
    <label className="text-xs font-semibold text-gray-600">Imagen cabecera del pase (strip)</label>
    <input
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      className="w-full p-3 bg-white rounded-xl mt-1 text-sm font-medium text-gray-800 border border-gray-200"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          notify('error', 'Imagen muy pesada. Usa una imagen menor a 2MB para convertirla a strip.')
          return;
        }
        try {
          const pngDataUrl = await toPngStripDataUrl(file);
          setWalletStripImageData(pngDataUrl);
        } catch (error) {
          notify('error', error instanceof Error ? error.message : 'No se pudo procesar la imagen para Wallet.')
        }
      }}
    />
    <div className="mt-2 flex items-center gap-2">
      <button type="button" onClick={() => setWalletStripImageData(null)} className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-200 text-gray-700">Quitar imagen</button>
      <span className="text-[11px] text-gray-500 font-semibold">
        Puedes subir PNG/JPG/WEBP. Se convierte automático a PNG strip 1242x492 (2.5:1).
      </span>
    </div>
    {walletStripImageData ? (
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={walletStripImageData} alt="Preview strip wallet" className="w-full h-24 object-cover" />
      </div>
    ) : null}
  </div>

  </div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">📍 Ubicación</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Aparece en el mapa de negocios aliados</p>
  </div>
  <div className="p-6 space-y-3">
    <div className="flex gap-2">
      <input className="flex-1 p-3 bg-gray-50 rounded-xl text-gray-800 text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-200 font-semibold" placeholder="Buscar dirección..." value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} />
      <button onClick={searchLocation} disabled={isSearching} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shrink-0 text-sm" aria-label="Buscar">{isSearching ? '...' : '🔍'}</button>
    </div>
    <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-gray-200 z-0 relative"><AdminMap coords={coords} setCoords={setCoords} /></div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">🤝 Red Punto IA</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Participación en campañas y promociones de la coalición</p>
  </div>
  <div className="p-6">
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-black text-indigo-700">🤝 Promo de Coalición (captación de nuevos clientes)</p>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <input type="checkbox" checked={coalitionOptIn} onChange={e => setCoalitionOptIn(e.target.checked)} />
        Quiero participar en retos de coalición
      </label>
      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Descuento mínimo ofrecido (%)</label>
        <input
          type="number"
          min="10"
          disabled={!coalitionOptIn}
          className="w-full p-3.5 bg-white rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-indigo-300 outline-none transition-all text-sm disabled:opacity-60"
          value={coalitionDiscountPercent}
          onChange={e => setCoalitionDiscountPercent(e.target.value)}
        />
        <p className="text-[11px] text-gray-500 font-semibold mt-1.5 ml-1">Para activar esta promo debes ofrecer al menos 10% de descuento.</p>
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Producto participante</label>
        <input
          disabled={!coalitionOptIn}
          className="w-full p-3.5 bg-white rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-indigo-300 outline-none transition-all text-sm disabled:opacity-60"
          value={coalitionProduct}
          onChange={e => setCoalitionProduct(e.target.value)}
          placeholder="Ej: Corte clásico, Combo ejecutivo, Latte 12oz"
        />
      </div>
    </div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-yellow-100 overflow-hidden">
  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎯</span>
      <div>
        <h3 className="text-sm font-black">Programa Lealtad y Premios</h3>
        <p className="text-white/80 text-xs font-semibold">Configura metas, premio final y beneficios intermedios</p>
      </div>
    </div>
  </div>
  <div className="p-5 space-y-6">
    <div className="space-y-4">
      <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider border-b border-amber-100 pb-2">Reglas del Programa Base</h4>
      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">🎁 Premio al Completar Visitas</label>
        <input className="w-full p-3.5 bg-white rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm placeholder:text-gray-400" value={prizeName} onChange={e => setPrizeName(e.target.value)} placeholder="Ej: Café gratis, 2x1, Descuento 20%" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Visitas para ganar premio</label>
          <input
            type="number"
            min="1"
            max={String(MAX_REQUIRED_VISITS)}
            className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
            value={requiredVisits}
            onChange={e => {
              const nextValue = e.target.value;
              if (!nextValue) {
                setRequiredVisits('');
                return;
              }
              setRequiredVisits(String(sanitizeRequiredVisits(nextValue, DEFAULT_REQUIRED_VISITS)));
            }}
            onBlur={() => setRequiredVisits(String(sanitizeRequiredVisits(requiredVisits || DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS)))}
          />
          <p className="text-[11px] text-gray-400 font-semibold mt-1.5 ml-1">Meta del pase: {normalizedRequiredVisits} visitas. M&aacute;ximo {MAX_REQUIRED_VISITS}.</p>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Vigencia del contador</label>
          <select className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm" value={rewardPeriod} onChange={e => setRewardPeriod(e.target.value)}>
            <option value="OPEN">♾️ Sin caducidad</option>
            <option value="MONTHLY">📅 Mensual</option>
            <option value="QUARTERLY">📊 Trimestral</option>
            <option value="SEMESTER">📆 Semestral</option>
            <option value="ANNUAL">🗓️ Anual</option>
          </select>
        </div>
      </div>
    </div>
    
    <div className="space-y-3 pt-4 border-t border-amber-100">
      <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">🪜 Escalera de Beneficios (Opcional)</h4>
      <p className="text-[11px] text-gray-400 font-semibold -mt-2 mb-3">Premia a tus clientes en visitas intermedias específicas (ej: visita 3, 7, 10).</p>
      <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Vista Previa del Pase (Wallet)</p>
      <div 
        className="w-full rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center p-6 relative py-10"
        style={{
          backgroundColor: walletBackgroundColor || '#1F2937',
          backgroundImage: walletStripImageData
            ? `linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.34)), url("${walletStripImageData}")`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="grid grid-cols-5 justify-items-center items-start w-full gap-x-2 gap-y-5 md:gap-x-4 md:gap-y-6">
          {Array.from({ length: normalizedRequiredVisits }, (_, i) => {
            const visitIndex = i + 1;
            const isAchieved = visitIndex <= Math.floor(normalizedRequiredVisits * 0.4);
            const milestone = milestones.find(m => Number(m.visitTarget) === visitIndex);
            const hasMilestone = !!milestone;
            const isFinalNode = visitIndex === normalizedRequiredVisits;
            
            return (
              <div key={visitIndex} className="flex flex-col items-center justify-center z-[2] relative">
                <div 
                  className={`flex items-center justify-center rounded-full border-[3px] shadow-sm transition-all overflow-hidden w-12 h-12 md:w-16 md:h-16`}
                  style={{
                    backgroundColor: isAchieved ? (walletLabelColor || '#3B82F6') : 'rgba(255,255,255,0.78)',
                    borderColor: 'rgba(255,255,255,0.92)',
                    boxShadow: isAchieved ? `0 0 18px ${walletLabelColor || '#3B82F6'}` : '0 10px 22px rgba(0,0,0,0.26)',
                  }}
                >
                  {hasMilestone ? (
                    <span className="text-2xl md:text-3xl translate-y-px">{milestone.emoji || '🎁'}</span>
                  ) : isFinalNode ? (
                    <span className="text-xl md:text-2xl translate-y-px">{prizeEmoji || '🏆'}</span>
                  ) : (
                    <div
                      className="rounded-full w-2/3 h-2/3 flex items-center justify-center text-sm md:text-base"
                      style={{
                        background: isAchieved
                          ? 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 100%)'
                          : 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.78) 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        textShadow: '0 2px 8px rgba(0,0,0,0.62)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 6px 14px rgba(0,0,0,0.26)',
                        border: `2px solid ${isAchieved ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.3)'}`,
                      }}
                    >
                       {visitIndex}
                    </div>
                  )}
                </div>
                {(hasMilestone || isFinalNode) && (
                  <div className="absolute -bottom-6 text-center w-24 md:w-28 flex flex-col items-center">
                    <span
                      style={{
                        color: '#FFFFFF',
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                        backgroundColor: 'rgba(17,24,39,0.34)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                      }}
                      className="text-[10px] md:text-[11px] font-black leading-[1.05] uppercase rounded-full px-2 py-1"
                    >
                      {hasMilestone ? milestone.reward : (prizeName || 'Premio Final')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-[10px] md:text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {tenant.name} · Progreso de Ejemplo
        </div>
      </div>
      <p className="text-[10px] text-gray-400 font-semibold text-center">Así se verá tu escalera gráfica en el Apple Wallet y Google Wallet de tus clientes.</p>
    </div>

    <div className="space-y-3 pt-2 border-t border-amber-100">
    {milestones.length === 0 && (
      <p className="text-xs text-gray-400 font-semibold text-center py-2">Sin hitos configurados. Agrega el primero abajo.</p>
    )}
    {milestones.map((m, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <input
          type="text"
          value={m.emoji}
          onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, emoji: e.target.value } : row))}
          className="w-12 text-center p-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-300"
          maxLength={4}
          placeholder="🎁"
        />
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 focus-within:ring-2 focus-within:ring-amber-300 focus-within:bg-white transition">
          <span className="text-xs font-black text-gray-400 shrink-0">Visita</span>
          <input
            type="number"
            min="1"
            value={m.visitTarget}
            onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, visitTarget: e.target.value } : row))}
            className="w-14 bg-transparent p-2 text-sm font-black text-gray-900 outline-none"
          />
        </div>
        <input
          type="text"
          value={m.reward}
          onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, reward: e.target.value } : row))}
          className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-amber-300 focus:bg-amber-50 transition"
          placeholder="Ej: Agua, Postre, Tacos"
        />
        <button
          type="button"
          onClick={() => setMilestones(prev => prev.filter((_, i) => i !== idx))}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
          title="Eliminar hito"
        >
          ✕
        </button>
      </div>
    ))}

    <div className="flex items-center gap-2 mt-2 select-none">
      <input
        type="text"
        value={prizeEmoji}
        onChange={e => setPrizeEmoji(e.target.value)}
        className="w-12 text-center p-2 bg-amber-200 border border-amber-300 rounded-xl text-sm font-bold text-amber-800 outline-none focus:ring-2 focus:ring-amber-400"
        maxLength={4}
        title="Emoji del premio final"
      />
      <div className="flex items-center bg-gray-100 border border-gray-300 rounded-xl px-2">
        <span className="text-xs font-black text-gray-500 shrink-0">Visita</span>
        <div className="w-14 bg-transparent p-2 text-sm font-black text-gray-900 text-center">
          {normalizedRequiredVisits}
        </div>
      </div>
      <div className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 truncate" title={prizeName || 'Premio Final'}>
        {prizeName || 'Premio Final'}
      </div>
      <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400" title="Premio final (guarda la escalera para actualizar el emoji)">
        🔒
      </div>
    </div>
    <button
      type="button"
      onClick={() => setMilestones(prev => [...prev, { visitTarget: '', reward: '', emoji: '🎁' }])}
      className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 font-black text-sm hover:bg-amber-50 transition"
    >
      + Agregar hito
    </button>
    <button
      onClick={saveMilestones}
      disabled={isSavingMilestones}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-3 rounded-xl shadow-md disabled:opacity-60 text-sm"
    >
      {isSavingMilestones ? 'Guardando escalera...' : '🪜 Guardar Escalera de Beneficios'}
    </button>
  </div>
</div>
</div>

<button onClick={saveSettings} disabled={isSavingSettings} className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-2xl font-black shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-60">
  {isSavingSettings ? 'Guardando cambios...' : '💾 Guardar Todos los Cambios'}
</button>
</div>
)}
</div>
</div>
);
}
