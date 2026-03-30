"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import auth, { signInWithSocial, SocialProvider } from "../firebaseAuth";
import db from "../firebaseDb";
import { calcularFimTrial, getValorPlano } from "@/utils/plano";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [carregandoSocial, setCarregandoSocial] = useState<SocialProvider | null>(null);

  async function handleSocialLogin(provider: SocialProvider) {
    setErro("");
    setCarregandoSocial(provider);

    try {
      await signInWithSocial(provider);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Erro ao fazer login social:", error);
      
      if (error?.code === "auth/popup-closed-by-user") {
        setErro("Login cancelado. Tente novamente.");
      } else if (error?.code === "auth/popup-blocked") {
        setErro("Popup bloqueado. Permita popups e tente novamente.");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        setErro("Este e-mail ja esta vinculado a outro metodo de login.");
      } else if (error?.code === "auth/cancelled-popup-request") {
        // Usuario cancelou, nao mostrar erro
      } else {
        setErro("Nao foi possivel fazer login. Tente novamente.");
      }
    } finally {
      setCarregandoSocial(null);
    }
  }

  async function criarConta() {
    setErro("");

    if (!nome.trim()) {
      setErro("Digite seu nome.");
      return;
    }

    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (!senha.trim()) {
      setErro("Digite sua senha.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);

      const credencial = await createUserWithEmailAndPassword(auth, email, senha);
      const user = credencial.user;

      const emailNormalizado = email.trim().toLowerCase();

      const emailsAdmin = [
        "claytonm2012@live.com",
      ];

      const ehAdmin = emailsAdmin.includes(emailNormalizado);

      const planoInicial = "mensal";
      const valorPlano = getValorPlano(planoInicial);
      const trialFim = calcularFimTrial();

      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        nome: nome.trim(),
        email: emailNormalizado,
        tipo: ehAdmin ? "admin" : "personal",

        plano: planoInicial,
        valorPlano,
        statusAcesso: ehAdmin ? "ativo" : "trial",
        trialInicio: new Date().toISOString(),
        trialFim: trialFim.toISOString(),
        pagamentoStatus: ehAdmin ? "pago" : "pendente",
        vencimentoEm: ehAdmin ? null : null,
        linkPagamento: "",

        criadoEm: serverTimestamp(),
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);

      const codigo = error?.code || "";

      if (codigo === "auth/email-already-in-use") {
        setErro("Este e-mail já está em uso.");
      } else if (codigo === "auth/invalid-email") {
        setErro("E-mail inválido.");
      } else if (codigo === "auth/weak-password") {
        setErro("Senha muito fraca.");
      } else {
        setErro("Não foi possível criar a conta.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={pagina}>
      <div style={fundoGlowUm}></div>
      <div style={fundoGlowDois}></div>

      <div style={card}>
        <div style={topo}>
          <div style={logoBox}>T</div>
          <h1 style={titulo}>Criar conta</h1>
          <p style={subtitulo}>Cadastre seu acesso de personal trainer no TrainerFlow</p>
        </div>

        <div style={formulario}>
          <div style={campo}>
            <label style={label}>Nome</label>
            <input
              style={input}
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div style={campo}>
            <label style={label}>E-mail</label>
            <input
              style={input}
              type="email"
              placeholder="seuemail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={campo}>
            <label style={label}>Senha</label>
            <input
              style={input}
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div style={campo}>
            <label style={label}>Confirmar senha</label>
            <input
              style={input}
              type="password"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>

          <div style={trialBox}>
            <div style={trialHeader}>
              <span style={trialBadge}>3 dias grátis</span>
            </div>

            <p style={trialTitulo}>Uso exclusivo para personal trainer</p>

            <p style={trialTexto}>
              Organize sua agenda, financeiro, horários de aula e gestão dos seus
              alunos em um só lugar. Após o período gratuito, escolha um dos
              planos para continuar usando a plataforma.
            </p>

            <div style={trialPlanos}>
              <div style={trialPlanoItem}>
                <span style={trialPlanoNome}>Mensal</span>
                <strong style={trialPlanoValor}>R$ 19,99</strong>
              </div>

              <div style={trialPlanoItem}>
                <span style={trialPlanoNome}>Trimestral</span>
                <strong style={trialPlanoValor}>R$ 45,00</strong>
              </div>

              <div style={trialPlanoItem}>
                <span style={trialPlanoNome}>Anual</span>
                <strong style={trialPlanoValor}>R$ 120,00</strong>
              </div>
            </div>
          </div>

          {erro ? <div style={erroBox}>{erro}</div> : null}

          <button
            style={botaoPrincipal}
            onClick={criarConta}
            disabled={carregando}
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>

          <button
            style={botaoSecundario}
            onClick={() => router.push("/")}
            disabled={carregando}
          >
            Voltar para login
          </button>

          <div style={socialDivider}>
            <span style={socialDividerLine}></span>
            <span style={socialDividerText}>ou cadastre-se com</span>
            <span style={socialDividerLine}></span>
          </div>

          <div style={socialButtonsRow}>
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={carregandoSocial !== null || carregando}
              style={{
                ...socialBtn,
                background: "rgba(255,255,255,0.95)",
                opacity: carregandoSocial !== null ? 0.7 : 1,
              }}
              title="Continuar com Google"
            >
              <svg style={socialIconStyle} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={carregandoSocial !== null || carregando}
              style={{
                ...socialBtn,
                background: "#1877F2",
                opacity: carregandoSocial !== null ? 0.7 : 1,
              }}
              title="Continuar com Facebook"
            >
              <svg style={socialIconStyle} viewBox="0 0 24 24" fill="#ffffff">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              disabled={carregandoSocial !== null || carregando}
              style={{
                ...socialBtn,
                background: "#000000",
                opacity: carregandoSocial !== null ? 0.7 : 1,
              }}
              title="Continuar com Apple"
            >
              <svg style={socialIconStyle} viewBox="0 0 24 24" fill="#ffffff">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  position: "relative" as const,
  overflow: "hidden" as const,
  background: "linear-gradient(135deg, #071133 0%, #0b1d5c 45%, #071133 100%)",
};

const fundoGlowUm = {
  position: "absolute" as const,
  top: "-120px",
  left: "-120px",
  width: "280px",
  height: "280px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.18)",
  filter: "blur(80px)",
};

const fundoGlowDois = {
  position: "absolute" as const,
  bottom: "-100px",
  right: "-100px",
  width: "260px",
  height: "260px",
  borderRadius: "999px",
  background: "rgba(59,130,246,0.20)",
  filter: "blur(80px)",
};

const card = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "30px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
  padding: "34px",
  position: "relative" as const,
  zIndex: 1,
};

const topo = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  marginBottom: "28px",
};

const logoBox = {
  width: "72px",
  height: "72px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #4ade80, #22c55e)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: "34px",
  fontWeight: 900,
  marginBottom: "18px",
  boxShadow: "0 18px 34px rgba(34,197,94,0.30)",
};

const titulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "40px",
  fontWeight: 900,
  textAlign: "center" as const,
};

