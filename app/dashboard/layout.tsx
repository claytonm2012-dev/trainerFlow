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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024);
      setIsCompact(width <= 480);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          background:
            "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 28%), linear-gradient(180deg, #09112f, #0b0b0d)",
          color: "#ffffff",
          fontSize: isCompact ? "15px" : isMobile ? "16px" : "18px",
          fontWeight: 800,
          padding: "20px",
          textAlign: "center",
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
    <div
      style={{
        ...layout,
        flexDirection: isTablet ? "column" : "row",
      }}
    >
      <Sidebar />

      <main
        style={{
          ...conteudo,
          padding: isCompact ? "10px" : isMobile ? "12px" : isTablet ? "16px" : "24px",
        }}
      >
        <div
          style={{
            ...conteudoInterno,
            minHeight: isTablet ? "auto" : "100vh",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

const layout = {
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden" as const,
  background:
    "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at top right, rgba(236,72,153,0.08), transparent 24%), linear-gradient(180deg, #09112f, #0b0b0d)",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden" as const,
};

const conteudoInterno = {
  width: "100%",
  maxWidth: "100%",
};