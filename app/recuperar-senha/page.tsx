"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import auth from "../firebaseAuth";
import { useRouter } from "next/navigation";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const recuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email);
      alert("E-mail de recuperação enviado!");
      router.push("/login");
    } catch (error: any) {
      console.error(error);
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
        <section style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
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
            Recuperação segura de acesso
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
            Recupere sua senha e volte ao seu painel com segurança
          </h1>

          <p
            style={{
              marginTop: "22px",
              fontSize: "18px",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.76)",
              maxWidth: "670px",
            }}
          >
            Informe seu e-mail para receber o link de redefinição de senha e
            recuperar o acesso à sua plataforma rapidamente.
          </p>
        </section>

        <section style={{ position: "relative", display: "flex", justifyContent: "center" }}>
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

              <h2 style={{ margin: 0, fontSize: "40px", fontWeight: 800, letterSpacing: "1px" }}>
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
                Recuperação de senha do personal
              </p>
            </div>

            <form
              onSubmit={recuperarSenha}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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

              <button
                type="submit"
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "16px",
                  borderRadius: "18px",
                  border: "none",
                  background: "linear-gradient(90deg, #22c55e, #16a34a)",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 14px 30px rgba(34,197,94,0.30)",
                }}
              >
                Enviar e-mail de recuperação
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Voltar para login
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}