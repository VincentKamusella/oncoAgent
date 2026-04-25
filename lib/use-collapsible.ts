"use client";

import { useEffect, useState } from "react";

export function useCollapsible(key: string, defaultCollapsed = false) {
  const storageKey = `oncoAgent.sidebar.${key}`;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v != null) setCollapsed(v === "1");
    } catch {}
  }, [storageKey]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return { collapsed, toggle };
}
