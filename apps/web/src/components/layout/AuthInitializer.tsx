"use client";

import { useEffect } from "react";
import { useAuthStore } from "@jungle/hooks";

export function AuthInitializer() {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return null;
}
