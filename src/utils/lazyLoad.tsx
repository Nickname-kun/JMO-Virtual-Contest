import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { DynamicOptionsLoadingProps } from "next/dynamic";

export function lazyLoad<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loading?: (props: DynamicOptionsLoadingProps) => JSX.Element | null;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFunc, {
    loading: options.loading,
    ssr: options.ssr ?? false,
  });
} 