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
          ...loadingWrap,
          fontSize: isCompact ? "15px" : isMobile ? "16px" : "18px",
          padding: isCompact ? "14px" : "20px",
        }}
      >
        <div style={loadingCard}>
          <div style={loadingDot}></div>
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

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
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",

          paddingTop: isCompact
            ? "10px"
            : isMobile
            ? "12px"
            : isTablet
            ? "16px"
            : "24px",

          paddingRight: isCompact
            ? "10px"
            : isMobile
            ? "12px"
            : isTablet
            ? "16px"
            : "24px",

          paddingLeft: isCompact
            ? "10px"
            : isMobile
            ? "12px"
            : isTablet
            ? "16px"
            : "24px",

          paddingBottom: isCompact
            ? "140px"
            : isMobile
            ? "150px"
            : isTablet
            ? "24px"
            : "24px",
        }}
      >
        <div style={fadeTopo}></div>

        <div
          style={{
            ...conteudoInterno,
            minHeight: isTablet ? "auto" : "100vh",
            paddingBottom: isMobile ? "24px" : "0px",
          }}
          className="dashboard-page-transition"
        >
          {children}
        </div>

        <div style={fadeRodape}></div>
      </main>
    </div>
  );
}

const loadingWrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 28%), linear-gradient(180deg, #09112f, #0b0b0d)",
  color: "#ffffff",
  fontWeight: 800,
};

const loadingCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px 22px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 32px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const loadingDot = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  background: "#60a5fa",
  boxShadow: "0 0 16px rgba(96,165,250,0.70)",
};

const layout = {
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden" as const,
  overflowY: "auto" as const,
  background:
    "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at top right, rgba(236,72,153,0.08), transparent 24%), linear-gradient(180deg, #09112f, #0b0b0d)",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  position: "relative" as const,
};

const conteudoInterno = {
  width: "100%",
  maxWidth: "100%",
  position: "relative" as const,
  zIndex: 2,
  scrollBehavior: "smooth" as const,
};

const fadeTopo = {
  position: "sticky" as const,
  top: 0,
  height: "26px",
  marginBottom: "-26px",
  zIndex: 5,
  pointerEvents: "none" as const,
  background:
    "linear-gradient(180deg, rgba(9,17,47,0.95), rgba(9,17,47,0.72), rgba(9,17,47,0))",
};

const fadeRodape = {
  position: "sticky" as const,
  bottom: 0,
  height: "54px",
  marginTop: "-54px",
  zIndex: 5,
  pointerEvents: "none" as const,
  background:
    "linear-gradient(0deg, rgba(9,17,47,0.98), rgba(9,17,47,0.78), rgba(9,17,47,0))",
};