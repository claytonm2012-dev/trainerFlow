"use client";

import Link from "next/link";

export default function SuportePage() {
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

        <h1 style={title}>Suporte</h1>
        <p style={subtitle}>Estamos aqui para ajudar</p>

        <div style={content}>
          <section style={section}>
            <h2 style={sectionTitle}>Central de Ajuda</h2>
            <p style={text}>
              Se voce esta com duvidas ou enfrentando algum problema com o Trainer Flow, 
              estamos prontos para ajudar. Confira abaixo as formas de contato e recursos 
              disponiveis.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Contato por E-mail</h2>
            <p style={text}>
              Para suporte tecnico, duvidas ou sugestoes, envie um e-mail para:
            </p>
            <div style={contactBox}>
              <a href="mailto:claytonm2012@live.com" style={emailLink}>
                claytonm2012@live.com
              </a>
            </div>
            <p style={textSmall}>
              Tempo medio de resposta: 24-48 horas uteis
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Perguntas Frequentes</h2>
            
            <div style={faqItem}>
              <h3 style={faqQuestion}>Como criar uma conta?</h3>
              <p style={text}>
                Voce pode criar uma conta usando seu e-mail ou fazendo login com Google, 
                Facebook ou Apple. Basta clicar em &quot;Cadastre-se&quot; na pagina inicial.
              </p>
            </div>

            <div style={faqItem}>
              <h3 style={faqQuestion}>Esqueci minha senha. O que fazer?</h3>
              <p style={text}>
                Na tela de login, clique em &quot;Esqueci minha senha&quot; e siga as instrucoes 
                enviadas para seu e-mail cadastrado.
              </p>
            </div>

            <div style={faqItem}>
              <h3 style={faqQuestion}>Como excluir minha conta?</h3>
              <p style={text}>
                Voce pode solicitar a exclusao de seus dados acessando nossa pagina de{" "}
                <Link href="/data-deletion" style={inlineLink}>Exclusao de Dados</Link>.
              </p>
            </div>

            <div style={faqItem}>
              <h3 style={faqQuestion}>O app e gratuito?</h3>
              <p style={text}>
                O Trainer Flow oferece um periodo de teste gratuito. Apos o periodo de 
                avaliacao, voce pode escolher um dos nossos planos de assinatura.
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Links Uteis</h2>
            <ul style={linksList}>
              <li>
                <Link href="/privacy" style={utilLink}>Politica de Privacidade</Link>
              </li>
              <li>
                <Link href="/termos" style={utilLink}>Termos de Servico</Link>
              </li>
              <li>
                <Link href="/data-deletion" style={utilLink}>Exclusao de Dados</Link>
              </li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Horario de Atendimento</h2>
            <p style={text}>
              Segunda a Sexta: 9h as 18h (Horario de Brasilia)<br />
              Sabados, Domingos e Feriados: Sem atendimento
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

const textSmall: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.50)",
  fontSize: "12px",
};

const contactBox: React.CSSProperties = {
  marginTop: "12px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(34,211,238,0.08)",
  border: "1px solid rgba(34,211,238,0.20)",
  textAlign: "center",
};

const emailLink: React.CSSProperties = {
  color: "#22d3ee",
  fontSize: "16px",
  fontWeight: 700,
  textDecoration: "none",
};

const faqItem: React.CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const faqQuestion: React.CSSProperties = {
  margin: "0 0 8px 0",
  color: "#22c55e",
  fontSize: "14px",
  fontWeight: 700,
};

const inlineLink: React.CSSProperties = {
  color: "#22d3ee",
  textDecoration: "underline",
};

const linksList: React.CSSProperties = {
  margin: "10px 0 0 0",
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const utilLink: React.CSSProperties = {
  color: "#22d3ee",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
};
