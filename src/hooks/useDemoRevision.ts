"use client";

import { useEffect, useState } from "react";

export function useDemoRevision() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("h2s_store_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("h2s_store_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return revision;
}

