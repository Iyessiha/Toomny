"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Compteurs calculés par le layout serveur (réponses non lues, etc.), lus par la navigation. */
const NavBadgesContext = createContext<Record<string, number>>({});

export function NavBadgesProvider({ value, children }: { value: Record<string, number>; children: ReactNode }) {
  return <NavBadgesContext.Provider value={value}>{children}</NavBadgesContext.Provider>;
}

export function useNavBadges(): Record<string, number> {
  return useContext(NavBadgesContext);
}
