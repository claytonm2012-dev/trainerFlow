"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import auth, { signInWithSocial, SocialProvider } from "../firebaseAuth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarModalSocial, setMostrarModalSocial] = useState(false);
  const [carregandoSocial, setCarregandoSocial] = useState<SocialProvider | null>(null);

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

  async function handleSocialLogin(provider: SocialProvider) {
    setErro("");
    setMensagem("");
    setCarregandoSocial(provider);

    try {
      await signInWithSocial(provider);
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro ao fazer login social:", error);
      
      if (error?.code === "auth/popup-closed-by-user") {
        setErro("Login cancelado. Tente novamente.");
      } else if (error?.code === "auth/popup-blocked") {
        setErro("Popup bloqueado. Permita popups e tente novamente.");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        setErro("Este e-mail já está vinculado a outro método de login.");
      } else if (error?.code === "auth/cancelled-popup-request") {
        // Usuário cancelou, não mostrar erro
      } else {
        setErro("Não foi possível fazer login. Tente novamente.");
      }
    } finally {
      setCarregandoSocial(null);
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
              onClick={() => setMostrarModalSocial(true)}
              style={botaoCriar}
            >
              Cadastre-se
            </button>

            <div style={footerInfo}>
              <p style={footerInfoText}>
                Organize alunos, agenda, evolução e financeiro em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Autenticação Social */}
      {mostrarModalSocial && (
        <div style={modalOverlay} onClick={() => setMostrarModalSocial(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalCardStroke}></div>
            
            <button
              type="button"
              onClick={() => setMostrarModalSocial(false)}
              style={modalClose}
            >
              X
            </button>

            <div style={modalLogoBadgeWrap}>
              <div style={modalLogoBadge}>T</div>
            </div>

            <h2 style={modalTitle}>Cadastre-se</h2>
            <p style={modalSubtitle}>Escolha como deseja criar sua conta</p>

            <div style={modalButtons}>
              {/* Botão Google */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={carregandoSocial !== null}
                style={{
                  ...socialButton,
                  background: "rgba(255,255,255,0.95)",
                  color: "#1f2937",
                  opacity: carregandoSocial !== null ? 0.7 : 1,
                }}
              >
                <svg style={socialIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {carregandoSocial === 'google' ? 'Conectando...' : 'Continuar com Google'}
              </button>

              {/* Botão Facebook */}
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={carregandoSocial !== null}
                style={{
                  ...socialButton,
                  background: "#1877F2",
                  color: "#ffffff",
                  opacity: carregandoSocial !== null ? 0.7 : 1,
                }}
              >
                <svg style={socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {carregandoSocial === 'facebook' ? 'Conectando...' : 'Continuar com Facebook'}
              </button>

              {/* Botão Apple */}
              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                disabled={carregandoSocial !== null}
                style={{
                  ...socialButton,
                  background: "#000000",
                  color: "#ffffff",
                  opacity: carregandoSocial !== null ? 0.7 : 1,
                }}
              >
                <svg style={socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {carregandoSocial === 'apple' ? 'Conectando...' : 'Continuar com Apple'}
              </button>
            </div>

            <div style={modalDivider}>
              <span style={modalDividerLine}></span>
              <span style={modalDividerText}>ou</span>
              <span style={modalDividerLine}></span>
            </div>

            {/* Botão para cadastro com email */}
            <button
              type="button"
              onClick={() => {
                setMostrarModalSocial(false);
                router.push("/cadastro");
              }}
              style={emailButton}
            >
              Cadastrar com e-mail
            </button>

            {erro && <div style={modalErroBox}>{erro}</div>}
          </div>
        </div>
      )}

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
  backgroundImage: `url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/equipamento-de-ginastica-3d_23-2151114226-nQyh6wBYWUAZhWXoDW06z8Bx3dkK8k.avif")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed" as const,
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
  backgroundImage: "linear-gradient(295deg, #60c7fa 0%, rgb(37, 235, 118) 50%)",
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
  backgroundImage: "linear-gradient(135deg, #00bbc8 0%, rgba(85, 247, 87, 0.78) 50%)",
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
    "linear-gradient(69deg, rgb(74, 222, 128) 0%, #22b5c5 45%, rgb(22, 163, 74) 100%)",
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
  background: "linear-gradient(46deg, #41ee22 0%, #06d4b2 50%)",
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

// Estilos do Modal de Autenticação Social
const modalOverlay = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(8px)",
  padding: "20px",
};

const modalCard = {
  width: "100%",
  maxWidth: "400px",
  position: "relative" as const,
  borderRadius: "30px",
  padding: "28px 22px",
  background:
    "linear-gradient(180deg, rgba(19,28,52,0.92) 0%, rgba(17,23,43,0.95) 55%, rgba(23,28,50,0.92) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.04) inset",
};

const modalCardStroke = {
  position: "absolute" as const,
  inset: 0,
  borderRadius: "30px",
  pointerEvents: "none" as const,
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 34px rgba(34,211,238,0.08)",
};

const modalClose = {
  position: "absolute" as const,
  top: "16px",
  right: "16px",
  width: "32px",
  height: "32px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.70)",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalLogoBadgeWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "14px",
};

const modalLogoBadge = {
  width: "60px",
  height: "60px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #22c55e, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 900,
  boxShadow: "0 0 22px rgba(34,197,94,0.30)",
};

const modalTitle = {
  margin: 0,
  textAlign: "center" as const,
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: 900,
};

const modalSubtitle = {
  margin: "8px 0 20px 0",
  textAlign: "center" as const,
  color: "rgba(255,255,255,0.70)",
  fontSize: "14px",
};

const modalButtons = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const socialButton = {
  width: "100%",
  height: "52px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  transition: "transform 0.15s ease",
};

const socialIcon = {
  width: "20px",
  height: "20px",
};

const modalDivider = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "18px 0",
};

const modalDividerLine = {
  flex: 1,
  height: "1px",
  background: "rgba(255,255,255,0.12)",
};

const modalDividerText = {
  color: "rgba(255,255,255,0.50)",
  fontSize: "13px",
  fontWeight: 600,
};

const emailButton = {
  width: "100%",
  height: "52px",
  borderRadius: "14px",
  border: "1px solid rgba(34,211,238,0.22)",
  background: "rgba(34,211,238,0.12)",
  color: "#22d3ee",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
};

const modalErroBox = {
  marginTop: "14px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(239,68,68,0.16)",
  border: "1px solid rgba(239,68,68,0.24)",
  color: "#fecaca",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center" as const,
};
