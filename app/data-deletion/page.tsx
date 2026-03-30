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

        <h1 style={title}>Exclusao de Dados</h1>
        <p style={subtitle}>Como solicitar a remocao dos seus dados do TrainerFlow</p>

        <div style={content}>
          <section style={section}>
            <h2 style={sectionTitle}>Seus Direitos</h2>
            <p style={text}>
              De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem o direito de 
              solicitar a exclusao completa dos seus dados pessoais armazenados pelo 
              TrainerFlow a qualquer momento, independentemente de ter feito login via 
              Google, Facebook ou e-mail.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Dados que Serao Excluidos</h2>
            <p style={text}>Ao solicitar a exclusao, removeremos permanentemente:</p>
            <ul style={list}>
              <li><strong>Dados de perfil:</strong> nome, e-mail e foto</li>
              <li><strong>Dados de treino:</strong> exercicios, series, repeticoes e cargas</li>
              <li><strong>Historico de progresso:</strong> evolucao e metricas</li>
              <li><strong>Agendamentos:</strong> sessoes e horarios</li>
              <li><strong>Dados de autenticacao:</strong> vinculo com Google/Facebook</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Como Solicitar a Exclusao</h2>
            
            <div style={methodBoxPrimary}>
              <h3 style={methodTitlePrimary}>Envie um E-mail</h3>
              <p style={text}>
                Para solicitar a exclusao dos seus dados, envie um e-mail para:
              </p>
              <p style={emailHighlight}>claytonm2012@live.com</p>
              
              <p style={textSmall}>
                <strong>Assunto:</strong> Solicitacao de Exclusao de Dados - TrainerFlow
              </p>
              
              <p style={text}>Inclua no corpo do e-mail:</p>
              <ul style={list}>
                <li>Seu nome completo cadastrado no app</li>
                <li>O e-mail usado para fazer login (Google, Facebook ou cadastro)</li>
                <li>Confirmacao: &quot;Solicito a exclusao permanente de todos os meus dados&quot;</li>
              </ul>
            </div>

            <div style={templateBox}>
              <h4 style={templateTitle}>Modelo de E-mail:</h4>
              <p style={templateText}>
                Assunto: Solicitacao de Exclusao de Dados - TrainerFlow<br/><br/>
                Ola,<br/><br/>
                Solicito a exclusao permanente de todos os meus dados do aplicativo TrainerFlow.<br/><br/>
                Nome: [Seu nome completo]<br/>
                E-mail cadastrado: [seu-email@exemplo.com]<br/><br/>
                Confirmo que desejo excluir todos os meus dados.<br/><br/>
                Atenciosamente,<br/>
                [Seu nome]
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Prazo de Processamento</h2>
            <div style={infoBox}>
              <p style={infoText}>
                Sua solicitacao sera processada em ate <strong>15 dias uteis</strong>.
              </p>
              <p style={infoTextSmall}>
                Voce recebera um e-mail de confirmacao quando a exclusao for concluida.
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Observacoes Importantes</h2>
            <ul style={listWarning}>
              <li>A exclusao e <strong>permanente</strong> e nao pode ser desfeita</li>
              <li>Voce perdera acesso a todo o historico de treinos e progresso</li>
              <li>Se voce fez login com Google ou Facebook, apenas os dados do TrainerFlow serao removidos (nao afeta sua conta Google/Facebook)</li>
              <li>Dados necessarios para cumprimento legal podem ser retidos conforme a lei</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>Duvidas?</h2>
            <p style={text}>
              Se tiver alguma duvida sobre o processo de exclusao ou precisar de ajuda, 
              entre em contato pelo mesmo e-mail:
            </p>
            <p style={emailFinal}>claytonm2012@live.com</p>
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

const methodBoxPrimary: React.CSSProperties = {
  marginTop: "16px",
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(34,211,238,0.08)",
  border: "1px solid rgba(34,211,238,0.20)",
};

const methodTitlePrimary: React.CSSProperties = {
  margin: "0 0 12px 0",
  color: "#22d3ee",
  fontSize: "16px",
  fontWeight: 700,
};

const emailHighlight: React.CSSProperties = {
  margin: "12px 0",
  padding: "14px 18px",
  borderRadius: "12px",
  background: "rgba(34,211,238,0.15)",
  border: "1px solid rgba(34,211,238,0.30)",
  color: "#22d3ee",
  fontSize: "17px",
  fontWeight: 800,
  textAlign: "center",
};

const textSmall: React.CSSProperties = {
  margin: "12px 0 8px 0",
  color: "rgba(255,255,255,0.70)",
  fontSize: "13px",
  lineHeight: 1.6,
};

const templateBox: React.CSSProperties = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const templateTitle: React.CSSProperties = {
  margin: "0 0 10px 0",
  color: "#22c55e",
  fontSize: "13px",
  fontWeight: 700,
};

const templateText: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.65)",
  fontSize: "13px",
  lineHeight: 1.8,
  fontFamily: "monospace",
};

const infoBox: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: "14px",
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.20)",
  textAlign: "center",
};

const infoText: React.CSSProperties = {
  margin: 0,
  color: "#22c55e",
  fontSize: "15px",
  fontWeight: 600,
};

const infoTextSmall: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.60)",
  fontSize: "13px",
};

const listWarning: React.CSSProperties = {
  margin: "10px 0 0 0",
  paddingLeft: "20px",
  color: "rgba(255,255,255,0.75)",
  fontSize: "14px",
  lineHeight: 2,
};

const emailFinal: React.CSSProperties = {
  marginTop: "12px",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#22d3ee",
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "center",
};
