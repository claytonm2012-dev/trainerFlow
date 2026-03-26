"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import auth from "../firebaseAuth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }

      setVerificandoSessao(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      alert("Preencha e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      await signInWithEmailAndPassword(auth, email.trim(), senha);

      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro ao entrar:", error);

      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/user-not-found"
      ) {
        alert("E-mail ou senha incorretos.");
      } else if (error?.code === "auth/invalid-email") {
        alert("E-mail inválido.");
      } else {
        alert("Não foi possível entrar agora.");
      }
    } finally {
      setCarregando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(37,99,235,0.38) 0%, rgba(10,15,35,1) 38%, rgba(4,6,18,1) 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "18px",
          fontWeight: 800,
        }}
      >
        Carregando acesso...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.40) 0%, rgba(11,17,47,1) 30%, rgba(4,7,20,1) 65%, rgba(2,4,12,1) 100%)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 14px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "8%",
          width: "220px",
          height: "220px",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.12)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "12%",
          right: "8%",
          width: "240px",
          height: "240px",
          borderRadius: "999px",
          background: "rgba(59,130,246,0.16)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: "28px",
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            position: "relative",
            borderRadius: "34px",
            overflow: "hidden",
            minHeight: "700px",
            background:
              "linear-gradient(135deg, rgba(10,20,55,0.92), rgba(8,14,34,0.88))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "34px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.06), transparent 32%, transparent 68%, rgba(255,255,255,0.03))",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.86)",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Experiência premium para personal trainers
            </div>

            <h1
              style={{
                margin: "22px 0 0 0",
                color: "#ffffff",
                fontSize: "64px",
                lineHeight: 0.98,
                fontWeight: 900,
                letterSpacing: "-2px",
                maxWidth: "620px",
              }}
            >
              Entre e gerencie seu negócio com ritmo de plataforma premium
            </h1>

            <p
              style={{
                margin: "22px 0 0 0",
                color: "rgba(255,255,255,0.78)",
                fontSize: "18px",
                lineHeight: 1.8,
                maxWidth: "620px",
              }}
            >
              Controle alunos, agenda, evolução e financeiro com uma interface
              forte, elegante e feita para uso profissional.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {[
              ["Alunos", "Cadastre, acompanhe e organize sua base."],
              ["Agenda", "Visualize atendimentos e mantenha rotina firme."],
              ["Financeiro", "Controle cobranças, vencimentos e mensalidades."],
            ].map(([titulo, texto]) => (
              <div
                key={titulo}
                style={{
                  padding: "18px",
                  borderRadius: "22px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: "18px",
                    fontWeight: 800,
                  }}
                >
                  {titulo}
                </h3>
                <p
                  style={{
                    margin: "10px 0 0 0",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "14px",
                    lineHeight: 1.7,
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
            borderRadius: "34px",
            padding: "28px 24px 24px",
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "700px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "86px",
                height: "86px",
                borderRadius: "26px",
                background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "42px",
                fontWeight: 900,
                boxShadow: "0 0 26px rgba(34,197,94,0.36)",
                marginBottom: "16px",
              }}
            >
              T
            </div>

            <h2
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "40px",
                fontWeight: 900,
                letterSpacing: "0.6px",
                textAlign: "center",
              }}
            >
              TRAINERFLOW
            </h2>

            <p
              style={{
                margin: "10px 0 0 0",
                color: "rgba(255,255,255,0.82)",
                fontSize: "16px",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Plataforma premium para personal trainers
            </p>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                style={{
                  width: "100%",
                  height: "60px",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "0 18px",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                Senha
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 96px",
                  gap: "10px",
                }}
              >
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  style={{
                    width: "100%",
                    height: "60px",
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "#ffffff",
                    color: "#111827",
                    padding: "0 18px",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  style={{
                    height: "60px",
                    borderRadius: "18px",
                    border: "1px solid rgba(96,165,250,0.28)",
                    background: "linear-gradient(135deg, #60a5fa, #2563eb)",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 12px 24px rgba(37,99,235,0.20)",
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
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "15px",
                }}
              >
                Acesso seguro
              </span>

              <button
                type="button"
                onClick={() => router.push("/recuperar-senha")}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #d946ef, #a855f7)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 10px 20px rgba(168,85,247,0.24)",
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="button"
              onClick={entrar}
              disabled={carregando}
              style={{
                marginTop: "8px",
                height: "62px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.10)",
                background:
                  "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 16px 32px rgba(34,197,94,0.28)",
                opacity: carregando ? 0.7 : 1,
              }}
            >
              {carregando ? "Entrando..." : "Entrar na plataforma"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              style={{
                height: "58px",
                borderRadius: "18px",
                border: "1px solid rgba(34,211,238,0.18)",
                background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                color: "#ffffff",
                fontSize: "17px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 14px 28px rgba(6,182,212,0.22)",
              }}
            >
              Criar conta
            </button>

            <div
              style={{
                marginTop: "8px",
                padding: "15px 16px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                Organize alunos, agenda, evolução e financeiro em um só lugar.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          main > div {
            grid-template-columns: 1fr !important;
            max-width: 520px !important;
          }
        }

        @media (max-width: 980px) {
          section:first-child {
            min-height: auto !important;
            padding: 24px !important;
          }
        }

        @media (max-width: 980px) {
          section:first-child h1 {
            font-size: 42px !important;
            line-height: 1.02 !important;
          }
        }

        @media (max-width: 980px) {
          section:first-child > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 980px) {
          section:last-child {
            min-height: auto !important;
          }
        }

        @media (max-width: 640px) {
          section:first-child {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          main {
            padding: 16px 12px !important;
          }
        }

        @media (max-width: 640px) {
          section:last-child {
            padding: 24px 16px 18px !important;
            border-radius: 28px !important;
          }
        }

        @media (max-width: 640px) {
          section:last-child h2 {
            font-size: 34px !important;
          }
        }

        @media (max-width: 640px) {
          section:last-child input,
          section:last-child button {
            height: 56px !important;
          }
        }

        @media (max-width: 420px) {
          section:last-child h2 {
            font-size: 30px !important;
          }
        }

        @media (max-width: 420px) {
          section:last-child > div:last-child > div:nth-child(2) > div {
            grid-template-columns: 1fr 84px !important;
          }
        }
      `}</style>
    </main>
  );
}