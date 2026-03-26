"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../firebaseAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);

      await signInWithEmailAndPassword(auth, email, senha);

      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro no login:", error);

      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/user-not-found"
      ) {
        alert("E-mail ou senha incorretos.");
      } else if (error?.code === "auth/invalid-email") {
        alert("E-mail inválido.");
      } else {
        alert("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.35) 0%, rgba(9,17,47,1) 38%, rgba(11,11,13,1) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 14px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          borderRadius: "34px",
          padding: "26px 20px 20px",
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #22c55e, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "38px",
              fontWeight: 900,
              boxShadow: "0 0 24px rgba(34,197,94,0.35)",
              marginBottom: "16px",
            }}
          >
            T
          </div>

          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "0.5px",
              textAlign: "center",
            }}
          >
            TRAINERFLOW
          </h1>

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
                height: "58px",
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
                gridTemplateColumns: "1fr 92px",
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
                  height: "58px",
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
                  height: "58px",
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
              marginTop: "4px",
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
              marginTop: "6px",
              height: "60px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
              color: "#ffffff",
              fontSize: "18px",
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
              height: "56px",
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
              marginTop: "6px",
              padding: "14px 16px",
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
      </div>
    </main>
  );
}