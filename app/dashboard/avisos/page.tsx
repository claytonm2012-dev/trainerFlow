"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import auth from "@/app/firebaseAuth";
import db from "@/app/firebaseDb";

type Aviso = {
  id: string;
  titulo?: string;
  mensagem?: string;
  tipo?: string;
  lido?: boolean;
  criadoEm?: string;
  userId?: string;
};

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarAvisos(uid: string) {
    try {
      setCarregando(true);

      const snapshot = await getDocs(
        query(
          collection(db, "avisos"),
          where("userId", "==", uid),
          orderBy("criadoEm", "desc")
        )
      );

      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aviso[];

      setAvisos(lista);
    } catch (error) {
      console.error("Erro ao carregar avisos:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function marcarComoLido(id: string) {
    try {
      await updateDoc(doc(db, "avisos", id), {
        lido: true,
      });

      setAvisos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, lido: true } : item))
      );
    } catch (error) {
      console.error("Erro ao marcar aviso como lido:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCarregando(false);
        return;
      }

      await carregarAvisos(user.uid);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={pagina}>
      <h1 style={titulo}>Avisos do sistema</h1>

      {carregando ? (
        <p style={texto}>Carregando avisos...</p>
      ) : avisos.length === 0 ? (
        <p style={texto}>Nenhum aviso encontrado.</p>
      ) : (
        <div style={lista}>
          {avisos.map((item) => (
            <div key={item.id} style={card}>
              <div style={cardTopo}>
                <div>
                  <h3 style={cardTitulo}>{item.titulo || "Aviso"}</h3>
                  <p style={cardMensagem}>{item.mensagem || ""}</p>
                </div>

                {!item.lido ? (
                  <button
                    onClick={() => marcarComoLido(item.id)}
                    style={botao}
                  >
                    Marcar como lido
                  </button>
                ) : (
                  <span style={badgeLido}>Lido</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const titulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
};

const texto = {
  color: "rgba(255,255,255,0.74)",
  fontSize: "15px",
};

const lista = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const card = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const cardTopo = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
};

const cardTitulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 800,
};

const cardMensagem = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const botao = {
  height: "40px",
  padding: "0 14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const badgeLido = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.22)",
  color: "#86efac",
  fontSize: "12px",
  fontWeight: 800,
};