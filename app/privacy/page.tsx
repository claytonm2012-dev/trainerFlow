"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={container}>
      <div style={card}>
        <div style={cardStroke}></div>
        
        <Link href="/login" style={backLink}>
          &larr; Voltar ao login
        </Link>

        <div style={logoBadgeWrap}>
          <div style={logoBadge}>T</div>
        </div>

        <h1 style={title}>Política de Privacidade</h1>
        <p style={subtitle}>Última atualização: Março de 2026</p>

        <div style={content}>
          <section style={section}>
            <h2 style={sectionTitle}>1. Introdução</h2>
            <p style={text}>
              O Trainer Flow (&quot;nós&quot;, &quot;nosso&quot; ou &quot;aplicativo&quot;) está comprometido em proteger 
              sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos e 
              protegemos suas informações pessoais quando você utiliza nosso aplicativo.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>2. Informações que Coletamos</h2>
            <p style={text}>Ao usar o Trainer Flow, podemos coletar:</p>
            <ul style={list}>
              <li>Nome e endereço de e-mail (para criação de conta)</li>
              <li>Foto de perfil (quando você faz login com redes sociais)</li>
              <li>Dados de treinos e progresso físico dos alunos</li>
              <li>Informações de agendamento e financeiras</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>3. Como Usamos suas Informações</h2>
            <p style={text}>Utilizamos suas informações para:</p>
            <ul style={list}>
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Permitir login seguro via Google, Facebook ou Apple</li>
              <li>Gerenciar agendamentos e acompanhamento de alunos</li>
              <li>Enviar notificações relacionadas ao serviço</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>4. Compartilhamento de Dados</h2>
            <p style={text}>
              Não vendemos suas informações pessoais. Seus dados podem ser compartilhados 
              apenas com serviços necessários para o funcionamento do app (como Firebase 
              para autenticação e armazenamento).
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>5. Segurança</h2>
            <p style={text}>
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              suas informações contra acesso não autorizado, alteração ou destruição.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>6. Seus Direitos</h2>
            <p style={text}>Você tem o direito de:</p>
            <ul style={list}>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar consentimentos a qualquer momento</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>7. Contato</h2>
            <p style={text}>
              Para dúvidas sobre esta política ou para exercer seus direitos, entre em 
              contato conosco pelo e-mail: <strong>claytonm2012@live.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0a0f1c 0%, #111827 50%, #0d1424 100%)",
  padding: "40px 20px",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  position: "relative",
  borderRadius: "30px",
  padding: "32px 28px",
  background:
    "linear-gradient(180deg, rgba(19,28,52,0.92) 0%, rgba(17,23,43,0.95) 55%, rgba(23,28,50,0.92) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.04) inset",
};

const cardStroke: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "30px",
  pointerEvents: "none",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 34px rgba(34,211,238,0.08)",
};

const backLink: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "20px",
  color: "#22d3ee",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
};

const logoBadgeWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "16px",
};

const logoBadge: React.CSSProperties = {
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

const title: React.CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 900,
};

const subtitle: React.CSSProperties = {
  margin: "8px 0 24px 0",
  textAlign: "center",
  color: "rgba(255,255,255,0.60)",
  fontSize: "14px",
};

const content: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const section: React.CSSProperties = {
  paddingBottom: "16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 10px 0",
  color: "#22d3ee",
  fontSize: "16px",
  fontWeight: 700,
};

const text: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.80)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const list: React.CSSProperties = {
  margin: "10px 0 0 0",
  paddingLeft: "20px",
  color: "rgba(255,255,255,0.80)",
  fontSize: "14px",
  lineHeight: 1.8,
};