const subtitulo = {
  margin: "10px 0 0 0",
  color: "rgba(255,255,255,0.76)",
  fontSize: "15px",
  textAlign: "center" as const,
  lineHeight: 1.7,
};

const formulario = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
};

const campo = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const label = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 800,
};

const input = {
  width: "100%",
  height: "56px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.95)",
  padding: "0 16px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const trialBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  borderRadius: "18px",
  border: "1px solid rgba(74,222,128,0.20)",
  background: "rgba(74,222,128,0.08)",
  padding: "16px",
};

const trialHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
};

const trialBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.18)",
  color: "#bbf7d0",
  fontSize: "12px",
  fontWeight: 900,
  border: "1px solid rgba(34,197,94,0.24)",
};

const trialTitulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 900,
};

const trialTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const trialPlanos = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
};

const trialPlanoItem = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  minHeight: "48px",
  padding: "0 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const trialPlanoNome = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 800,
};

const trialPlanoValor = {
  color: "#86efac",
  fontSize: "14px",
  fontWeight: 900,
};

const erroBox = {
  minHeight: "52px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.24)",
  color: "#fecaca",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  fontSize: "14px",
  fontWeight: 700,
};

const botaoPrincipal = {
  width: "100%",
  height: "58px",
  borderRadius: "18px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 18px 34px rgba(34,197,94,0.28)",
  marginTop: "8px",
};

const botaoSecundario = {
  width: "100%",
  height: "54px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
};

const socialDivider: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginTop: "16px",
};

const socialDividerLine: React.CSSProperties = {
  flex: 1,
  height: "1px",
  background: "rgba(255,255,255,0.12)",
};

const socialDividerText: React.CSSProperties = {
  color: "rgba(255,255,255,0.50)",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const socialButtonsRow: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "12px",
};

const socialBtn: React.CSSProperties = {
  flex: 1,
  height: "52px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.15s ease",
};

const socialIconStyle: React.CSSProperties = {
  width: "22px",
  height: "22px",
};
