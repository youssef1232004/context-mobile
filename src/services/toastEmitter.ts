import { DeviceEventEmitter } from 'react-native';
import type { ToastVariant } from '../components/ui/Toast';

/**
 * Global toast emitter.
 * Uses DeviceEventEmitter (the same pattern as 'auth-expired') so
 * non-component code (hooks, services) can trigger toasts from anywhere.
 *
 * Usage:
 *   toastEmitter.show('Analysis complete!', 'success');
 */
export const TOAST_EVENT = 'global-toast';

export const toastEmitter = {
  show: (message: string, variant: ToastVariant = 'info') => {
    DeviceEventEmitter.emit(TOAST_EVENT, { message, variant });
  },
};
