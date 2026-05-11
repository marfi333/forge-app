"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type NavbarStyle = "glass" | "regular";

interface NavbarStyleContextValue {
  style: NavbarStyle;
  setStyle: (style: NavbarStyle) => void;
}

const NavbarStyleContext = createContext<NavbarStyleContextValue | null>(null);

const STORAGE_KEY = "navbar-style";

export function NavbarStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyleState] = useState<NavbarStyle>("glass");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "glass" || stored === "regular") {
      setStyleState(stored);
    }
  }, []);

  const setStyle = useCallback((value: NavbarStyle) => {
    setStyleState(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  return (
    <NavbarStyleContext value={{ style, setStyle }}>
      {children}
    </NavbarStyleContext>
  );
}

export function useNavbarStyle() {
  const ctx = useContext(NavbarStyleContext);
  if (!ctx)
    throw new Error("useNavbarStyle must be used within NavbarStyleProvider");
  return ctx;
}
