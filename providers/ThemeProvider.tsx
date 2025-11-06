"use client";

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
//import { type ThemeProviderProps } from "next-themes/dist/types";


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use 'system' as the default theme to respect OS preference
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}