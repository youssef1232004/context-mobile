import { useState, useCallback } from 'react';
import type { ToastVariant } from '../components/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

/**
 * Manages toast visibility.
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   <Toast {...toast} onHide={hideToast} />
 *   showToast('Saved!', 'success');
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'info',
  });

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToast({ visible: true, message, variant });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
