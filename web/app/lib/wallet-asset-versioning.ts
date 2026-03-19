export function isWalletAssetVersioningEnabled() {
  const flag = String(process.env.GOOGLE_WALLET_ASSET_VERSIONING || '').trim().toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'yes' || flag === 'on') return true;
  if (flag === '0' || flag === 'false' || flag === 'no' || flag === 'off') return false;
  return process.env.NODE_ENV === 'production';
}

