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
            <h2 style={sectionTitle}>1. Introducao</h2>
            <p style={text}>
              O TrainerFlow (&quot;nos&quot;, &quot;nosso&quot; ou &quot;aplicativo&quot;) esta comprometido em proteger 
              sua privacidade. Esta Politica de Privacidade descreve como coletamos, usamos e 
              protegemos suas informacoes pessoais quando voce utiliza nosso aplicativo de 
              gestao de treinos e alunos.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>2. Metodos de Login</h2>
            <p style={text}>
              O TrainerFlow oferece login atraves de provedores de autenticacao social:
            </p>
            <ul style={list}>
              <li><strong>Google</strong> - Utilizamos o Google Sign-In para autenticacao segura</li>
              <li><strong>Facebook</strong> - Utilizamos o Facebook Login para autenticacao segura</li>
              <li><strong>E-mail e senha</strong> - Cadastro tradicional com credenciais proprias</li>
            </ul>
            <p style={text}>
              Ao fazer login com Google ou Facebook, recebemos apenas as informacoes basicas 
              do seu perfil publico (nome, e-mail e foto).
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>3. Informacoes que Coletamos</h2>
            <p style={text}>Ao usar o TrainerFlow, coletamos:</p>
            <ul style={list}>
              <li><strong>Nome completo</strong> - Para identificacao no aplicativo</li>
              <li><strong>Endereco de e-mail</strong> - Para login e comunicacoes essenciais</li>
              <li><strong>Foto de perfil</strong> - Quando fornecida pelo provedor de login social</li>
              <li><strong>Dados de uso do treino</strong> - Exercicios, series, repeticoes, cargas e progresso</li>
              <li><strong>Informacoes de agendamento</strong> - Horarios e sessoes de treino</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>4. Como Usamos suas Informacoes</h2>
            <p style={text}>Utilizamos suas informacoes exclusivamente para:</p>
            <ul style={list}>
              <li>Permitir seu acesso ao aplicativo via Google, Facebook ou e-mail</li>
              <li>Gerenciar seus treinos e acompanhar seu progresso</li>
              <li>Permitir que personal trainers gerenciem seus alunos</li>
              <li>Enviar notificacoes sobre agendamentos e treinos</li>
              <li>Melhorar a experiencia do usuario no aplicativo</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>5. Compartilhamento de Dados</h2>
            <p style={highlightBox}>
              <strong>NAO compartilhamos seus dados pessoais com terceiros.</strong>
            </p>
            <p style={text}>
              Seus dados sao armazenados de forma segura no Firebase (Google Cloud) e sao 
              utilizados exclusivamente para o funcionamento do TrainerFlow. Nao vendemos, 
              alugamos ou compartilhamos suas informacoes com empresas de marketing, 
              anunciantes ou quaisquer outras entidades externas.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>6. Seguranca dos Dados</h2>
            <p style={text}>
              Implementamos medidas de seguranca tecnicas e organizacionais para proteger 
              suas informacoes, incluindo:
            </p>
            <ul style={list}>
              <li>Criptografia de dados em transito (HTTPS/SSL)</li>
              <li>Autenticacao segura via Firebase Authentication</li>
              <li>Armazenamento seguro no Google Cloud (Firestore)</li>
              <li>Acesso restrito aos dados apenas para usuarios autorizados</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>7. Seus Direitos (LGPD)</h2>
            <p style={text}>De acordo com a Lei Geral de Protecao de Dados, voce tem o direito de:</p>
            <ul style={list}>
              <li>Acessar seus dados pessoais armazenados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusao completa dos seus dados</li>
              <li>Revogar consentimentos a qualquer momento</li>
              <li>Solicitar portabilidade dos seus dados</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>8. Exclusao de Dados</h2>
            <p style={text}>
              Voce pode solicitar a exclusao completa dos seus dados a qualquer momento. 
              Para instruções detalhadas, acesse nossa pagina de{" "}
              <a href="/data-deletion" style={linkStyle}>Exclusao de Dados</a>.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>9. Contato</h2>
            <p style={text}>
              Para duvidas sobre esta politica, exercer seus direitos ou solicitar 
              exclusao de dados, entre em contato pelo e-mail:
            </p>
            <p style={emailBox}>claytonm2012@live.com</p>
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

const highlightBox: React.CSSProperties = {
  margin: "0 0 12px 0",
  padding: "14px 16px",
  borderRadius: "12px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.25)",
  color: "#22c55e",
  fontSize: "14px",
  lineHeight: 1.6,
  textAlign: "center",
};

const linkStyle: React.CSSProperties = {
  color: "#22d3ee",
  textDecoration: "underline",
};

const emailBox: React.CSSProperties = {
  marginTop: "10px",
  padding: "14px 18px",
  borderRadius: "12px",
  background: "rgba(34,211,238,0.10)",
  border: "1px solid rgba(34,211,238,0.20)",
  color: "#22d3ee",
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "center",
};
