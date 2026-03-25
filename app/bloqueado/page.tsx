"use client";

import { useRouter } from "next/navigation";

export default function BloqueadoPage() {
  const router = useRouter();

  return (
    <div style={pagina}>
      <div style={card}>
        <h1 style={titulo}>Acesso bloqueado</h1>
        <p style={texto}>
          Seu período grátis terminou ou seu pagamento está pendente.
          Entre em contato com seu personal para continuar usando a plataforma.
        </p>

        <button style={botao} onClick={() => router.push("/")}>
          Voltar
        </button>
      </div>
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #071133 0%, #0b1d5c 45%, #071133 100%)",
  padding: "24px",
};

const card = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(18px)",
  padding: "32px",
  textAlign: "center" as const,
};

const titulo = {
  margin: 0,
  color: "#fff",
  fontSize: "40px",
  fontWeight: 900,
};

const texto = {
  margin: "16px 0 0 0",
  color: "rgba(255,255,255,0.78)",
  fontSize: "16px",
  lineHeight: 1.8,
};

const botao = {
  marginTop: "24px",
  width: "100%",
  height: "56px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80, #22c55e)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
};