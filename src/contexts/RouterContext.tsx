"use client";

import { createContext, useContext } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const RouterContext = createContext<AppRouterInstance | null>(null);

export function useRouterContext() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouterContext must be used within a RouterProvider");
  }
  return context;
} 