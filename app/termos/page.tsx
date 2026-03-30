"use client";

import Link from "next/link";

export default function TermosPage() {
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

        <h1 style={title}>Termos de Serviço</h1>
        <p style={subtitle}>Última atualização: Março de 2026</p>

        <div style={content}>
          <section style={section}>
            <h2 style={sectionTitle}>1. Aceitação dos Termos</h2>
            <p style={text}>
              Ao acessar e usar o Trainer Flow, você concorda em cumprir e estar vinculado 
              a estes Termos de Serviço. Se você não concordar com qualquer parte destes 
              termos, não utilize nosso aplicativo.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>2. Descrição do Serviço</h2>
            <p style={text}>
              O Trainer Flow é uma plataforma para personal trainers gerenciarem seus 
              alunos, agendamentos, treinos e informações financeiras. Oferecemos 
              ferramentas para organização e acompanhamento profissional.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>3. Conta de Usuário</h2>
            <p style={text}>Para usar o Trainer Flow, você deve:</p>
            <ul style={list}>
              <li>Fornecer informações verdadeiras e completas no cadastro</li>
              <li>Manter a segurança da sua conta e senha</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>4. Uso Aceitável</h2>
            <p style={text}>Você concorda em não usar o aplicativo para:</p>
            <ul style={list}>
              <li>Violar leis ou regulamentos aplicáveis</li>
              <li>Infringir direitos de propriedade intelectual</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Coletar dados de outros usuários sem autorização</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>5. Propriedade Intelectual</h2>
            <p style={text}>
              Todo o conteúdo do Trainer Flow, incluindo textos, gráficos, logos e 
              software, é de propriedade exclusiva nossa ou de nossos licenciadores e 
              está protegido por leis de direitos autorais.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>6. Limitação de Responsabilidade</h2>
            <p style={text}>
              O Trainer Flow é fornecido &quot;como está&quot;. Não garantimos que o serviço 
              será ininterrupto ou livre de erros. Não nos responsabilizamos por danos 
              indiretos decorrentes do uso do aplicativo.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>7. Modificações</h2>
            <p style={text}>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão notificadas por e-mail ou através do 
              aplicativo. O uso continuado após alterações constitui aceitação.
            </p>
          </section>

          <section style={section}>
            <h2 style={sectionTitle}>8. Contato</h2>
            <p style={text}>
              Para dúvidas sobre estes termos, entre em contato conosco pelo e-mail: 
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
