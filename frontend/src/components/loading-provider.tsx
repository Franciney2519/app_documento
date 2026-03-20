"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: (label?: string) => void;
  stopLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("Carregando...");

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    document.body.dataset.loading = isLoading ? "true" : "false";

    return () => {
      document.body.dataset.loading = "false";
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading,
      startLoading: (nextLabel = "Carregando...") => {
        setLabel(nextLabel);
        setIsLoading(true);
      },
      stopLoading: () => {
        setIsLoading(false);
      }
    }),
    [isLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading ? (
        <div className="app-loading-overlay" aria-live="polite" aria-busy="true">
          <div className="app-loading-card">
            <span className="app-loading-spinner" aria-hidden="true" />
            <div>
              <div className="app-loading-title">{label}</div>
              <div className="app-loading-subtle">Aguarde um instante...</div>
            </div>
          </div>
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useAppLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useAppLoading deve ser usado dentro de LoadingProvider.");
  }

  return context;
}
