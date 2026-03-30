"use client";

import Link from "next/link";

export default function DataDeletionPage() {
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

        <h1 style={title}>Exclusão de Dados</h1>
        <p style={subtitle}>Instruções para solicitar a remoção dos seus dados</p>

        <div style={content}>
          <section style={section}>
            <h2 style={sectionTitle}>Seus Direitos</h2>
            <p style={text}>
              De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras regulamentações 
              de privacidade, você tem o direito de solicitar a exclusão completa dos seus 
              dados pessoais armazenados pelo Trainer Flow.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Quais Dados Serão Excluídos</h2>
            <p style={text}>Ao solicitar a exclusão, removeremos:</p>
            <ul style={list}>
              <li>Informações de perfil (nome, e-mail, foto)</li>
              <li>Dados de treinos e progresso</li>
              <li>Histórico de agendamentos</li>
              <li>Informações financeiras</li>
              <li>Qualquer outro dado associado à sua conta</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Como Solicitar a Exclusão</h2>
            <p style={text}>
              Para solicitar a exclusão dos seus dados, siga um dos métodos abaixo:
            </p>
            
            <div style={methodBox}>
              <h3 style={methodTitle}>Opção 1: Via E-mail</h3>
              <p style={text}>
                Envie um e-mail para <strong>claytonm2012@live.com</strong> com o assunto 
                &quot;Solicitação de Exclusão de Dados&quot; incluindo:
              </p>
              <ul style={list}>
                <li>Seu nome completo</li>
                <li>E-mail cadastrado na conta</li>
                <li>Confirmação de que deseja excluir todos os dados</li>
              </ul>
            </div>

            <div style={methodBox}>
              <h3 style={methodTitle}>Opção 2: Via Configurações do App</h3>
              <p style={text}>
                Se você ainda tem acesso à sua conta:
              </p>
              <ul style={list}>
                <li>Acesse seu perfil no Dashboard</li>
                <li>Vá em Configurações da Conta</li>
                <li>Selecione &quot;Excluir minha conta&quot;</li>
              </ul>
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Prazo de Processamento</h2>
            <p style={text}>
              Sua solicitação será processada em até <strong>15 dias úteis</strong>. 
              Você receberá um e-mail de confirmação quando a exclusão for concluída.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Observações Importantes</h2>
            <ul style={list}>
              <li>A exclusão é permanente e não pode ser desfeita</li>
              <li>Você perderá acesso a todo o histórico de dados</li>
              <li>Dados necessários para cumprimento legal podem ser retidos conforme a lei</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Contato</h2>
            <p style={text}>
              Em caso de dúvidas sobre o processo de exclusão, entre em contato: 
              <strong> claytonm2012@live.com</strong>
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

const methodBox: React.CSSProperties = {
  marginTop: "16px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const methodTitle: React.CSSProperties = {
  margin: "0 0 8px 0",
  color: "#22c55e",
  fontSize: "14px",
  fontWeight: 700,
};
