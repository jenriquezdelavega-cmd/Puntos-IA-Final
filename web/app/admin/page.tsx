'use client';
import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedDashboard, { type AdvancedReportView } from '../components/admin/AdvancedDashboard';
import { buildMilestonesPayloadForSave, normalizeMilestonesForEditor } from '../lib/loyalty-milestones';
import { DEFAULT_REQUIRED_VISITS, MAX_REQUIRED_VISITS, sanitizeRequiredVisits } from '../lib/loyalty-program';
import { BUSINESS_CATEGORIES, DEFAULT_BUSINESS_CATEGORY, isBusinessCategory, type BusinessCategory } from '../lib/business-categories';

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
  businessCategory?: string;
  ticketControlEnabled?: boolean;
};

type MilestoneRow = { id?: string; visitTarget: string; reward: string; emoji: string };

type TeamMember = { id: string; name?: string; username?: string; role?: string };
type AdminTab = 'dashboard' | 'team' | 'qr' | 'redeem' | 'push' | 'settings' | 'manuals';
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
const [ticketControlEnabled, setTicketControlEnabled] = useState(false);
const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(DEFAULT_BUSINESS_CATEGORY);
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
const [newStaff, setNewStaff] = useState({ name: '', email: '', username: '', role: 'STAFF' });
const [lastScannedCustomerId, setLastScannedCustomerId] = useState('');
const [visitPurchaseAmount, setVisitPurchaseAmount] = useState('');
const [visitTicketNumber, setVisitTicketNumber] = useState('');

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

const parseBusinessCategory = (value: unknown): BusinessCategory =>
  isBusinessCategory(value) ? value : DEFAULT_BUSINESS_CATEGORY;
const [isSavingMilestones, setIsSavingMilestones] = useState(false);

const [isLoggingIn, setIsLoggingIn] = useState(false);
const [isCreatingStaff, setIsCreatingStaff] = useState(false);
const [isSavingSettings, setIsSavingSettings] = useState(false);
const [isValidatingRedeem, setIsValidatingRedeem] = useState(false);
const [isRefreshingReports, setIsRefreshingReports] = useState(false);
const [mustChangePassword, setMustChangePassword] = useState(false);
const [currentPasswordInput, setCurrentPasswordInput] = useState('');
const [newPasswordInput, setNewPasswordInput] = useState('');
const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
const [isChangingPassword, setIsChangingPassword] = useState(false);

// ── Optimistic save state ──
const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
const [settingsDirty, setSettingsDirty] = useState(false);
const markDirty = () => { setSettingsDirty(true); setSaveStatus('idle'); };

// ── Delete staff confirmation modal ──
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

const navItems: NavItem[] = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', adminOnly: true },
  { key: 'team', icon: '👥', label: 'Equipo', adminOnly: true },
  { key: 'qr', icon: '📷', label: 'QR' },
  { key: 'redeem', icon: '🎁', label: 'Canje' },
  { key: 'push', icon: '📢', label: 'Push', adminOnly: true },
  { key: 'manuals', icon: '📘', label: 'Manuales', adminOnly: true },
  { key: 'settings', icon: '⚙️', label: 'Config', adminOnly: true },
];

const visibleNavItems = navItems.filter((item) => !item.adminOnly || userRole === 'ADMIN');
const normalizedRequiredVisits = sanitizeRequiredVisits(requiredVisits || DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS);

const notify = (type: 'success' | 'error' | 'info', text: string) => {
  setUiNotice({ type, text });
  // Auto-dismiss after 4 seconds
  setTimeout(() => setUiNotice(null), 4000);
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
      setMustChangePassword(Boolean(data?.user?.mustChangePassword));
      setCurrentPasswordInput(password);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPrizeName(data.tenant.prize || '');
      setInstagram(data.tenant.instagram || '');
      setCoalitionOptIn(Boolean(data.tenant.coalitionOptIn));
      setCoalitionDiscountPercent(String(data.tenant.coalitionDiscountPercent ?? 10));
      setCoalitionProduct(String(data.tenant.coalitionProduct ?? ''));
      setTicketControlEnabled(Boolean(data.tenant.ticketControlEnabled));
      setBusinessCategory(parseBusinessCategory(data.tenant.businessCategory));
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
    const loyaltySettingsRes = await fetch('/api/tenant/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantUserId,
        tenantSessionToken,
        prize: prizeName,
        requiredVisits: required,
        rewardPeriod,
      }),
    });
    const loyaltySettingsData = await loyaltySettingsRes.json();
    if (!loyaltySettingsRes.ok) {
      notify('error', String(loyaltySettingsData.error || 'No se pudo guardar la configuración base del programa.'));
      return;
    }

    if (loyaltySettingsData?.tenant) {
      setTenant(loyaltySettingsData.tenant);
      setPrizeName(loyaltySettingsData.tenant.prize || '');
      setRequiredVisits(
        String(
          sanitizeRequiredVisits(
            loyaltySettingsData.tenant.requiredVisits ?? DEFAULT_REQUIRED_VISITS,
            DEFAULT_REQUIRED_VISITS,
          ),
        ),
      );
      setRewardPeriod(String(loyaltySettingsData.tenant.rewardPeriod ?? 'OPEN'));
    }

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

    // Forzar una sincronización final después de persistir hitos para que Apple y Google
    // reflejen la misma versión del programa aunque haya dos guardados consecutivos.
    const refreshRes = await fetch('/api/admin/wallet-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantUserId,
        tenantSessionToken,
      }),
    });
    if (!refreshRes.ok) {
      const refreshData = await refreshRes.json().catch(() => ({}));
      notify('error', String(refreshData?.error || 'Se guardó el programa, pero no se pudo refrescar Wallet.'));
      return;
    }

    notify('success', 'Escalera de beneficios guardada correctamente.');
  } catch {
    notify('error', 'Error de conexión al guardar la escalera.');
  } finally {
    setIsSavingMilestones(false);
  }
};

const createStaff = async () => {
if(!newStaff.name || !newStaff.email || !newStaff.username) return notify('error', 'Faltan datos para crear empleado.');
setIsCreatingStaff(true);
try {
const res = await fetch('/api/tenant/users', { 
method: 'POST', headers: {'Content-Type': 'application/json'}, 
body: JSON.stringify({ tenantId: tenant.id, tenantUserId, tenantSessionToken, ...newStaff }) 
});
if(res.ok) {
const data = await res.json();
const emailStatus = String(data?.emailDelivery || 'not_configured');
const emailMsg =
  emailStatus === 'sent'
    ? 'Se envió correo de creación de cuenta.'
    : emailStatus === 'failed'
      ? 'No se pudo enviar correo automáticamente.'
      : 'SMTP no configurado: comparte la contraseña temporal manualmente.';
notify('success', `Empleado creado. Contraseña temporal: ${String(data?.temporaryPassword || 'N/D')}. ${emailMsg}`);
setNewStaff({ name: '', email: '', username: '', role: 'STAFF' });
loadTeam(tenant.id, tenantUserId); 
} else { const d = await res.json(); notify('error', String(d.error || 'No se pudo crear el empleado')); }
} catch { notify('error', 'Ocurrió un error de conexión.'); }
setIsCreatingStaff(false);
};

