"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAppLoading } from "./loading-provider";

type LoadingLinkProps = ComponentProps<typeof Link>;

export function LoadingLink({ onClick, ...props }: LoadingLinkProps) {
  const { startLoading } = useAppLoading();

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          startLoading("Carregando...");
        }
      }}
    />
  );
}
