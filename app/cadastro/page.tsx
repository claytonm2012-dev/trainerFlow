"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import auth from "../firebaseAuth";
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