const deleteStaff = async (id: string) => {
try { await fetch('/api/tenant/users', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id, tenantId: tenant.id, tenantUserId, tenantSessionToken }) }); loadTeam(tenant.id, tenantUserId); setDeleteConfirmId(null); } catch { notify('error', 'No se pudo eliminar el empleado.'); }
};

const changeOwnPassword = async () => {
  if (!tenant?.id) return;
  if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
    notify('error', 'Completa todos los campos de contraseña.');
    return;
  }
  if (newPasswordInput !== confirmPasswordInput) {
    notify('error', 'La confirmación de contraseña no coincide.');
    return;
  }

  setIsChangingPassword(true);
  try {
    const res = await fetch('/api/tenant/password/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantUserId,
        tenantSessionToken,
        currentPassword: currentPasswordInput,
        newPassword: newPasswordInput,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify('error', String(data.error || 'No se pudo cambiar la contraseña'));
      return;
    }
    setPassword(newPasswordInput);
    setMustChangePassword(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    notify('success', 'Contraseña actualizada. Ya puedes usar el panel normalmente.');
  } catch {
    notify('error', 'Error de conexión al cambiar la contraseña.');
  } finally {
    setIsChangingPassword(false);
  }
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

type SettingsSaveScope = 'location' | 'design' | 'operation' | 'all';

const saveSettings = async (scope: SettingsSaveScope = 'all') => {
  setIsSavingSettings(true);
  setSaveStatus('saving');

  // Optimistic feedback: show "saved" after 350ms regardless, revert on error
  const optimisticTimer = setTimeout(() => setSaveStatus('saved'), 350);

  try {
    const settingsPayload: Record<string, unknown> = {
      tenantId: tenant.id,
      tenantUserId,
      tenantSessionToken,
    };

    if (scope === 'all' || scope === 'design') {
      settingsPayload.logoData = logoData;
      settingsPayload.walletBackgroundColor = walletBackgroundColor || undefined;
      settingsPayload.walletForegroundColor = walletForegroundColor || undefined;
      settingsPayload.walletLabelColor = walletLabelColor || undefined;
      settingsPayload.walletStripImageData = walletStripImageData;
    }

    if (scope === 'all' || scope === 'location') {
      settingsPayload.lat = coords[0];
      settingsPayload.lng = coords[1];
      settingsPayload.address = addressSearch;
      settingsPayload.instagram = instagram;
      settingsPayload.businessCategory = businessCategory;
    }

    if (scope === 'all' || scope === 'operation') {
      settingsPayload.coalitionOptIn = coalitionOptIn;
      settingsPayload.coalitionDiscountPercent = coalitionDiscountPercent;
      settingsPayload.coalitionProduct = coalitionProduct;
      settingsPayload.ticketControlEnabled = ticketControlEnabled;
    }

    const res = await fetch('/api/tenant/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      clearTimeout(optimisticTimer);
      setSaveStatus('error');
      notify('error', String(data.error || 'Error guardando'));
      return;
    }

    if (data?.tenant) {
      setTenant(data.tenant);
      setLogoData(String(data.tenant.logoData ?? ''));
      setPrizeName(data.tenant.prize || '');
      setInstagram(data.tenant.instagram || '');
      setCoalitionOptIn(Boolean(data.tenant.coalitionOptIn));
      setCoalitionDiscountPercent(String(data.tenant.coalitionDiscountPercent ?? 10));
      setCoalitionProduct(String(data.tenant.coalitionProduct ?? ''));
      setTicketControlEnabled(Boolean(data.tenant.ticketControlEnabled));
      setBusinessCategory(parseBusinessCategory(data.tenant.businessCategory));
      setRequiredVisits(String(sanitizeRequiredVisits(data.tenant.requiredVisits ?? DEFAULT_REQUIRED_VISITS, DEFAULT_REQUIRED_VISITS)));
      setRewardPeriod(String(data.tenant.rewardPeriod ?? 'OPEN'));
      setWalletBackgroundColor(String(data.tenant.walletBackgroundColor ?? walletBackgroundColor));
      setWalletForegroundColor(String(data.tenant.walletForegroundColor ?? walletForegroundColor));
      setWalletLabelColor(String(data.tenant.walletLabelColor ?? walletLabelColor));
      setWalletStripImageData(data.tenant.walletStripImageData || '');
    }

    setSettingsDirty(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);

    const scopeLabel = scope === 'location' ? 'Ubicación e identidad'
      : scope === 'design' ? 'Diseño del pase'
      : scope === 'operation' ? 'Operación'
      : 'Configuración';
    notify('success', `${scopeLabel} guardada correctamente.`);
  } catch {
    clearTimeout(optimisticTimer);
    setSaveStatus('error');
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

// Genera un QR que lleva al cliente directo a la página de ingreso con los parámetros para unirse automáticamente
const onboardingQrValue = tenant?.id ? `${baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/ingresar?tipo=cliente&modo=register&business_id=${encodeURIComponent(String(tenant.id))}&flow=create-pass&auth=welcome` : '';

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
      body: JSON.stringify({
        userId: customerId,
        code: todayCode,
        tenantUserId,
        tenantSessionToken,
        purchaseAmount: visitPurchaseAmount,
        ticketNumber: ticketControlEnabled ? visitTicketNumber : '',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'No se pudo registrar visita');

    const amount = Number(data.purchaseAmount || 0);
    const ticket = String(data.ticketNumber || '').trim();
    const amountBadge = amount > 0 ? ` · Compra: $${amount.toFixed(2)}` : '';
    const ticketBadge = ticket ? ` · Ticket: ${ticket}` : '';
    setScannerMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})${amountBadge}${ticketBadge}`);
    setMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})${amountBadge}${ticketBadge}`);
    setLastScannedCustomerId(customerId);
    setVisitPurchaseAmount('');
    setVisitTicketNumber('');
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

if (!tenant) return (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div className="w-full max-w-sm animate-slideUp">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40 mb-4">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">punto<span className="text-indigo-400">IA</span></h1>
        <p className="text-slate-400 text-sm mt-1 font-medium">Panel de Administración</p>
      </div>
      {/* Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        <h2 className="text-white font-bold text-base mb-1">Inicia sesión</h2>
        <p className="text-slate-500 text-xs mb-6">Ingresa con tu usuario y contraseña del negocio</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Usuario</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 text-sm font-medium"
              placeholder="Ej: TACOS.maria"
              value={username}
              autoComplete="username"
              onChange={e=>setUsername(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-600 text-sm font-medium"
              placeholder="Tu contraseña"
              value={password}
              autoComplete="current-password"
              onChange={e=>setPassword(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          {uiNotice?.type === 'error' && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-xs font-semibold animate-fadeIn">
              {uiNotice.text}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-bold py-3 rounded-xl text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoggingIn ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</>
            ) : 'Entrar al panel'}
          </button>
        </form>
        <a href="/recuperar?scope=tenant" className="mt-5 block text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">¿Olvidaste tu contraseña?</a>
      </div>
      <p className="text-center text-slate-600 text-xs mt-6">Acceso exclusivo para personal autorizado</p>
    </div>
  </div>
);

if (mustChangePassword) {
  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">🔑</div>
          <div>
            <h2 className="text-white font-black text-base">Cambia tu contraseña</h2>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Tu cuenta tiene una contraseña temporal. Debes cambiarla para continuar.</p>
          </div>
        </div>
        <div className="space-y-3">
          <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-sm font-medium placeholder:text-slate-600" placeholder="Contraseña actual" value={currentPasswordInput} onChange={(e)=>setCurrentPasswordInput(e.target.value)} disabled={isChangingPassword} />
          <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-sm font-medium placeholder:text-slate-600" placeholder="Nueva contraseña (mínimo 6 caracteres)" value={newPasswordInput} onChange={(e)=>setNewPasswordInput(e.target.value)} disabled={isChangingPassword} />
          <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-sm font-medium placeholder:text-slate-600" placeholder="Confirmar nueva contraseña" value={confirmPasswordInput} onChange={(e)=>setConfirmPasswordInput(e.target.value)} disabled={isChangingPassword} />
          {uiNotice?.type === 'error' && <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-xs font-semibold">{uiNotice.text}</div>}
          <button onClick={changeOwnPassword} disabled={isChangingPassword} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isChangingPassword ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>) : 'Guardar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}


return (
<div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

{/* ── Sidebar ── */}
<div className="w-full md:w-60 bg-slate-950 text-white flex md:flex-col p-3 md:p-5 fixed inset-x-3 bottom-3 md:inset-x-0 md:bottom-auto md:relative z-50 md:h-screen md:min-h-screen justify-between md:justify-start border border-slate-800/80 md:border-r md:border-t-0 md:border-l-0 md:border-b-0 rounded-[1.75rem] md:rounded-none shadow-[0_-8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl md:shadow-none md:backdrop-blur-none">
  {/* Logo – desktop */}
  <div className="hidden md:flex items-center gap-3 mb-8 px-1">
    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
    <div>
      <p className="text-white font-black text-base tracking-tight leading-none">punto<span className="text-indigo-400">IA</span></p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${userRole==='ADMIN'?'bg-indigo-600/30 text-indigo-300':'bg-sky-600/30 text-sky-300'}`}>{userRole === 'ADMIN' ? 'Administrador' : 'Operador'}</span>
    </div>
  </div>
  {/* Nav */}
  <nav className="flex md:flex-col gap-1 w-full md:justify-start overflow-x-auto md:overflow-visible pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-1">
    {visibleNavItems.map((item) => (
      <button
        key={item.key}
        onClick={() => setTab(item.key)}
        className={`shrink-0 min-w-[72px] md:min-w-0 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2.5 md:py-2.5 rounded-xl transition-all duration-150 ${
          tab===item.key
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        aria-current={tab === item.key ? 'page' : undefined}
      >
        <span className="text-lg md:text-base leading-none">{item.icon}</span>
        <span className="text-[9px] md:text-xs font-bold uppercase md:normal-case tracking-wider md:tracking-normal">{item.label}</span>
      </button>
    ))}
  </nav>
  {/* Footer – desktop */}
  <div className="hidden md:block pt-4 border-t border-slate-800 mt-4">
    <p className="font-semibold text-xs text-slate-400 truncate mb-0.5">{tenant.name}</p>
    <p className="font-mono text-[10px] text-slate-600 truncate mb-3">Sesión activa</p>
    <button onClick={() => setTenant(null)} className="w-full text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 px-3 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
      Cerrar sesión
    </button>
  </div>
