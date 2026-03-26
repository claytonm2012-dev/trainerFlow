"use client";

import { useEffect, useState } from "react";
import { registrarPush } from "./lib/push";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    registrarPush();
  }, []);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024);
      setIsCompact(width <= 480);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const primaryButtonStyle = {
    padding: isCompact ? "15px 18px" : isMobile ? "16px 20px" : "18px 28px",
    borderRadius: isMobile ? "16px" : "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
    color: "#ffffff",
    fontSize: isCompact ? "14px" : "16px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    cursor: "pointer",
    boxShadow:
      "0 18px 40px rgba(34,197,94,0.30), inset 0 1px 0 rgba(255,255,255,0.18)",
    width: isMobile ? "100%" : "auto",
  } as const;

  const secondaryButtonStyle = {
    padding: isCompact ? "15px 18px" : isMobile ? "16px 20px" : "18px 28px",
    borderRadius: isMobile ? "16px" : "18px",
    border: "1px solid rgba(74,222,128,0.28)",
    background:
      "linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.10) 100%)",
    color: "#dcfce7",
    fontSize: isCompact ? "14px" : "16px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    cursor: "pointer",
    boxShadow:
      "0 12px 30px rgba(22,163,74,0.18), inset 0 1px 0 rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
    width: isMobile ? "100%" : "auto",
  } as const;

  const topSecondaryButtonStyle = {
    padding: isCompact ? "11px 14px" : isMobile ? "12px 16px" : "13px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(74,222,128,0.28)",
    background:
      "linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.10) 100%)",
    color: "#dcfce7",
    fontSize: isCompact ? "13px" : "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(22,163,74,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
    width: isMobile ? "100%" : "auto",
  } as const;

  const topPrimaryButtonStyle = {
    padding: isCompact ? "11px 14px" : isMobile ? "12px 16px" : "13px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
    color: "#fff",
    fontSize: isCompact ? "13px" : "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 14px 30px rgba(34,197,94,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
    width: isMobile ? "100%" : "auto",
  } as const;

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at top, #2563eb 0%, #0f172a 35%, #020617 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#fff",
        padding: isCompact ? "14px 10px" : isMobile ? "16px 12px" : "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1240px",
          width: "100%",
          margin: "0 auto",
          minHeight: isMobile ? "auto" : "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            marginBottom: isMobile ? "22px" : "34px",
            flexWrap: "wrap",
            gap: isMobile ? "16px" : "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isCompact ? "10px" : "14px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: isCompact ? "44px" : isMobile ? "48px" : "54px",
                height: isCompact ? "44px" : isMobile ? "48px" : "54px",
                minWidth: isCompact ? "44px" : isMobile ? "48px" : "54px",
                borderRadius: isCompact ? "14px" : "16px",
                background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isCompact ? "20px" : isMobile ? "22px" : "24px",
                fontWeight: 800,
                boxShadow: "0 10px 25px rgba(34,197,94,0.30)",
              }}
            >
              T
            </div>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: isCompact ? "19px" : isMobile ? "21px" : "24px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  wordBreak: "break-word",
                }}
              >
                TRAINERFLOW
              </h1>

              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "rgba(255,255,255,0.70)",
                  fontSize: isCompact ? "11px" : "13px",
                  wordBreak: "break-word",
                }}
              >
                Gestão premium para personal trainers
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={topSecondaryButtonStyle}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              style={topPrimaryButtonStyle}
            >
              Criar conta
            </button>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.2fr 0.9fr",
            gap: isCompact ? "16px" : isMobile ? "18px" : isTablet ? "22px" : "28px",
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                width: "fit-content",
                maxWidth: "100%",
                padding: isCompact ? "9px 12px" : "10px 16px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.86)",
                fontSize: isCompact ? "12px" : "14px",
                marginBottom: isMobile ? "16px" : "22px",
                wordBreak: "break-word",
              }}
            >
              Plataforma feita para organizar o dia a dia do personal
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: isCompact
                  ? "30px"
                  : isMobile
                  ? "36px"
                  : isTablet
                  ? "48px"
                  : "64px",
                lineHeight: isMobile ? 1.08 : 1.02,
                fontWeight: 800,
                letterSpacing: isMobile ? "-0.8px" : "-1.8px",
                maxWidth: "760px",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              Transforme sua rotina profissional em um sistema de alta performance
            </h2>

            <p
              style={{
                marginTop: isMobile ? "16px" : "22px",
                marginBottom: 0,
                fontSize: isCompact ? "15px" : isMobile ? "16px" : "18px",
                lineHeight: isMobile ? 1.7 : 1.8,
                color: "rgba(255,255,255,0.76)",
                maxWidth: "720px",
                wordBreak: "break-word",
              }}
            >
              Organize alunos, atendimentos, mensalidades, evolução e visão do
              seu negócio em uma plataforma moderna, estruturada e pronta para o
              crescimento do personal trainer.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: isMobile ? "22px" : "30px",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={primaryButtonStyle}
              >
                Entrar na plataforma
              </button>

              <button
                type="button"
                onClick={() => router.push("/cadastro")}
                style={secondaryButtonStyle}
              >
                Começar agora
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(3, minmax(140px, 1fr))",
                gap: "16px",
                marginTop: isMobile ? "22px" : "34px",
                maxWidth: "760px",
                width: "100%",
              }}
            >
              {[
                ["+ organização", "Centralize alunos, pagamentos e rotina."],
                ["+ visão financeira", "Acompanhe pendências e faturamento."],
                ["+ produtividade", "Ganhe tempo com um sistema estruturado."],
              ].map(([titulo, texto]) => (
                <div
                  key={titulo}
                  style={{
                    padding: isCompact ? "14px" : isMobile ? "16px" : "18px",
                    borderRadius: isMobile ? "18px" : "20px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    minWidth: 0,
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: isCompact ? "14px" : "15px",
                      fontWeight: 700,
                      wordBreak: "break-word",
                    }}
                  >
                    {titulo}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: isCompact ? "12px" : "13px",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.72)",
                      wordBreak: "break-word",
                    }}
                  >
                    {texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: isMobile ? "10px 10px auto auto" : "20px 20px auto auto",
                width: isMobile ? "130px" : "180px",
                height: isMobile ? "130px" : "180px",
                borderRadius: "999px",
                background: "rgba(6,182,212,0.18)",
                filter: "blur(30px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "absolute",
                left: isMobile ? "-6px" : "-20px",
                bottom: isMobile ? "24px" : "40px",
                width: isMobile ? "130px" : "180px",
                height: isMobile ? "130px" : "180px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.16)",
                filter: "blur(36px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                minWidth: 0,
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: isMobile ? "22px" : "30px",
                padding: isCompact ? "14px" : isMobile ? "16px" : "28px",
                boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isCompact ? "column" : "row",
                  gap: isCompact ? "10px" : "14px",
                  marginBottom: isMobile ? "16px" : "22px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: isCompact ? "12px" : "13px",
                      color: "rgba(255,255,255,0.68)",
                    }}
                  >
                    Painel do personal
                  </p>
                  <h3
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: isCompact ? "20px" : isMobile ? "22px" : "24px",
                      fontWeight: 800,
                      wordBreak: "break-word",
                    }}
                  >
                    Visão geral
                  </h3>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "12px",
                    background: "rgba(34,197,94,0.16)",
                    color: "#86efac",
                    fontSize: isCompact ? "12px" : "13px",
                    fontWeight: 700,
                    alignSelf: isCompact ? "flex-start" : "auto",
                  }}
                >
                  Sistema ativo
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isCompact
                    ? "1fr"
                    : "repeat(2, minmax(120px, 1fr))",
                  gap: "14px",
                  marginBottom: "18px",
                  width: "100%",
                }}
              >
                {[
                  ["Alunos ativos", "28"],
                  ["Receita do mês", "R$ 5.800"],
                  ["Pendências", "3"],
                  ["Agenda do dia", "7 aulas"],
                ].map(([titulo, valor]) => (
                  <div
                    key={titulo}
                    style={{
                      padding: isCompact ? "14px" : "18px",
                      borderRadius: isMobile ? "16px" : "18px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.68)",
                        fontSize: isCompact ? "12px" : "13px",
                        wordBreak: "break-word",
                      }}
                    >
                      {titulo}
                    </p>
                    <h4
                      style={{
                        margin: "10px 0 0 0",
                        fontSize: isCompact ? "20px" : isMobile ? "22px" : "24px",
                        fontWeight: 800,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {valor}
                    </h4>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: isMobile ? "18px" : "22px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: isCompact ? "14px" : isMobile ? "16px" : "20px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 14px 0",
                    fontSize: isCompact ? "15px" : "16px",
                    fontWeight: 700,
                    wordBreak: "break-word",
                  }}
                >
                  O que você controla com a TrainerFlow
                </h4>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {[
                    "Cadastro e ficha completa dos alunos",
                    "Controle da agenda e organização dos atendimentos",
                    "Acompanhamento financeiro e mensalidades",
                    "Histórico profissional e visão de crescimento",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        color: "rgba(255,255,255,0.78)",
                        fontSize: isCompact ? "13px" : "14px",
                        lineHeight: 1.6,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          minWidth: "10px",
                          borderRadius: "999px",
                          background: "#22c55e",
                          flexShrink: 0,
                          marginTop: "5px",
                        }}
                      />
                      <span style={{ wordBreak: "break-word" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={{
                    ...primaryButtonStyle,
                    width: "100%",
                    marginTop: "20px",
                    padding: isCompact ? "14px" : isMobile ? "15px" : "17px",
                  }}
                >
                  Acessar painel agora
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/recuperar-senha")}
                  style={{
                    ...secondaryButtonStyle,
                    width: "100%",
                    marginTop: "12px",
                    padding: isCompact ? "13px" : "15px",
                    fontSize: isCompact ? "13px" : "14px",
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}