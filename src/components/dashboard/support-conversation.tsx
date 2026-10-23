"use client";

import { useEffect } from "react";
import { markSupportSeen } from "@/app/(fr)/dashboard/support/actions";

/** Marque les conversations comme vues à l'ouverture de la page. */
export function SupportSeenMarker() {
  useEffect(() => {
    void markSupportSeen();
  }, []);
  return null;
}
