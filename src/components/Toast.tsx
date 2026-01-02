/**
 * Toast Component
 * 
 * Simple, discrete toast notification.
 */

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'info' | 'error' | 'success';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  show,
  onHide,
  duration = 3000,
  type = 'info',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onHide, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!show && !visible) return null;

  const bgColor = {
    info: 'bg-white border-recycle-border',
    error: 'bg-recycle-error/10 border-recycle-error',
    success: 'bg-recycle-success/10 border-recycle-success',
  }[type];

  const textColor = {
    info: 'text-recycle-text',
    error: 'text-recycle-error',
    success: 'text-recycle-success',
  }[type];

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-xl border-2 shadow-eco
        text-sm ${textColor}
        transition-all duration-300
        ${bgColor}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {message}
    </div>
  );
};

export default Toast;