</div>

{/* ── Close btn – mobile ── */}
<button onClick={() => setTenant(null)} className="md:hidden fixed top-3 right-3 z-[60] bg-slate-900 text-slate-400 hover:text-white border border-slate-700 w-8 h-8 rounded-full font-bold flex items-center justify-center shadow-lg transition">
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
</button>

{/* ── Delete confirmation modal ── */}
{deleteConfirmId && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-sm mx-4 animate-slideUp">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">⚠️</div>
        <div>
          <h3 className="font-black text-gray-900 text-sm">¿Eliminar este empleado?</h3>
          <p className="text-gray-500 text-xs mt-0.5">Esta acción no se puede deshacer. El operador perderá acceso inmediatamente.</p>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">Cancelar</button>
        <button onClick={() => deleteStaff(deleteConfirmId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition shadow-sm">Sí, eliminar</button>
      </div>
    </div>
  </div>
)}

{/* ── Main content ── */}
<div className="flex-1 p-4 md:p-8 overflow-y-auto pb-32 md:pb-8">

{/* Toast */}
{uiNotice && tab !== 'settings' ? (
  <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-fadeInSlide">
    <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between gap-3 shadow-xl border ${
      uiNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : uiNotice.type === 'error' ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <span className="flex items-center gap-2">
        <span>{uiNotice.type === 'success' ? '✅' : uiNotice.type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>{uiNotice.text}</span>
      </span>
      <button onClick={() => setUiNotice(null)} className="text-current opacity-40 hover:opacity-80 shrink-0 transition">✕</button>
    </div>
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
<div className="max-w-5xl mx-auto animate-fadeIn">
  <div className="mb-7">
    <h2 className="text-xl font-black text-slate-900">Gestión de Personal</h2>
    <p className="text-slate-500 text-sm mt-1">Crea y administra los operadores que atienden a tus clientes</p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7 space-y-5">

      {/* Add staff card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800">➕ Agregar operador</h3>
          <p className="text-xs text-slate-500 mt-0.5">Cada empleado tendrá su propio acceso para registrar visitas</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
              <input className="w-full px-3.5 py-3 bg-slate-50 rounded-xl outline-none border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 focus:bg-white transition text-sm font-semibold" placeholder="Ej: Pedro García" value={newStaff.name} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo electrónico</label>
              <input type="email" className="w-full px-3.5 py-3 bg-slate-50 rounded-xl outline-none border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 focus:bg-white transition text-sm font-semibold" placeholder="pedro@correo.com" value={newStaff.email} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre de usuario</label>
            <div className="flex items-center bg-slate-50 rounded-xl px-3.5 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:bg-white transition">
              <span className="text-slate-400 font-mono text-xs font-black mr-1 select-none shrink-0">{tenant.codePrefix || 'PREFIJO'}.</span>
              <input className="bg-transparent w-full py-3 outline-none font-semibold text-slate-900 placeholder:text-slate-400 text-sm" placeholder="pedro" value={newStaff.username} disabled={isCreatingStaff} onChange={e=>setNewStaff({...newStaff, username: e.target.value})} />
            </div>
          </div>
          <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <span className="mt-0.5">🔐</span>
            <span>Se generará una contraseña temporal automáticamente. El operador deberá cambiarla al primer ingreso.</span>
          </div>
          <button onClick={createStaff} disabled={isCreatingStaff} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl shadow-sm text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {isCreatingStaff ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</>) : '+ Agregar operador'}
          </button>
        </div>
      </div>

      {/* Team list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <h3 className="text-sm font-black text-slate-800">Tu equipo</h3>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">{team.length}</span>
        </div>
        <div className="divide-y divide-slate-50">
          {team.length > 0 ? team.map((u: TeamMember) => (
            <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                  u.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-slate-600'
                }`}>
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{u.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-400 truncate">{u.username}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                      u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>{u.role === 'ADMIN' ? 'Admin' : 'Operador'}</span>
                  </div>
                </div>
              </div>
              {u.role !== 'ADMIN' && (
                <button
                  onClick={() => setDeleteConfirmId(String(u.id))}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition shrink-0"
                  title="Eliminar operador"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          )) : (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-300 text-3xl mb-2">👥</p>
              <p className="text-slate-400 text-sm font-semibold">Sin operadores registrados aún</p>
              <p className="text-slate-400 text-xs mt-1">Agrega a tu primer empleado usando el formulario de arriba</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6 self-start">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">Diferencia de roles</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm shrink-0">👑</div>
            <div>
              <p className="text-white text-xs font-black">Administrador</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Acceso total: reportes, configuración, notificaciones y gestión de equipo.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center text-sm shrink-0">👤</div>
            <div>
              <p className="text-white text-xs font-black">Operador (Staff)</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Solo puede escanear pases y canjear premios. Sin acceso a ajustes ni datos.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
        <p className="text-amber-800 text-xs font-black uppercase tracking-wider mb-3">Buenas prácticas</p>
        <ul className="space-y-2 text-xs text-amber-900/80 font-semibold">
          <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span> Una cuenta por operador — nunca compartas credenciales.</li>
          <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span> Elimina el acceso cuando un operador deje el negocio.</li>
          <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">•</span> El operador recibe su contraseña por correo automáticamente.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
)}

{tab === 'qr' && (
<div className="max-w-5xl mx-auto animate-fadeIn">
  <div className="mb-6">
    <h2 className="text-2xl font-black text-gray-900">Registro de Visitas</h2>
    <p className="text-gray-500 font-semibold mt-1 text-sm">Escanea pases o compártelos con clientes nuevos</p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7 space-y-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-gray-300">
        <div className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] p-5 text-white print:bg-none print:text-gray-900 print:border-b print:border-gray-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-pink-200 print:text-pink-700">Punto IA</p>
              <h2 className="text-lg font-black">QR para crear pase</h2>
              <p className="text-gray-300 text-xs font-semibold mt-0.5 print:text-gray-600">Tus clientes escanean, se registran e instalan su pase en Apple o Google Wallet.</p>
            </div>
            <button onClick={printOnboardingQr} className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition shrink-0 print:hidden">
              🖶️ Imprimir
            </button>
          </div>
        </div>
        <div className="p-6 flex flex-col items-center gap-5">
          <div className="w-full rounded-3xl border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Escanea y activa tu pase</p>
            <p className="mt-1 text-xs text-gray-600 font-semibold">1) Crea tu cuenta · 2) Abre tu pase · 3) Guárdalo en Apple o Google Wallet</p>
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
              <h3 className="text-sm font-black text-emerald-800">Registrar Visita (Escanear pase)</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">Escanea el QR del pase Apple/Google del cliente para registrar su visita</p>
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

    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8 self-start">
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl border border-blue-100 p-6 shadow-sm">
        <h4 className="text-blue-800 text-sm font-black flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span> ¿Cómo funciona?
        </h4>
        <ol className="space-y-4">
          <li className="text-xs text-blue-900/80 font-bold leading-relaxed flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">1</div>
            <span><strong>Imprime o muestra</strong> el QR de onboarding en tu establecimiento. Los clientes lo escanean con su cámara.</span>
          </li>
          <li className="text-xs text-blue-900/80 font-bold leading-relaxed flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">2</div>
            <span>El cliente crea su cuenta y descarga su pase digital en <strong>Apple o Google Wallet</strong>.</span>
          </li>
          <li className="text-xs text-blue-900/80 font-bold leading-relaxed flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">3</div>
            <span>En cada visita, el operador <strong>escanea el QR del pase</strong> del cliente para registrar la visita instantáneamente.</span>
          </li>
        </ol>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">⚠️ Importante</p>
        <ul className="space-y-2 text-xs text-gray-600 font-semibold">
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span> El QR de onboarding lleva al cliente a crear su cuenta. Es diferente al QR del pase.</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span> Solo escanea el QR del <strong>pase del cliente</strong> para registrar visitas, no el QR de onboarding.</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span> Los pases se actualizan automáticamente después de cada visita registrada.</li>
        </ul>
      </div>
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
    {ticketControlEnabled ? (
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center shrink-0 relative z-20">
        <input
          value={visitTicketNumber}
          onChange={(e) => setVisitTicketNumber(e.target.value.toUpperCase().replace(/\s+/g, '').slice(0, 40))}
          placeholder="# de ticket (opcional)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
        />
        <span className="text-[11px] font-bold text-gray-500">Úsalo si tu negocio desea control por folio</span>
      </div>
    ) : null}
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
<div className="max-w-5xl mx-auto animate-fadeIn">
  <div className="mb-6">
    <h2 className="text-2xl font-black text-gray-900">Canjear Premio</h2>
    <p className="text-gray-500 font-semibold mt-1 text-sm">Valida el código del cliente antes de entregar el premio</p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7">
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
    </div>

    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8 self-start">
      <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl border border-orange-100 p-6 shadow-sm">
        <h4 className="text-orange-800 text-sm font-black flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span> ¿Cómo funciona el canje?
        </h4>
        <ol className="space-y-3 text-xs text-orange-900/80 font-bold">
          <li className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">1</div>
            <span>El cliente llega a la meta de visitas y ve el botón de canje en su app.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">2</div>
            <span>El cliente genera un código único de <strong>8 caracteres</strong> desde la app.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">3</div>
            <span>Tú escribes ese código aquí y validas. <strong>Entrega el premio solo si dice “ENTREGAR”.</strong></span>
          </li>
        </ol>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">⚠️ Importante</p>
        <ul className="space-y-2 text-xs text-gray-600 font-semibold">
          <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">●</span> Solo entrega el premio si el sistema confirma con verde.</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span> Los códigos son de un solo uso y expiran después de validarse.</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span> El cliente puede ver el historial de sus canjes en la app.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
)}

{tab === 'push' && userRole === 'ADMIN' && (
<div className="max-w-5xl mx-auto animate-fadeIn">
  <div className="mb-6">
    <h2 className="text-2xl font-black text-gray-900">Notificaciones Push</h2>
    <p className="text-gray-500 font-semibold mt-1 text-sm">Envía mensajes directamente a los pases instalados de tus clientes</p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7 space-y-4">
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
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Envíos del día</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {pushRemaining != null ? `${1 - pushRemaining}/1` : '—'}
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
            {pushLoading ? 'Enviando...' : pushRemaining === 0 ? 'Límite diario alcanzado' : '📢 Enviar Notificación'}
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
    </div>

    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8 self-start">
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border border-violet-100 p-6 shadow-sm">
        <h4 className="text-violet-800 text-sm font-black flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span> Cómo usar las notificaciones
        </h4>
        <ul className="space-y-3 text-xs text-violet-900/80 font-bold">
          <li className="flex items-start gap-2.5">
            <span className="text-violet-500 text-base mt-0.5">✅</span>
            <span><strong>Avisos de promoción:</strong> “¡Hoy 2x1 en café! Validó hasta las 8pm”</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-violet-500 text-base mt-0.5">✅</span>
            <span><strong>Recordatorios:</strong> “Te faltan 2 visitas para tu premio”</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-violet-500 text-base mt-0.5">✅</span>
            <span><strong>Eventos especiales:</strong> “¡Cumpleaños del negocio! Doble sellos este sábado”</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-red-400 text-base mt-0.5">❌</span>
            <span>No uses las notificaciones para mensajes irrelevantes: la tasa de desinstalación subirá.</span>
          </li>
        </ul>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">⚠️ Límites</p>
        <ul className="space-y-2 text-xs text-gray-600 font-semibold">
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span> <strong>Máximo 1 notificación por día.</strong> El contador se reinicia a medianoche (hora MX).</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span> Solo llega a clientes con el pase instalado en Apple o Google Wallet.</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span> Apple Wallet muestra la notificación en la pantalla de bloqueo instantáneamente.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
)}

{tab === 'manuals' && userRole === 'ADMIN' && (
<div className="max-w-5xl mx-auto animate-fadeIn">
  <div className="mb-6">
    <h2 className="text-2xl font-black text-gray-900">Manuales y Guías</h2>
    <p className="text-gray-500 font-semibold mt-1 text-sm">Descarga material práctico para operar tu panel de negocio.</p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📘</span>
            <div>
              <h2 className="text-lg font-black">Manual del Panel Admin</h2>
              <p className="text-white/80 text-xs font-semibold">Guía paso a paso para dueños y administradores del negocio</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 font-semibold leading-relaxed">
            Aprende cómo registrar visitas, canjear premios, gestionar tu equipo y configurar tu programa de lealtad con esta guía oficial.
          </p>
          <a
            href="/manuales/Manual_Panel_Admin_Punto_IA.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-md transition hover:shadow-lg hover:from-cyan-500 hover:to-blue-600"
          >
            ⬇️ Descargar manual PDF
          </a>
        </div>
      </div>
    </div>
    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8 self-start">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl border border-cyan-100 p-6 shadow-sm">
        <h4 className="text-cyan-800 text-sm font-black flex items-center gap-2 mb-4">
          <span className="text-lg">🚀</span> Recomendación rápida
        </h4>
        <ul className="space-y-3 text-xs text-cyan-900/80 font-bold">
          <li className="flex items-start gap-2.5">
            <span className="text-cyan-600 text-base mt-0.5">1.</span>
            <span>Descarga el manual en tu computadora o celular.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-cyan-600 text-base mt-0.5">2.</span>
            <span>Compártelo con administradores y encargados de caja.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-cyan-600 text-base mt-0.5">3.</span>
            <span>Úsalo como checklist para estandarizar operación diaria.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
)}

{tab === 'settings' && userRole === 'ADMIN' && (
<div className="max-w-5xl mx-auto animate-fadeIn pb-24">
  <div className="mb-8">
    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Configuración de tu Programa</h2>
    <p className="text-gray-500 font-semibold mt-2 text-sm max-w-2xl">
      Personaliza las recompensas, el diseño de tus pases y la información de tu negocio.
      Los cambios se reflejarán automáticamente en las wallets de tus clientes al sincronizarse.
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
    <div className="lg:col-span-7 xl:col-span-8 space-y-6">

      {/* BLOQUE 1: Programa de Lealtad (Core) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎁</span>
            <div>
              <h3 className="text-lg font-black tracking-tight">Programa de Recompensas</h3>
              <p className="text-white/90 text-xs font-semibold">Define la meta y los premios para fidelizar clientes</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1">Premio Final (Al llegar a la meta)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={prizeEmoji}
                  onChange={e => setPrizeEmoji(e.target.value)}
                  className="w-12 h-[46px] text-center bg-gray-50 border border-gray-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  maxLength={4}
                  placeholder="🏆"
                  aria-label="Emoji del premio final"
                />
                <input
                  className="flex-1 p-3.5 bg-gray-50 rounded-xl font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition-all text-sm placeholder:text-gray-400"
                  value={prizeName}
                  onChange={e => setPrizeName(e.target.value)}
                  placeholder="Ej: Café gratis, 2x1, Descuento 20%"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-semibold mt-1.5 leading-relaxed">Puedes elegir el emoji del premio final igual que en la escalera de beneficios.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1">🏆 Visitas requeridas</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={String(MAX_REQUIRED_VISITS)}
                    className="w-full p-3.5 pr-16 bg-gray-50 rounded-xl font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
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
                  <div className="absolute right-0 bottom-0 pointer-events-none pb-2 pt-2 pr-4 flex items-center justify-center h-full text-xs font-bold text-gray-400">
                    visitas
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-semibold mt-1.5 leading-relaxed">Recomendamos la meta entre 6 y 10 visitas p/retención ideal.</p>
              </div>
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1">⏳ Vigencia del pase</label>
                <select className="w-full p-3.5 bg-gray-50 rounded-xl font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm" value={rewardPeriod} onChange={e => setRewardPeriod(e.target.value)}>
                  <option value="OPEN">♾️ Sin caducidad</option>
                  <option value="MONTHLY">📅 Mensual</option>
                  <option value="QUARTERLY">📊 Trimestral</option>
                  <option value="SEMESTER">📆 Semestral</option>
                  <option value="ANNUAL">🗓️ Anual</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="pt-5 border-t border-gray-100">
            <h4 className="text-sm font-black text-gray-800 flex justify-between items-center mb-1">
              Escalera de Beneficios
              <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Opcional</span>
            </h4>
            <p className="text-[11px] text-gray-500 font-semibold mb-4 leading-relaxed max-w-xl">
              Premia a tus clientes en visitas clave antes de que lleguen a la meta final para mantener su motivación alta (ej. ganar un descuento intermedio en la visita 4 y la 8).
            </p>
            <p className="text-[11px] text-amber-700 font-black mb-4 leading-relaxed max-w-2xl bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Este bloque guarda toda la lógica del programa (premio final, visitas requeridas, vigencia y escalera). El botón de abajo aplica exactamente lo que ves en el preview.
            </p>
            <p className="text-[11px] text-gray-500 font-semibold mb-3">
              ¿Buscas emojis para tus beneficios? Consulta la lista aquí:{' '}
              <a
                href="https://es.piliapp.com/emoji/list/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-700 underline underline-offset-2"
              >
                es.piliapp.com/emoji/list
              </a>
            </p>
            
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
              {milestones.length === 0 && (
                <p className="text-xs text-gray-400 font-semibold text-center py-3">Sin beneficios intermedios. Tus clientes solo ganarán el premio final.</p>
              )}
              {milestones.map((m, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    value={m.emoji}
                    onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, emoji: e.target.value } : row))}
                    className="w-12 h-10 text-center bg-white border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all shadow-sm"
                    maxLength={4}
                    placeholder="🎁"
                  />
                  <div className="flex h-10 items-center bg-white border border-gray-200 rounded-xl px-2 focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-300 transition shadow-sm">
                    <span className="text-[10px] uppercase font-black text-gray-400 shrink-0 select-none">Visita</span>
                    <input
                      type="number"
                      min="1"
                      value={m.visitTarget}
                      onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, visitTarget: e.target.value } : row))}
                      className="w-10 bg-transparent p-1 text-sm font-black text-center text-gray-900 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={m.reward}
                    onChange={e => setMilestones(prev => prev.map((row, i) => i === idx ? { ...row, reward: e.target.value } : row))}
                    className="flex-1 min-w-[120px] h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all shadow-sm"
                    placeholder="Ej: Topping gratis"
                  />
                  <button
                    type="button"
                    onClick={() => setMilestones(prev => prev.filter((_, i) => i !== idx))}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition shadow-sm"
                    title="Eliminar beneficio intermedio"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 select-none">
                <input
                  type="text"
                  value={prizeEmoji}
                  onChange={e => setPrizeEmoji(e.target.value)}
                  className="w-12 h-10 text-center bg-amber-100 border border-amber-300 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  maxLength={4}
                />
                <div className="flex h-10 items-center bg-amber-50 border border-amber-200 rounded-xl px-2 opacity-80 cursor-not-allowed">
                  <span className="text-[10px] uppercase font-black text-amber-700 shrink-0">Meta</span>
                  <div className="w-10 p-1 text-sm font-black text-center text-amber-900">{normalizedRequiredVisits}</div>
                </div>
                <div className="flex-1 h-10 px-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center text-sm font-bold text-amber-800 opacity-80 overflow-hidden text-ellipsis whitespace-nowrap cursor-not-allowed">
                  {prizeName || 'Premio Final'}
                </div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 text-[10px] font-black border border-amber-200 cursor-not-allowed" title="Premio Meto">
                  FIN
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMilestones(prev => [...prev, { visitTarget: '', reward: '', emoji: '🎁' }])}
                className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 text-amber-700 font-black text-xs uppercase tracking-wider hover:bg-amber-100 hover:border-amber-400 transition-all"
              >
                + Agregar beneficio intermedio
              </button>
            </div>
            
            <button
              onClick={saveMilestones}
              disabled={isSavingMilestones}
              className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 rounded-xl shadow-md disabled:opacity-60 text-sm transition-all flex justify-center items-center gap-2"
            >
              {isSavingMilestones ? 'Guardando...' : '🪜 Guardar Programa de Recompensas'}
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: Identidad y Pase Wallet */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">🎨</span>
            <div>
              <h3 className="text-lg font-black tracking-tight">Diseño del Pase (Wallet)</h3>
              <p className="text-white/80 text-xs font-semibold">Personaliza cómo lucirá tu marca en su smartphone</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-black text-gray-800 mb-1 block">Logotipo del pase</label>
              <p className="text-[10px] text-gray-500 font-semibold mb-3">El ícono visible en Apple y Google. Usa PNG transparente cuadrado.</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[0.8rem] bg-white shadow-inner border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoData || '/icono.png'} alt="Logo" className="max-w-[100%] max-h-[100%] object-contain" />
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs py-2.5 px-3 rounded-xl cursor-pointer transition-colors shadow-sm w-full">
                    <span>Elegir archivo</span>
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 200 * 1024) {
                          notify('error', 'Imagen demasiado pesada. Usa PNG (máx 200KB).');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setLogoData(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {logoData && (
                    <button type="button" onClick={() => setLogoData('')} className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition block text-center w-full">
                      Quitar logo
                     </button>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-black text-gray-800 mb-1 block">Esquema de Colores</label>
              <p className="text-[10px] text-gray-500 font-semibold mb-3">Sincroniza con los colores de tu marca física.</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                  Fondo del Pase
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black opacity-50 uppercase">{walletBackgroundColor}</span>
                    <input type="color" className="w-8 h-8 rounded-md shrink-0 cursor-pointer border-0 bg-transparent p-0 shadow-sm" style={{ backgroundColor: walletBackgroundColor }} value={walletBackgroundColor} onChange={e => setWalletBackgroundColor(e.target.value)} />
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                  Textos
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black opacity-50 uppercase">{walletForegroundColor}</span>
                    <input type="color" className="w-8 h-8 rounded-md shrink-0 cursor-pointer border-0 bg-transparent p-0 shadow-sm" style={{ backgroundColor: walletForegroundColor }} value={walletForegroundColor} onChange={e => setWalletForegroundColor(e.target.value)} />
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                  Acentos (Etiquetas)
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black opacity-50 uppercase">{walletLabelColor}</span>
                    <input type="color" className="w-8 h-8 rounded-md shrink-0 cursor-pointer border-0 bg-transparent p-0 shadow-sm" style={{ backgroundColor: walletLabelColor }} value={walletLabelColor} onChange={e => setWalletLabelColor(e.target.value)} />
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100">
            <label className="text-xs font-black text-gray-800 mb-1 block">Banner Principal (Strip)</label>
            <p className="text-[10px] text-gray-500 font-semibold mb-3">La imagen transversal en el pase. Relación 2.5 : 1 (ideal 1242x492px).</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {walletStripImageData ? (
                <div className="w-full sm:w-56 h-20 rounded-xl overflow-hidden shadow-inner border border-gray-200 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={walletStripImageData} alt="Strip preview" className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="flex-1 flex flex-col justify-center gap-2">
                 <label className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs py-2.5 px-3 rounded-xl cursor-pointer transition-colors shadow-sm w-full h-full min-h-[50px]">
                  <span>Subir banner (JPG/PNG)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        notify('error', 'Imagen pesada. Ideal menos de 2MB.');
                        return;
                      }
                      try {
                        const pngDataUrl = await toPngStripDataUrl(file);
                        setWalletStripImageData(pngDataUrl);
                      } catch (error) {
                         notify('error', error instanceof Error ? error.message : 'Error procesando strip.');
                      }
                    }}
                  />
                </label>
                {walletStripImageData && (
                  <button type="button" onClick={() => setWalletStripImageData(null)} className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition self-start pt-1">Remover banner</button>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => saveSettings('design')} disabled={isSavingSettings} className="w-full bg-gray-900/5 text-gray-800 border border-gray-200 hover:bg-gray-900/10 font-black py-2.5 rounded-xl transition text-xs mt-1 flex justify-center items-center gap-2">
            {isSavingSettings ? 'Guardando...' : '💾 Guardar Diseño del Pase'}
          </button>
        </div>
      </div>

      {/* BLOQUE 3: Perfil y Ubicación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">🏪 Identidad Básica</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Cómo te ven tus clientes</p>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Nombre Oficial</label>
              <input className="w-full p-3 bg-gray-50 rounded-xl text-gray-500 font-bold border border-gray-100 cursor-not-allowed text-sm" value={tenant.name} readOnly disabled title="Contactar a soporte para cambiar nombre" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">📸 Instagram</label>
              <input className="w-full p-3 bg-gray-50 rounded-xl font-semibold text-gray-900 border border-gray-200 focus:bg-pink-50 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@tu_negocio" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">🏷️ Giro del negocio</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl font-semibold text-gray-900 border border-gray-200 focus:bg-purple-50 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                value={businessCategory}
                onChange={(event) => setBusinessCategory(parseBusinessCategory(event.target.value))}
              >
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">📍 Ubicación Física</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Para ubicarte en el mapa de comercios</p>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex gap-2 relative">
              <input className="flex-1 p-2.5 pl-10 bg-gray-50 rounded-xl text-gray-800 text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 font-semibold transition-all" placeholder="Escribir dirección: calle número ciudad y cp" value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
              <button onClick={searchLocation} disabled={isSearching} className="bg-blue-600 text-white px-4 rounded-xl font-black shadow-sm hover:shadow hover:bg-blue-700 disabled:opacity-50 shrink-0 text-xs uppercase tracking-wider transition-all" aria-label="Buscar" title="Localizar">{isSearching ? '...' : 'Buscar'}</button>
            </div>
            <div className="flex-1 mt-2 min-h-[160px] rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-inner">
               <AdminMap coords={coords} setCoords={setCoords} />
            </div>
            <button onClick={() => saveSettings('location')} disabled={isSavingSettings} className="w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-black py-2.5 rounded-xl transition text-xs mt-1 flex justify-center items-center gap-2">
              {isSavingSettings ? 'Guardando...' : '💾 Guardar Ubicación'}
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: Controles Operativos */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <label className="flex items-start md:items-center justify-between gap-6 p-6 cursor-pointer hover:bg-gray-50 transition-colors">
          <div>
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">🧾 Auditoría de Tickets (Opcional)</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              Si se activa, el operador debe capturar el folio del ticket de compra obligatoriamente al escanear un pase. Útil para conciliar lealtad vs POS.
            </p>
          </div>
          <div className="shrink-0 mt-1 md:mt-0 relative">
            <input
              type="checkbox"
              checked={ticketControlEnabled}
              onChange={(e) => {
                setTicketControlEnabled(e.target.checked);
                if (!e.target.checked) setVisitTicketNumber('');
              }}
              className="peer sr-only"
            />
            <div className={`w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors shadow-inner`}></div>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${ticketControlEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </label>
        <div className="px-6 pb-6">
          <button onClick={() => saveSettings('operation')} disabled={isSavingSettings} className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-black py-2.5 rounded-xl transition text-xs mt-1 flex justify-center items-center gap-2">
            {isSavingSettings ? 'Guardando...' : '💾 Guardar Operación'}
          </button>
        </div>
      </div>

      {/* BLOQUE 5: Red Punto IA (Disabled/Próximamente) */}
      <div className="bg-white rounded-3xl shadow-sm border border-indigo-50/50 overflow-hidden relative group">
        <div className="absolute inset-0 z-20 pointer-events-none group-hover:bg-indigo-50/10 transition-colors flex items-center justify-center backdrop-blur-[1px]">
          <span className="bg-white text-indigo-900 border border-indigo-100 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">🚀 Integración Próximamente</span>
        </div>
        <div className="px-6 py-4 border-b border-gray-50 pointer-events-none opacity-40 grayscale">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">🤝 Promo Únete a la Red (Coalición)</h3>
        </div>
        <div className="p-6 pointer-events-none opacity-40 grayscale bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Descuento Ofrecido (%)</label>
              <input type="number" value={coalitionDiscountPercent} disabled className="w-full p-3 bg-white rounded-xl mt-1 text-sm border border-gray-200" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Producto gancho</label>
              <input type="text" value={coalitionProduct} disabled className="w-full p-3 bg-white rounded-xl mt-1 text-sm border border-gray-200" />
            </div>
          </div>
        </div>
      </div>
      
    </div>

    {/* RIGHT COLUMN: PREVIEWS & HELPERS */}
    <div className="lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0 lg:sticky lg:top-8 self-start space-y-6 z-10">
       
       <div className="bg-[#1C1C1E] rounded-[2rem] shadow-2xl overflow-hidden p-[1px] relative border border-gray-800/80">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="bg-[#1C1C1E] rounded-[calc(2rem-1px)] p-6 z-10 relative">
           <h4 className="text-white text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
             Previsualización
           </h4>
           <p className="text-gray-400 text-[11px] font-semibold mb-6">El diseño que verán tus clientes</p>
           
           <div 
            className="w-full rounded-[20px] overflow-hidden shadow-2xl flex flex-col items-center p-5 relative py-10 transition-all duration-300"
            style={{
              backgroundColor: walletBackgroundColor || '#1F2937',
              backgroundImage: walletStripImageData
                ? `url("${walletStripImageData}")`
                : undefined,
              backgroundSize: '100% 120px',
              backgroundPosition: 'top',
              backgroundRepeat: 'no-repeat',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
            }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-white/95 shadow-lg overflow-hidden absolute top-4 left-4 z-10 p-[2px] backdrop-blur-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={logoData || '/icono.png'} alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <div className="absolute top-5 right-4 bg-white/10 p-1.5 rounded-lg backdrop-blur-sm shadow-sm border border-white/10">
              <QRCode value="DEMO_PUNTOIA" size={36} fgColor="#fff" bgColor="transparent" />
            </div>
            
            <div className="mt-14 w-full text-left relative z-20">
              <h5 className="font-black text-[9px] uppercase tracking-widest leading-none drop-shadow-md" style={{ color: walletForegroundColor || '#FFFFFF', opacity: 0.8 }}>{tenant.name}</h5>
              <h4 className="text-lg font-black mt-1 leading-tight drop-shadow-md" style={{ color: walletForegroundColor || '#FFFFFF' }}>Tarjeta de Cliente Frecuente</h4>
            </div>

            <div className="mt-8 grid grid-cols-5 justify-items-center items-start w-full gap-y-6 gap-x-1">
              {Array.from({ length: normalizedRequiredVisits }, (_, i) => {
                const visitIndex = i + 1;
                const isAchieved = visitIndex <= Math.floor(normalizedRequiredVisits * 0.4);
                const milestone = milestones.find(m => Number(m.visitTarget) === visitIndex);
                const hasMilestone = !!milestone;
                const isFinalNode = visitIndex === normalizedRequiredVisits;
                
                return (
                  <div key={visitIndex} className="flex flex-col items-center justify-center z-[2] relative">
                    <div 
                      className={`flex items-center justify-center rounded-full border-[3px] transition-all overflow-hidden w-9 h-9 sm:w-10 sm:h-10 shrink-0`}
                      style={{
                        backgroundColor: isAchieved ? (walletLabelColor || '#3B82F6') : 'rgba(255,255,255,0.78)',
                        borderColor: 'rgba(255,255,255,0.95)',
                        boxShadow: isAchieved ? `0 0 16px ${walletLabelColor || '#3B82F6'}` : '0 8px 16px rgba(0,0,0,0.3)',
                      }}
                    >
                      {hasMilestone ? (
                        <span className="text-lg md:text-xl translate-y-px">{milestone.emoji || '🎁'}</span>
                      ) : isFinalNode ? (
                        <span className="text-lg translate-y-px">{prizeEmoji || '🏆'}</span>
                      ) : (
                        <div
                          className="rounded-full w-[22px] h-[22px] flex items-center justify-center text-[11px]"
                          style={{
                            background: isAchieved
                              ? 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 100%)'
                              : 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.78) 100%)',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)',
                            border: `2px solid ${isAchieved ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}`,
                          }}
                        >
                           {visitIndex}
                        </div>
                      )}
                    </div>
                    {(hasMilestone || isFinalNode) && (
                      <div className="absolute w-[50px] -bottom-[18px] text-center flex flex-col items-center">
                        <span
                          style={{
                            color: '#FFFFFF',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)'
                          }}
                          className="text-[8px] w-full truncate font-black leading-tight uppercase rounded-[4px] px-1 py-[1.5px] border border-white/20 shadow-md"
                        >
                          {hasMilestone ? milestone.reward : (prizeName || 'Premio Final')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-[10px] font-black tracking-widest uppercase drop-shadow-md relative z-20" style={{ color: walletForegroundColor || '#FFFFFF', opacity: 0.9 }}>
              {tenant.name} · Pase de Ejemplo
            </div>
          </div>
         </div>
       </div>

       <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200/50 p-6 shadow-sm hidden md:block">
         <h4 className="text-amber-800 text-sm font-black flex items-center gap-2 mb-4">
           <span className="text-lg">💡</span> Tips de Configuración
         </h4>
         <ul className="space-y-4">
           <li className="text-xs text-amber-900/80 font-bold leading-relaxed flex items-start gap-2.5">
             <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">1</div>
             <span>Tu meta idealmente debe estar entre las 6 y 10 visitas. Programas demasiado largos generan abandono.</span>
           </li>
           <li className="text-xs text-amber-900/80 font-bold leading-relaxed flex items-start gap-2.5">
             <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">2</div>
             <span>Logotipo: El fondo debe ser transparente o formas circulares. Luce muy bien en modo oscuro y claro de iOS / Android.</span>
           </li>
           <li className="text-xs text-amber-900/80 font-bold leading-relaxed flex items-start gap-2.5">
             <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">3</div>
             <span>Los cambios pueden tardar hasta 5 minutos en reflejarse en Google Wallet por caché.</span>
           </li>
         </ul>
       </div>

    </div>
  </div>

  {/* FIXED BOTTOM ACTION BAR — optimistic feedback */}
  <div className="fixed bottom-0 left-0 md:left-60 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.07)] z-40">
    <div className="w-full max-w-5xl mx-auto flex justify-between items-center gap-4">
      <div className="hidden sm:flex items-center gap-2.5">
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-emerald-700 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" className="animate-checkDraw" d="M4.5 12.75l6 6 9-13.5" /></svg>
            <span className="text-sm font-bold">Guardado</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 animate-fadeIn">
            <span className="text-sm">❌</span>
            <span className="text-sm font-bold">Error al guardar</span>
          </div>
        )}
        {saveStatus === 'idle' && settingsDirty && (
          <p className="text-xs font-semibold text-slate-500">Tienes cambios sin guardar</p>
        )}
        {saveStatus === 'idle' && !settingsDirty && (
          <p className="text-xs font-semibold text-slate-400">Sin cambios pendientes</p>
        )}
      </div>
      <button
        onClick={() => saveSettings('all')}
        disabled={isSavingSettings}
        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black shadow-md text-sm transition-all flex justify-center items-center gap-2 ${
          saveStatus === 'saved'
            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
            : saveStatus === 'error'
              ? 'bg-red-600 text-white shadow-red-600/20'
              : 'bg-slate-900 text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-lg'
        } disabled:opacity-60 disabled:hover:translate-y-0`}
      >
        {isSavingSettings ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
        ) : saveStatus === 'saved' ? (
          '✓ Cambios guardados'
        ) : (
          '💾 Guardar configuración'
        )}
      </button>
    </div>
  </div>
</div>
)}

</div>
</div>
);
}
