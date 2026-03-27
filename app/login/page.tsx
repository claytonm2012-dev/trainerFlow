"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import auth from "../firebaseAuth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }

      setVerificandoSessao(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function entrar() {
    setErro("");
    setMensagem("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro ao entrar:", error);

      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/user-not-found"
      ) {
        setErro("E-mail ou senha incorretos.");
      } else if (error?.code === "auth/invalid-email") {
        setErro("Digite um e-mail válido.");
      } else if (error?.code === "auth/too-many-requests") {
        setErro("Muitas tentativas. Aguarde um pouco e tente novamente.");
      } else {
        setErro("Não foi possível entrar agora.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha() {
    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro("Digite seu e-mail para recuperar a senha.");
      return;
    }

    try {
      setCarregando(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMensagem("Enviamos o link de recuperação para seu e-mail.");
    } catch (error: any) {
      console.error("Erro ao recuperar senha:", error);

      if (error?.code === "auth/invalid-email") {
        setErro("Digite um e-mail válido.");
      } else if (error?.code === "auth/user-not-found") {
        setErro("Nenhum usuário encontrado com esse e-mail.");
      } else {
        setErro("Não foi possível enviar o e-mail de recuperação.");
      }
    } finally {
      setCarregando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <main style={loadingMain}>
        <div style={loadingCard}>
          <div style={loadingLogo}>T</div>
          <h1 style={loadingTitle}>TRAINERFLOW</h1>
          <p style={loadingText}>Carregando acesso...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={overlayDark}></div>
      <div style={overlayGradient}></div>
      <div style={glowTop}></div>
      <div style={glowBottom}></div>

      <div style={pageWrap}>
        <div style={loginCard}>
          <div style={cardStroke}></div>

          <div style={logoBadgeWrap}>
            <div style={logoBadge}>T</div>
          </div>

          <h1 style={title}>TRAINERFLOW</h1>
          <p style={subtitle}>Plataforma premium para personal trainers</p>

          <div style={formArea}>
            <div>
              <label style={label}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Senha</label>

              <div style={senhaRow}>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  style={inputSenha}
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  style={botaoVer}
                >
                  {mostrarSenha ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            <div style={rowInfo}>
              <span style={safeText}>Acesso seguro</span>

              <button
                type="button"
                onClick={recuperarSenha}
                disabled={carregando}
                style={{
                  ...botaoRecuperar,
                  opacity: carregando ? 0.7 : 1,
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            {erro ? <div style={erroBox}>{erro}</div> : null}
            {mensagem ? <div style={sucessoBox}>{mensagem}</div> : null}

            <button
              type="button"
              onClick={entrar}
              disabled={carregando}
              style={{
                ...botaoEntrar,
                opacity: carregando ? 0.78 : 1,
              }}
            >
              {carregando ? "Entrando..." : "Entrar na plataforma"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              style={botaoCriar}
            >
              Criar conta
            </button>

            <div style={footerInfo}>
              <p style={footerInfoText}>
                Organize alunos, agenda, evolução e financeiro em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          main {
            padding: 16px 12px !important;
          }

          .login-card-responsive {
            max-width: 100% !important;
            padding: 22px 16px 16px !important;
            border-radius: 28px !important;
          }

          .logo-badge-responsive {
            width: 72px !important;
            height: 72px !important;
            font-size: 34px !important;
            border-radius: 22px !important;
          }

          .title-responsive {
            font-size: 28px !important;
          }

          .subtitle-responsive {
            font-size: 14px !important;
          }

          .senha-grid-responsive {
            grid-template-columns: 1fr 86px !important;
            gap: 8px !important;
          }

          .input-responsive {
            height: 54px !important;
            font-size: 15px !important;
          }

          .button-main-responsive {
            height: 56px !important;
            font-size: 17px !important;
          }

          .button-secondary-responsive {
            height: 54px !important;
            font-size: 16px !important;
          }

          .footer-box-responsive {
            padding: 12px 14px !important;
          }
        }

        @media (max-width: 420px) {
          .title-responsive {
            font-size: 25px !important;
          }

          .subtitle-responsive {
            font-size: 13px !important;
          }

          .senha-grid-responsive {
            grid-template-columns: 1fr 78px !important;
          }

          .recover-button-responsive {
            width: 100% !important;
            justify-content: center !important;
          }

          .row-info-responsive {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </main>
  );
}

const loadingMain = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.35) 0%, rgba(9,17,47,1) 38%, rgba(11,11,13,1) 100%)",
  padding: "20px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCard = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "28px",
  padding: "28px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(18px)",
  textAlign: "center" as const,
  boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
};

const loadingLogo = {
  width: "72px",
  height: "72px",
  margin: "0 auto 16px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #22c55e, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
  boxShadow: "0 0 24px rgba(34,197,94,0.30)",
};

const loadingTitle = {
  margin: 0,
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: 900,
};

const loadingText = {
  margin: "10px 0 0 0",
  color: "rgba(255,255,255,0.78)",
  fontSize: "15px",
};

const mainStyle = {
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden" as const,
  position: "relative" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 14px",
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundImage: `url("/images/login-gym-bg.jpg")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

const overlayDark = {
  position: "absolute" as const,
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(2,8,23,0.52) 0%, rgba(2,6,23,0.62) 44%, rgba(2,6,23,0.78) 100%)",
};

const overlayGradient = {
  position: "absolute" as const,
  inset: 0,
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.28) 0%, transparent 35%), radial-gradient(circle at bottom right, rgba(217,70,239,0.16) 0%, transparent 34%), radial-gradient(circle at bottom left, rgba(34,197,94,0.12) 0%, transparent 30%)",
};

const glowTop = {
  position: "absolute" as const,
  top: "7%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "340px",
  height: "120px",
  borderRadius: "999px",
  background: "rgba(34,211,238,0.20)",
  filter: "blur(80px)",
  pointerEvents: "none" as const,
};

const glowBottom = {
  position: "absolute" as const,
  bottom: "8%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "300px",
  height: "160px",
  borderRadius: "999px",
  background: "rgba(59,130,246,0.16)",
  filter: "blur(88px)",
  pointerEvents: "none" as const,
};

const pageWrap = {
  position: "relative" as const,
  zIndex: 2,
  width: "100%",
  maxWidth: "760px",
  display: "flex",
  justifyContent: "center",
};

const loginCard = {
  width: "100%",
  maxWidth: "420px",
  position: "relative" as const,
  borderRadius: "34px",
  padding: "26px 18px 18px",
  background:
    "linear-gradient(180deg, rgba(19,28,52,0.72) 0%, rgba(17,23,43,0.78) 55%, rgba(23,28,50,0.74) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.04) inset",
};

const cardStroke = {
  position: "absolute" as const,
  inset: 0,
  borderRadius: "34px",
  pointerEvents: "none" as const,
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 34px rgba(34,211,238,0.08)",
};

const logoBadgeWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "14px",
};

const logoBadge = {
  width: "74px",
  height: "74px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #22c55e, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
  boxShadow: "0 0 26px rgba(34,197,94,0.34)",
};

const title = {
  margin: 0,
  textAlign: "center" as const,
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
  letterSpacing: "0.6px",
};

const subtitle = {
  margin: "10px 0 0 0",
  textAlign: "center" as const,
  color: "rgba(255,255,255,0.84)",
  fontSize: "15px",
  lineHeight: 1.5,
};

const formArea = {
  marginTop: "22px",
  display: "grid",
  gap: "16px",
};

const label = {
  display: "block",
  marginBottom: "10px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 800,
};

const input = {
  width: "100%",
  height: "54px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.94)",
  color: "#111827",
  padding: "0 18px",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box" as const,
  boxShadow: "0 8px 18px rgba(255,255,255,0.06) inset",
};

const senhaRow = {
  display: "grid",
  gridTemplateColumns: "1fr 86px",
  gap: "8px",
};

const inputSenha = {
  width: "100%",
  height: "54px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.94)",
  color: "#111827",
  padding: "0 18px",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const botaoVer = {
  height: "54px",
  borderRadius: "18px",
  border: "1px solid rgba(96,165,250,0.26)",
  background: "linear-gradient(135deg, #60a5fa, #2563eb)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(37,99,235,0.24)",
};

const rowInfo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const safeText = {
  color: "rgba(255,255,255,0.80)",
  fontSize: "15px",
};

const botaoRecuperar = {
  border: "none",
  borderRadius: "999px",
  padding: "10px 16px",
  background: "linear-gradient(135deg, #d946ef, #a855f7)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(168,85,247,0.24)",
};

const erroBox = {
  padding: "12px 14px",
  borderRadius: "16px",
  background: "rgba(239,68,68,0.16)",
  border: "1px solid rgba(239,68,68,0.24)",
  color: "#fecaca",
  fontSize: "14px",
  fontWeight: 700,
};

const sucessoBox = {
  padding: "12px 14px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.16)",
  border: "1px solid rgba(34,197,94,0.24)",
  color: "#bbf7d0",
  fontSize: "14px",
  fontWeight: 700,
};

const botaoEntrar = {
  height: "58px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 30px rgba(34,197,94,0.30)",
};

const botaoCriar = {
  height: "56px",
  borderRadius: "18px",
  border: "1px solid rgba(34,211,238,0.18)",
  background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(6,182,212,0.22)",
};

const footerInfo = {
  padding: "14px 14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const footerInfoText = {
  margin: 0,
  textAlign: "center" as const,
  color: "rgba(255,255,255,0.80)",
  fontSize: "15px",
  lineHeight: 1.6,
};