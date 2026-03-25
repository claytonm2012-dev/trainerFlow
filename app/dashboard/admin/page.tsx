"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import auth from "@/app/firebaseAuth";
import db from "@/app/firebaseDb";

type Usuario = {
  id: string;
  nome?: string;
  email?: string;
  tipo?: string;
  plano?: string;
  valorPlano?: number;
  statusAcesso?: string;
  pagamentoStatus?: string;
  trialFim?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        router.push("/dashboard");
        return;
      }

      const data = snap.data();

      if (!data || data.tipo !== "admin") {
        console.log("NÃO É ADMIN:", data);
        router.push("/dashboard");
        return;
      }

      console.log("ADMIN OK:", data);

      const listaSnap = await getDocs(collection(db, "users"));

      const lista: Usuario[] = listaSnap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Usuario[];

      setUsuarios(lista);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function atualizarUsuario(id: string, dados: Partial<Usuario>) {
    try {
      await updateDoc(doc(db, "users", id), dados);

      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...dados } : u))
      );
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar usuário");
    }
  }

  function gerarLinkWhatsApp(user: Usuario) {
    const numero = "5535984735176";

    const mensagem = `Olá, seu acesso ao TrainerFlow está pendente.\n\nPlano: ${
      user.plano || "mensal"
    }\n\nClique aqui para regularizar seu acesso.`;

    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  const totalUsuarios = useMemo(() => {
    return usuarios.length;
  }, [usuarios]);

  const totalPersonais = useMemo(() => {
    return usuarios.filter((u) => u.tipo === "personal").length;
  }, [usuarios]);

  const totalAtivos = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.statusAcesso === "ativo" || u.statusAcesso === "liberado"
    ).length;
  }, [usuarios]);

  const totalTrial = useMemo(() => {
    return usuarios.filter((u) => u.statusAcesso === "trial").length;
  }, [usuarios]);

  const totalPendentes = useMemo(() => {
    return usuarios.filter((u) => u.pagamentoStatus === "pendente").length;
  }, [usuarios]);

  const totalBloqueados = useMemo(() => {
    return usuarios.filter((u) => u.statusAcesso === "bloqueado").length;
  }, [usuarios]);

  if (carregando) {
    return <p style={{ padding: 20 }}>Carregando...</p>;
  }

  return (
    <div style={pagina}>
      <h1 style={titulo}>PAINEL ADMIN AVANÇADO</h1>

      <div style={metricasGrid}>
        <div style={metricaCard}>
          <p style={metricaRotulo}>Total de usuários</p>
          <h2 style={metricaValor}>{totalUsuarios}</h2>
        </div>

        <div style={metricaCard}>
          <p style={metricaRotulo}>Personais no app</p>
          <h2 style={metricaValor}>{totalPersonais}</h2>
        </div>

        <div style={metricaCard}>
          <p style={metricaRotulo}>Ativos</p>
          <h2 style={metricaValor}>{totalAtivos}</h2>
        </div>

        <div style={metricaCard}>
          <p style={metricaRotulo}>Em trial</p>
          <h2 style={metricaValor}>{totalTrial}</h2>
        </div>

        <div style={metricaCard}>
          <p style={metricaRotulo}>Pendentes</p>
          <h2 style={metricaValor}>{totalPendentes}</h2>
        </div>

        <div style={metricaCard}>
          <p style={metricaRotulo}>Bloqueados</p>
          <h2 style={metricaValor}>{totalBloqueados}</h2>
        </div>
      </div>

      <div style={grid}>
        {usuarios.map((user) => (
          <div key={user.id} style={card}>
            <h3 style={nome}>{user.nome || "Sem nome"}</h3>

            <p style={textoInfo}>Email: {user.email}</p>
            <p style={textoInfo}>Tipo: {user.tipo}</p>
            <p style={textoInfo}>Plano: {user.plano}</p>
            <p style={textoInfo}>Status: {user.statusAcesso}</p>
            <p style={textoInfo}>Pagamento: {user.pagamentoStatus}</p>

            <div style={acoes}>
              <button
                style={btnVerde}
                onClick={() =>
                  atualizarUsuario(user.id, {
                    statusAcesso: "liberado",
                    pagamentoStatus: "pago",
                  })
                }
              >
                Liberar acesso
              </button>

              <button
                style={btnVermelho}
                onClick={() =>
                  atualizarUsuario(user.id, {
                    statusAcesso: "bloqueado",
                  })
                }
              >
                Bloquear
              </button>

              <button
                style={btnAmarelo}
                onClick={() => {
                  const novaData = new Date();
                  novaData.setDate(novaData.getDate() + 3);

                  atualizarUsuario(user.id, {
                    statusAcesso: "trial",
                    trialFim: novaData.toISOString(),
                  });
                }}
              >
                Resetar trial (3 dias)
              </button>

              <button
                style={btnAzul}
                onClick={() =>
                  atualizarUsuario(user.id, {
                    plano: "anual",
                    valorPlano: 297,
                  })
                }
              >
                Plano anual
              </button>

              <a
                href={gerarLinkWhatsApp(user)}
                target="_blank"
                rel="noreferrer"
                style={btnWhats}
              >
                Cobrar no WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= ESTILO ================= */

const pagina = {
  padding: "30px",
  color: "#fff",
};

const titulo = {
  fontSize: "32px",
  fontWeight: 900,
  marginBottom: "20px",
};

const metricasGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const metricaCard = {
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
};

const metricaRotulo = {
  margin: 0,
  fontSize: "14px",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 700,
};

const metricaValor = {
  margin: "10px 0 0 0",
  fontSize: "34px",
  fontWeight: 900,
  color: "#ffffff",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
};

const card = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const nome = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
};

const textoInfo = {
  margin: "6px 0",
};

const acoes = {
  marginTop: "10px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const baseBtn = {
  padding: "8px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const btnVerde = {
  ...baseBtn,
  background: "#22c55e",
};

const btnVermelho = {
  ...baseBtn,
  background: "#ef4444",
};

const btnAmarelo = {
  ...baseBtn,
  background: "#facc15",
};

const btnAzul = {
  ...baseBtn,
  background: "#3b82f6",
};

const btnWhats = {
  ...baseBtn,
  background: "#25d366",
  textAlign: "center" as const,
  textDecoration: "none",
  color: "#000",
};