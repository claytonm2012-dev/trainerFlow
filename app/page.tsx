"use client";

import { useEffect } from "react";
import { registrarPush } from "./lib/push";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    registrarPush();
  }, []);

  const primaryButtonStyle = {
    padding: "18px 28px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    cursor: "pointer",
    boxShadow:
      "0 18px 40px rgba(34,197,94,0.30), inset 0 1px 0 rgba(255,255,255,0.18)",
  } as const;

  const secondaryButtonStyle = {
    padding: "18px 28px",
    borderRadius: "18px",
    border: "1px solid rgba(74,222,128,0.28)",
    background:
      "linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.10) 100%)",
    color: "#dcfce7",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    cursor: "pointer",
    boxShadow:
      "0 12px 30px rgba(22,163,74,0.18), inset 0 1px 0 rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
  } as const;

  const topSecondaryButtonStyle = {
    padding: "13px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(74,222,128,0.28)",
    background:
      "linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.10) 100%)",
    color: "#dcfce7",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 10px 24px rgba(22,163,74,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
  } as const;

  const topPrimaryButtonStyle = {
    padding: "13px 20px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 14px 30px rgba(34,197,94,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
  } as const;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #2563eb 0%, #0f172a 35%, #020617 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#fff",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "34px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 800,
                boxShadow: "0 10px 25px rgba(34,197,94,0.30)",
              }}
            >
              T
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                TRAINERFLOW
              </h1>

              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "rgba(255,255,255,0.70)",
                  fontSize: "13px",
                }}
              >
                Gestão premium para personal trainers
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
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
            gridTemplateColumns: "1.2fr 0.9fr",
            gap: "28px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                width: "fit-content",
                padding: "10px 16px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.86)",
                fontSize: "14px",
                marginBottom: "22px",
              }}
            >
              Plataforma feita para organizar o dia a dia do personal
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "64px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-1.8px",
                maxWidth: "760px",
              }}
            >
              Transforme sua rotina profissional em um sistema de alta performance
            </h2>

            <p
              style={{
                marginTop: "22px",
                marginBottom: 0,
                fontSize: "18px",
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.76)",
                maxWidth: "720px",
              }}
            >
              Organize alunos, atendimentos, mensalidades, evolução e visão do
              seu negócio em uma plataforma moderna, estruturada e pronta para o
              crescimento do personal trainer.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: "30px",
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
                gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
                gap: "16px",
                marginTop: "34px",
                maxWidth: "760px",
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
                    padding: "18px",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {titulo}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.72)",
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
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "20px 20px auto auto",
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                background: "rgba(6,182,212,0.18)",
                filter: "blur(30px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "-20px",
                bottom: "40px",
                width: "180px",
                height: "180px",
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
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "30px",
                padding: "28px",
                boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.68)",
                    }}
                  >
                    Painel do personal
                  </p>
                  <h3
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: "24px",
                      fontWeight: 800,
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
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Sistema ativo
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
                  gap: "14px",
                  marginBottom: "18px",
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
                      padding: "18px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.68)",
                        fontSize: "13px",
                      }}
                    >
                      {titulo}
                    </p>
                    <h4
                      style={{
                        margin: "10px 0 0 0",
                        fontSize: "24px",
                        fontWeight: 800,
                      }}
                    >
                      {valor}
                    </h4>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: "22px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "20px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 14px 0",
                    fontSize: "16px",
                    fontWeight: 700,
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
                        alignItems: "center",
                        gap: "10px",
                        color: "rgba(255,255,255,0.78)",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "999px",
                          background: "#22c55e",
                          flexShrink: 0,
                        }}
                      />
                      {item}
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
                    padding: "17px",
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
                    padding: "15px",
                    fontSize: "14px",
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