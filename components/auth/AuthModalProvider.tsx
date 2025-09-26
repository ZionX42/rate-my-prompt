'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import AuthForm from '@/components/auth/AuthForm';

export type AuthModalMode = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
}

interface AuthModalContextValue extends AuthModalState {
  open: (mode?: AuthModalMode) => void;
  close: () => void;
  switchMode: (mode: AuthModalMode) => void;
  toggleMode: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
}

export function AuthModalProvider({ children }: ProviderProps) {
  const [state, setState] = useState<AuthModalState>({ isOpen: false, mode: 'login' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!state.isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, state.isOpen]);

  const open = useCallback((mode: AuthModalMode = 'login') => {
    setState({ isOpen: true, mode });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const switchMode = useCallback((mode: AuthModalMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => ({ ...prev, mode: prev.mode === 'login' ? 'signup' : 'login' }));
  }, []);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      ...state,
      open,
      close,
      switchMode,
      toggleMode,
    }),
    [state, open, close, switchMode, toggleMode]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {mounted && state.isOpen
        ? createPortal(
            <AuthModal mode={state.mode} onClose={close} onSwitchMode={switchMode} />,
            document.body
          )
        : null}
    </AuthModalContext.Provider>
  );
}

interface AuthModalProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
}

function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSuccess = useCallback(
    (nextMode: AuthModalMode) => {
      if (nextMode === 'signup') {
        onSwitchMode('login');
      }
      onClose();
    },
    [onClose, onSwitchMode]
  );

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md mx-4" role="dialog" aria-modal="true">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-neutral-200/80 p-2 text-neutral-700 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          aria-label="Close authentication"
        >
          ×
        </button>
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
          <AuthForm
            key={mode}
            mode={mode}
            onSuccess={handleSuccess}
            onModeChange={onSwitchMode}
            inModal
          />
        </div>
      </div>
    </div>
  );
}
