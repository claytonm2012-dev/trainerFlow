"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import auth from "../firebaseAuth";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUsuario(user);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (carregando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0d",
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: 800,
        }}
      >
        Carregando dashboard...
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div style={layout}>
      <Sidebar />

      <main style={conteudo}>
        <div style={conteudoInterno}>{children}</div>
      </main>
    </div>
  );
}

const layout = {
  display: "flex",
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at top right, rgba(236,72,153,0.08), transparent 24%), linear-gradient(180deg, #09112f, #0b0b0d)",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  padding: "24px",
};

const conteudoInterno = {
  width: "100%",
};