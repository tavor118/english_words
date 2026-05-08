import type { SyncStatus } from '../hooks/useDriveSync';
import s from './SyncControl.module.css';

interface Props {
  status: SyncStatus;
  error: string | null;
  signedIn: boolean;
  configured: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  disabled: '',
  'signed-out': 'Not synced',
  syncing: 'Syncing…',
  idle: 'Synced',
  error: 'Sync error',
};

function GoogleLogo() {
  return (
    <span className={s.googleLogo}>
      <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
      </svg>
    </span>
  );
}

export function SyncControl({ status, error, signedIn, configured, onSignIn, onSignOut }: Props) {
  if (!configured) return null;

  const dotClass =
    status === 'syncing' ? s.dotSyncing : status === 'error' ? s.dotError : s.dotIdle;

  return (
    <div className={s.wrapper}>
      {signedIn ? (
        <>
          <span className={s.status}>
            <span className={dotClass} />
            {STATUS_LABEL[status]}
          </span>
          <button className={s.signOut} onClick={onSignOut} disabled={status === 'syncing'}>
            Sign out
          </button>
        </>
      ) : (
        <button
          className={s.googleBtn}
          onClick={onSignIn}
          disabled={status === 'syncing'}
        >
          <GoogleLogo />
          {status === 'syncing' ? 'Signing in…' : 'Sign in with Google'}
        </button>
      )}
      {error && <span className={s.error} title={error}>{error}</span>}
    </div>
  );
}
