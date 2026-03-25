"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../firebaseAuth";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const router = useRouter();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      alert(error.message);
    }
  };

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
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <section
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
              gap: "10px",
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
            Acesso profissional para personal trainers
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "60px",
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-1.8px",
              maxWidth: "700px",
            }}
          >
            Entre na sua plataforma e gerencie seu negócio com mais controle
          </h1>

          <p
            style={{
              marginTop: "22px",
              marginBottom: 0,
              fontSize: "18px",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.76)",
              maxWidth: "670px",
            }}
          >
            Acesse seu painel, acompanhe alunos, organize atendimentos,
            visualize seu financeiro e mantenha toda sua rotina profissional em
            um só lugar.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
              gap: "16px",
              marginTop: "34px",
              maxWidth: "760px",
            }}
          >
            {[
              ["Alunos", "Cadastre e acompanhe seus alunos com praticidade."],
              ["Agenda", "Tenha sua rotina organizada e mais profissional."],
              ["Financeiro", "Controle mensalidades e pendências com clareza."],
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
        </section>

        <section
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background: "rgba(6,182,212,0.18)",
              filter: "blur(34px)",
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "-20px",
              bottom: "30px",
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
              maxWidth: "470px",
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "30px",
              padding: "34px 30px",
              boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              <div
                style={{
                  width: "84px",
                  height: "84px",
                  margin: "0 auto 18px",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                  fontWeight: 800,
                  boxShadow: "0 14px 30px rgba(34,197,94,0.35)",
                }}
              >
                T
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "40px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                }}
              >
                TRAINERFLOW
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                Plataforma premium para personal trainers
              </p>
            </div>

            <form
              onSubmit={fazerLogin}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.90)",
                  }}
                >
                  E-mail
                </label>

                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    outline: "none",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.90)",
                  }}
                >
                  Senha
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "16px 18px",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      outline: "none",
                      fontSize: "15px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "16px",
                      border: "1px solid rgba(147,197,253,0.35)",
                      background:
                        "linear-gradient(135deg, #60a5fa 0%, #3b82f6 45%, #2563eb 100%)",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "14px",
                      minWidth: "90px",
                      boxShadow:
                        "0 12px 26px rgba(59,130,246,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    {mostrarSenha ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "-4px",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.60)",
                  }}
                >
                  Acesso seguro
                </span>

                <button
                  type="button"
                  onClick={() => router.push("/recuperar-senha")}
                  style={{
                    border: "1px solid rgba(192,132,252,0.30)",
                    background:
                      "linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #7c3aed 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 800,
                    padding: "11px 16px",
                    borderRadius: "14px",
                    boxShadow:
                      "0 12px 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "18px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background:
                    "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                  boxShadow:
                    "0 18px 40px rgba(34,197,94,0.30), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                Entrar na plataforma
              </button>

              <button
                type="button"
                onClick={() => router.push("/cadastro")}
                style={{
                  width: "100%",
                  padding: "17px",
                  borderRadius: "20px",
                  border: "1px solid rgba(6,182,212,0.28)",
                  background:
                    "linear-gradient(135deg, #22d3ee 0%, #06b6d4 45%, #0891b2 100%)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  cursor: "pointer",
                  boxShadow:
                    "0 16px 34px rgba(6,182,212,0.24), inset 0 1px 0 rgba(255,255,255,0.16)",
                }}
              >
                Criar conta
              </button>
            </form>

            <div
              style={{
                marginTop: "22px",
                padding: "16px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.75)",
                  textAlign: "center",
                }}
              >
                Organize alunos, agenda, evolução e financeiro em um só lugar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}