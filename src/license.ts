import { LicenseInfo } from '@mui/x-license';

function resolveLicenseKey(): string {
  if (typeof __MUI_X_LICENSE_KEY__ === 'string' && __MUI_X_LICENSE_KEY__.length > 0) {
    return __MUI_X_LICENSE_KEY__;
  }

  const envKey = import.meta.env.MUI_X_LICENSE_KEY;

  return typeof envKey === 'string' ? envKey : '';
}

/** Applies the inlined MUI X license. Must be called from every package entry. */
export function applyMuiXLicense(): void {
  const licenseKey = resolveLicenseKey();
  if (licenseKey) {
    LicenseInfo.setLicenseKey(licenseKey);
  }
}
