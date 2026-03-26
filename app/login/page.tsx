"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [modo, setModo] = useState<"admin" | "aluno">("admin");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function entrar() {
    router.push("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background:
          "linear-gradient(rgba(5,8,20,0.76), rgba(5,8,20,0.88)), url('/login-bg.jpg') center/cover no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "20px 14px 28px" : "32px 24px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : "1180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? "18px" : "26px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "760px",
            background: "rgba(10, 12, 28, 0.78)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: isMobile ? "26px" : "30px",
            boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: isMobile ? "24px 18px 22px" : "34px 34px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: isMobile ? "24px" : "26px",
                height: isMobile ? "24px" : "26px",
                borderRadius: "999px",
                background: "#ff1f2d",
                boxShadow: "0 0 18px rgba(255,31,45,0.80)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: isMobile ? "28px" : "44px",
                  fontWeight: 900,
                  lineHeight: 1.05,
                }}
              >
                Consultoria Fitness
              </h1>
              <p
                style={{
                  margin: "6px 0 0 0",
                  color: "rgba(255,255,255,0.86)",
                  fontSize: isMobile ? "15px" : "22px",
                  lineHeight: 1.3,
                }}
              >
                Painel de Treinos
              </p>
              <p
                style={{
                  margin: "6px 0 0 0",
                  color: "rgba(255,255,255,0.74)",
                  fontSize: isMobile ? "14px" : "18px",
                  lineHeight: 1.4,
                }}
              >
                Katielle Amaral — Personal Trainer
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: isMobile ? "12px" : "18px",
              marginBottom: "26px",
            }}
          >
            <button
              type="button"
              onClick={() => setModo("admin")}
              style={{
                height: isMobile ? "58px" : "70px",
                borderRadius: "22px",
                border:
                  modo === "admin"
                    ? "1px solid rgba(255,80,80,0.60)"
                    : "1px solid rgba(255,255,255,0.05)",
                background:
                  modo === "admin"
                    ? "linear-gradient(135deg, #8e0f18 0%, #b3121d 55%, #8b0d15 100%)"
                    : "rgba(255,255,255,0.07)",
                color: "#ffffff",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  modo === "admin"
                    ? "0 14px 28px rgba(179,18,29,0.28)"
                    : "none",
              }}
            >
              ADM
            </button>

            <button
              type="button"
              onClick={() => setModo("aluno")}
              style={{
                height: isMobile ? "58px" : "70px",
                borderRadius: "22px",
                border:
                  modo === "aluno"
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(255,255,255,0.05)",
                background:
                  modo === "aluno"
                    ? "linear-gradient(135deg, rgba(60,60,70,0.95), rgba(40,40,52,0.95))"
                    : "rgba(255,255,255,0.07)",
                color: "#ffffff",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Aluno
            </button>
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "rgba(255,255,255,0.90)",
                  fontSize: isMobile ? "16px" : "20px",
                  fontWeight: 500,
                }}
              >
                Usuário
              </label>

              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder={modo === "admin" ? "admin" : "Digite seu usuário"}
                style={{
                  width: "100%",
                  height: isMobile ? "64px" : "72px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.55)",
                  color: "#ffffff",
                  padding: "0 22px",
                  fontSize: isMobile ? "18px" : "24px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "rgba(255,255,255,0.90)",
                  fontSize: isMobile ? "16px" : "20px",
                  fontWeight: 500,
                }}
              >
                Senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width: "100%",
                  height: isMobile ? "64px" : "72px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.55)",
                  color: "#ffffff",
                  padding: "0 22px",
                  fontSize: isMobile ? "18px" : "24px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="button"
              onClick={entrar}
              style={{
                height: isMobile ? "64px" : "74px",
                marginTop: "4px",
                borderRadius: "22px",
                border: "1px solid rgba(255,80,80,0.55)",
                background:
                  "linear-gradient(135deg, #8e0f18 0%, #b3121d 55%, #8b0d15 100%)",
                color: "#ffffff",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 16px 34px rgba(179,18,29,0.26)",
              }}
            >
              {modo === "admin" ? "Entrar como ADM" : "Entrar como Aluno"}
            </button>
          </div>

          <p
            style={{
              margin: "24px 0 0 0",
              textAlign: "center",
              color: "rgba(255,255,255,0.56)",
              fontSize: isMobile ? "14px" : "16px",
              lineHeight: 1.5,
            }}
          >
            {modo === "admin"
              ? "Acesso do aluno é criado pelo administrador."
              : "Use os dados liberados pelo administrador para entrar."}
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "760px",
            textAlign: "center",
            padding: isMobile ? "0 8px" : "0 18px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: isMobile ? "22px" : "28px",
              fontWeight: 800,
            }}
          >
            Sobre o aplicativo
          </h2>

          <p
            style={{
              margin: "12px 0 0 0",
              color: "rgba(255,255,255,0.78)",
              fontSize: isMobile ? "15px" : "17px",
              lineHeight: 1.8,
            }}
          >
            Organize treinos, acompanhe alunos, centralize o acesso e mantenha
            tudo em um só lugar com visual profissional e experiência fluida no
            celular.
          </p>
        </div>
      </div>
    </main>
  );
}