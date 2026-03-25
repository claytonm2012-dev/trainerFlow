"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("Service Worker registrado com sucesso");
        })
        .catch((error) => {
          console.error("Erro ao registrar Service Worker:", error);
        });
    }
  }, []);

  return null;
}