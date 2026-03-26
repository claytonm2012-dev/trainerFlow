"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import auth from "../firebaseAuth";
import db from "../firebaseDb";

type MenuItem = {
  label: string;
  rota: string;
  icon: ReactNode;
  somenteAdmin?: boolean;
};

type UsuarioData = {
  userId?: string;
  nome?: string;
  email?: string;
  tipo?: string;
};

const iconeSvg = {
  width: "18px",
  height: "18px",
  display: "block",
};

const iconeSvgPequeno = {
  width: "16px",
  height: "16px",
  display: "block",
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    rota: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Lista de alunos",
    rota: "/dashboard/lista-alunos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M16 21V19C16 17.3431 14.6569 16 13 16H7C5.34315 16 4 17.3431 4 19V21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="10"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M20 8V14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M23 11H17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Agenda",
    rota: "/dashboard/agenda",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 3V7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8 3V7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3 10H21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Financeiro",
    rota: "/dashboard/financeiro",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M12 2V22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17 6.5C16.2 5.5 14.6 4.8 12.8 4.8C10.1 4.8 8 6.15 8 8.2C8 10.15 9.7 11 12 11.4L12.9 11.56C15.1 11.94 16.6 12.7 16.6 14.6C16.6 16.75 14.5 18.2 11.7 18.2C9.8 18.2 8 17.45 7 16.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Assinatura",
    rota: "/dashboard/assinatura",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M12 2L15 8L22 9L17 14L18 22L12 19L6 22L7 14L2 9L9 8L12 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Cadastrar aluno",
    rota: "/dashboard/cadastro",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M12 5V19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5 12H19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Painel ADM",
    rota: "/dashboard/admin",
    somenteAdmin: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M12 3L19 7V12C19 16.4183 16.3137 20.3883 12 21C7.68629 20.3883 5 16.4183 5 12V7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12L11 13.5L14.5 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Avisos",
    rota: "/dashboard/avisos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={iconeSvg} aria-hidden="true">
        <path
          d="M15 17H20L18.6 15.6C18.2 15.2 18 14.7 18 14.2V10C18 6.7 15.8 4 12.8 3.2C9 2.2 5 5.1 5 9V14.2C5 14.7 4.8 15.2 4.4 15.6L3 17H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 17C9 18.7 10.3 20 12 20C13.7 20 15 18.7 15 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [rotaPressionada, setRotaPressionada] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<string>("personal");
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
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
    async function carregarTipoUsuario() {
      try {
        const user = auth.currentUser;

        if (!user) {
          setTipoUsuario("personal");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setTipoUsuario("personal");
          return;
        }

        const userData = userSnap.data() as UsuarioData;
        setTipoUsuario(userData?.tipo || "personal");
      } catch (error) {
        console.error("Erro ao carregar tipo de usuário:", error);
        setTipoUsuario("personal");
      } finally {
        setCarregandoUsuario(false);
      }
    }

    carregarTipoUsuario();
  }, []);

  const menuVisivel = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.somenteAdmin) return tipoUsuario === "admin";
      return true;
    });
  }, [tipoUsuario]);

  const tituloPagina = useMemo(() => {
    const itemAtual = menuVisivel.find((item) => {
      if (item.rota === "/dashboard") return pathname === "/dashboard";
      return pathname === item.rota || pathname.startsWith(item.rota + "/");
    });

    return itemAtual?.label || "TrainerFlow";
  }, [pathname, menuVisivel]);

  async function sair() {
    const confirmar = window.confirm("Deseja sair da conta?");
    if (!confirmar) return;

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
      alert("Erro ao sair da conta");
    }
  }

  function navegarPara(rota: string) {
    setRotaPressionada(rota);

    setTimeout(() => {
      router.push(rota);
    }, 90);
  }

  const sidebarResponsiva = {
    ...sidebar,
    width: isMobile ? "100%" : isTablet ? "100%" : "300px",
    minWidth: isMobile ? "100%" : isTablet ? "100%" : "300px",
    height: isMobile ? "auto" : isTablet ? "auto" : "100vh",
    position: isMobile
      ? ("relative" as const)
      : isTablet
      ? ("relative" as const)
      : ("sticky" as const),
    top: isMobile ? "auto" : isTablet ? "auto" : 0,
    padding: isCompact ? "12px" : isMobile ? "14px" : isTablet ? "18px" : "22px",
    borderRight:
      isMobile || isTablet ? "none" : "1px solid rgba(255,255,255,0.08)",
    borderBottom:
      isMobile || isTablet ? "1px solid rgba(255,255,255,0.08)" : "none",
    boxShadow:
      isMobile || isTablet
        ? "0 12px 28px rgba(0,0,0,0.20)"
        : "0 18px 45px rgba(0,0,0,0.28)",
  };

  const topoResponsivo = {
    ...topo,
    gap: isMobile ? "14px" : "20px",
  };

  const logoBoxResponsivo = {
    ...logoBox,
    gap: isCompact ? "10px" : isMobile ? "12px" : "14px",
  };

  const logoIconeResponsivo = {
    ...logoIcone,
    width: isCompact ? "44px" : isMobile ? "48px" : "56px",
    height: isCompact ? "44px" : isMobile ? "48px" : "56px",
    borderRadius: isCompact ? "14px" : isMobile ? "15px" : "18px",
    fontSize: isCompact ? "20px" : isMobile ? "22px" : "24px",
  };

  const logoTituloResponsivo = {
    ...logoTitulo,
    fontSize: isCompact ? "20px" : isMobile ? "22px" : "24px",
    wordBreak: "break-word" as const,
  };

  const logoSubtituloResponsivo = {
    ...logoSubtitulo,
    fontSize: isCompact ? "11px" : isMobile ? "12px" : "13px",
  };

  const blocoAtualResponsivo = {
    ...blocoAtual,
    padding: isCompact ? "14px" : isMobile ? "16px" : "18px",
    borderRadius: isMobile ? "18px" : "22px",
  };

  const blocoAtualTituloResponsivo = {
    ...blocoAtualTitulo,
    fontSize: isCompact ? "17px" : isMobile ? "18px" : "20px",
    wordBreak: "break-word" as const,
  };

  const menuResponsivo = {
    ...menu,
    marginTop: isMobile ? "16px" : "22px",
    gap: isMobile ? "8px" : "10px",
  };

  const menuBotaoResponsivoBase = {
    ...menuBotao,
    minHeight: isCompact ? "52px" : isMobile ? "54px" : "58px",
    borderRadius: isMobile ? "14px" : "16px",
    padding: isCompact ? "0 10px" : isMobile ? "0 12px" : "0 14px",
    fontSize: isCompact ? "13px" : isMobile ? "14px" : "15px",
  };

  const menuIconeBoxResponsivo = {
    ...menuIconeBox,
    width: isCompact ? "30px" : isMobile ? "32px" : "34px",
    minWidth: isCompact ? "30px" : isMobile ? "32px" : "34px",
    height: isCompact ? "30px" : isMobile ? "32px" : "34px",
    borderRadius: isCompact ? "10px" : isMobile ? "11px" : "12px",
  };

  const rodapeResponsivo = {
    ...rodape,
    marginTop: isMobile ? "18px" : "24px",
    gap: isMobile ? "12px" : "14px",
    position: "sticky" as const,
    bottom: 0,
    paddingTop: "10px",
    paddingBottom: isMobile ? "4px" : "8px",
    background:
      isMobile || isTablet
        ? "linear-gradient(180deg, rgba(7,13,38,0.75), rgba(7,13,38,0.98))"
        : "transparent",
    backdropFilter: isMobile || isTablet ? "blur(14px)" : "none",
    zIndex: 3,
  };

  const rodapeInfoResponsivo = {
    ...rodapeInfo,
    padding: isCompact ? "12px" : isMobile ? "14px" : "16px",
    borderRadius: isMobile ? "16px" : "18px",
  };

  const rodapeTextoResponsivo = {
    ...rodapeTexto,
    fontSize: isCompact ? "14px" : "15px",
  };

  const rodapeDescricaoResponsivo = {
    ...rodapeDescricao,
    fontSize: isCompact ? "12px" : "13px",
  };

  const botaoSairResponsivo = {
    ...botaoSair,
    height: isCompact ? "46px" : isMobile ? "48px" : "50px",
    borderRadius: isMobile ? "13px" : "14px",
    fontSize: isCompact ? "13px" : "14px",
    width: "100%",
    position: "relative" as const,
    zIndex: 10,
    boxShadow: "0 14px 24px rgba(239,68,68,0.16)",
  };

  return (
    <aside style={sidebarResponsiva}>
      <div style={sidebarGlowUm}></div>
      <div style={sidebarGlowDois}></div>

      <div>
        <div style={topoResponsivo}>
          <div style={logoBoxResponsivo}>
            <div style={logoIconeResponsivo}>T</div>

            <div style={{ minWidth: 0 }}>
              <h1 style={logoTituloResponsivo}>TrainerFlow</h1>
              <p style={logoSubtituloResponsivo}>
                {carregandoUsuario
                  ? "Painel profissional"
                  : tipoUsuario === "admin"
                  ? "Painel administrador"
                  : "Painel profissional"}
              </p>
            </div>
          </div>

          <div style={tagPremiumWrapper}>
            <div style={tagPremiumPing}></div>
            <div style={tagPremium}>
              {carregandoUsuario
                ? "Carregando"
                : tipoUsuario === "admin"
                ? "Administrador"
                : "Premium"}
            </div>
          </div>
        </div>

        <div style={blocoAtualResponsivo}>
          <p style={blocoAtualMini}>Área atual</p>
          <h2 style={blocoAtualTituloResponsivo}>{tituloPagina}</h2>
        </div>

        <nav style={menuResponsivo}>
          {menuVisivel.map((item) => {
            const ativo =
              item.rota === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.rota || pathname.startsWith(item.rota + "/");

            const pressionado = rotaPressionada === item.rota;

            return (
              <button
                key={item.rota}
                onClick={() => navegarPara(item.rota)}
                onMouseEnter={(e) => {
                  if (isMobile || isTablet) return;
                  e.currentTarget.style.transform = pressionado
                    ? "scale(0.985)"
                    : "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.985)";
                }}
                onMouseUp={(e) => {
                  if (isMobile || isTablet) {
                    e.currentTarget.style.transform = "translateX(0)";
                    return;
                  }

                  e.currentTarget.style.transform = ativo
                    ? "translateX(0)"
                    : "translateX(4px)";
                }}
                style={{
                  ...menuBotaoResponsivoBase,
                  ...(ativo ? menuBotaoAtivo : {}),
                  ...(pressionado ? menuBotaoPressionado : {}),
                }}
              >
                <span
                  style={{
                    ...menuIconeBoxResponsivo,
                    ...(ativo ? menuIconeBoxAtivo : {}),
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    ...menuTexto,
                    minWidth: 0,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {item.label}
                </span>

                <span
                  style={{
                    ...menuIndicador,
                    ...(ativo ? menuIndicadorAtivo : {}),
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>

      <div style={rodapeResponsivo}>
        <div style={rodapeInfoResponsivo}>
          <p style={rodapeMini}>Sistema</p>
          <p style={rodapeTextoResponsivo}>
            {carregandoUsuario
              ? "Versão premium"
              : tipoUsuario === "admin"
              ? "Versão administrador"
              : "Versão premium"}
          </p>
          <p style={rodapeDescricaoResponsivo}>
            Navegação profissional com visual SaaS e acesso rápido às áreas
            principais.
          </p>
        </div>

        <button
          onClick={sair}
          onMouseEnter={(e) => {
            if (isMobile || isTablet) return;
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 18px 28px rgba(239,68,68,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 14px 24px rgba(239,68,68,0.16)";
          }}
          style={botaoSairResponsivo}
        >
          <span style={botaoSairIcone}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              style={iconeSvgPequeno}
              aria-hidden="true"
            >
              <path
                d="M15 17L20 12L15 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 12H9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3H12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Sair da conta
        </button>
      </div>
    </aside>
  );
}

const sidebar = {
  width: "300px",
  minWidth: "300px",
  height: "100vh",
  position: "sticky" as const,
  top: 0,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  padding: "22px",
  background:
    "linear-gradient(180deg, rgba(8,18,58,0.98), rgba(7,13,38,0.98))",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  overflow: "hidden" as const,
};

const sidebarGlowUm = {
  position: "absolute" as const,
  top: "-40px",
  left: "-60px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background: "rgba(59,130,246,0.20)",
  filter: "blur(55px)",
  pointerEvents: "none" as const,
};

const sidebarGlowDois = {
  position: "absolute" as const,
  bottom: "-50px",
  right: "-60px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background: "rgba(236,72,153,0.16)",
  filter: "blur(60px)",
  pointerEvents: "none" as const,
};

const topo = {
  position: "relative" as const,
  zIndex: 1,
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const logoBox = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoIcone = {
  width: "54px",
  height: "54px",
  borderRadius: "17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #7dd3fc, #2563eb)",
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 900,
  boxShadow: "0 16px 30px rgba(37,99,235,0.30)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const logoTitulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 900,
  lineHeight: 1.05,
};

const logoSubtitulo = {
  margin: "4px 0 0 0",
  color: "rgba(255,255,255,0.64)",
  fontSize: "13px",
};

const tagPremiumWrapper = {
  position: "relative" as const,
  alignSelf: "flex-start" as const,
};

const tagPremiumPing = {
  position: "absolute" as const,
  inset: "-2px",
  borderRadius: "999px",
  background: "rgba(74,222,128,0.16)",
};

const tagPremium = {
  position: "relative" as const,
  zIndex: 1,
  alignSelf: "flex-start" as const,
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#86efac",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.3px",
};

const blocoAtual = {
  position: "relative" as const,
  zIndex: 1,
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const blocoAtualMini = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const blocoAtualTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 900,
  lineHeight: 1.2,
};

const menu = {
  position: "relative" as const,
  zIndex: 1,
  marginTop: "22px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const menuBotao = {
  width: "100%",
  minHeight: "58px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "0 14px",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left" as const,
  transition:
    "transform 0.18s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease",
  backdropFilter: "blur(12px)",
};

const menuBotaoAtivo = {
  background:
    "linear-gradient(135deg, rgba(96,165,250,0.22), rgba(37,99,235,0.12))",
  border: "1px solid rgba(96,165,250,0.20)",
  boxShadow:
    "0 14px 28px rgba(37,99,235,0.18), 0 0 16px rgba(59,130,246,0.12)",
};

const menuBotaoPressionado = {
  transform: "scale(0.985)",
};

const menuIconeBox = {
  width: "34px",
  minWidth: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "all 0.22s ease",
};

const menuIconeBoxAtivo = {
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 0 14px rgba(255,255,255,0.08)",
};

const menuTexto = {
  flex: 1,
};

const menuIndicador = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  transition: "all 0.22s ease",
};

const menuIndicadorAtivo = {
  background: "#7dd3fc",
  boxShadow: "0 0 12px rgba(125,211,252,0.55)",
};

const rodape = {
  position: "relative" as const,
  zIndex: 1,
  marginTop: "24px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const rodapeInfo = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const rodapeMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "12px",
};

const rodapeTexto = {
  margin: "6px 0 0 0",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 800,
};

const rodapeDescricao = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "13px",
  lineHeight: 1.6,
};

const botaoSair = {
  height: "50px",
  borderRadius: "14px",
  border: "1px solid rgba(239,68,68,0.18)",
  background:
    "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.14))",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  transition: "all 0.18s ease",
};

const botaoSairIcone = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};