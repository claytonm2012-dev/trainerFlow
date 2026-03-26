"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import auth from "./firebaseAuth";

export default function Home() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }

      setCarregando(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Tela rápida enquanto verifica login
  if (carregando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0d",
          color: "#fff",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        Carregando...
      </div>
    );
  }

  return null;
}