"use client";

import { Toast as RToast } from "radix-ui";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "./icon";

type ToastInput = {
  title: string;
  /** Action secondaire, ex. « Annuler ». */
  action?: { label: string; onClick?: () => void };
};

type ToastItem = ToastInput & { id: number; open: boolean };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** Affiche une confirmation brève (« Message envoyé »). */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: ToastInput) => {
    setItems((list) => [...list.slice(-2), { ...t, id: Date.now() + Math.random(), open: true }]);
  }, []);
  const close = (id: number) => setItems((list) => list.map((x) => (x.id === id ? { ...x, open: false } : x)));
  const remove = (id: number) => setItems((list) => list.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={push}>
      <RToast.Provider swipeDirection="down" label="Notifications" duration={5000}>
        {children}
        {items.map((t) => (
          <RToast.Root
            key={t.id}
            open={t.open}
            onOpenChange={(o) => {
              if (!o) {
                close(t.id);
                setTimeout(() => remove(t.id), 200);
              }
            }}
            className="flex w-fit max-w-full items-center gap-3 rounded-alert bg-inverse px-4 py-3 text-label text-on-inverse shadow-pop data-[state=closed]:animate-toast-out data-[state=open]:animate-toast-in"
          >
            <Icon name="check_circle" className="text-inverse-accent" />
            <RToast.Title className="flex-1">{t.title}</RToast.Title>
            {t.action && (
              <RToast.Action altText={t.action.label} asChild>
                <button
                  type="button"
                  onClick={t.action.onClick}
                  className="relative ml-3 font-bold text-inverse-accent after:absolute after:-inset-3 after:content-['']"
                >
                  {t.action.label}
                </button>
              </RToast.Action>
            )}
          </RToast.Root>
        ))}
        <RToast.Viewport className="fixed right-4 bottom-4 left-4 z-[100] m-0 flex list-none flex-col items-center gap-2 p-0 outline-none sm:left-auto sm:items-end" />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}

/** Aperçu statique d'un toast (page design-system). */
export function ToastPreview({ title, action }: ToastInput) {
  return (
    <div className="flex w-fit items-center gap-3 rounded-alert bg-inverse px-4 py-3 text-label text-on-inverse shadow-pop">
      <Icon name="check_circle" className="text-inverse-accent" />
      <span>{title}</span>
      {action && <span className="ml-3 font-bold text-inverse-accent">{action.label}</span>}
    </div>
  );
}
