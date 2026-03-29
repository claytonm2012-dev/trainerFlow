"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import db from "../../firebaseDb";
import auth from "../../firebaseAuth";
import {
  formatarPlanoAssinatura,
  gerarLinkWhatsAppAssinatura,
  getValorAssinatura,
  type PlanoAssinatura,
} from "@/utils/assinatura";

type PersonalData = {
  nome?: string;
  email?: string;
  plano?: PlanoAssinatura;
  valorPlano?: number;
  statusAcesso?: string;
  pagamentoStatus?: string;
  trialFim?: string;
};

export default function AssinaturaPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [processandoPlano, setProcessandoPlano] = useState("");
  const [personal, setPersonal] = useState<PersonalData | null>(null);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 900);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function carregar() {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.push("/login");
          return;
        }

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          router.push("/bloqueado");
          return;
        }

        setPersonal(snap.data() as PersonalData);
      } catch (error) {
        console.error("Erro ao carregar assinatura:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [router]);

  async function escolherPlano(plano: PlanoAssinatura) {
    try {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      setProcessandoPlano(plano);

      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        plano,
        valorPlano: getValorAssinatura(plano),
        pagamentoStatus: "pendente",
      });

      const link = gerarLinkWhatsAppAssinatura({
        nome: personal?.nome,
        email: personal?.email,
        plano,
      });

      window.open(link, "_blank");
    } catch (error) {
      console.error("Erro ao selecionar plano:", error);
      alert("Erro ao abrir o WhatsApp.");
    } finally {
      setProcessandoPlano("");
    }
  }

  return (
    <div style={pagina}>
      <section style={{
        ...hero,
        padding: isMobile ? "20px" : "28px",
      }}>
        <p style={mini}>Assinatura do TrainerFlow</p>
        <h1 style={{
          ...titulo,
          fontSize: isMobile ? "32px" : "48px",
        }}>Escolha seu plano</h1>
        <p style={{
          ...descricao,
          fontSize: isMobile ? "14px" : "16px",
        }}>
          Continue usando o TrainerFlow para organizar agenda, financeiro,
          horários de aula e gestão dos seus alunos.
        </p>
      </section>

      <section style={painel}>
        <div style={{
          ...blocoInfo,
          padding: isMobile ? "18px" : "24px",
        }}>
          <p style={rotulo}>Status atual</p>
          <h2 style={{
            ...valor,
            fontSize: isMobile ? "26px" : "34px",
          }}>{carregando ? "Carregando..." : personal?.statusAcesso || "--"}</h2>
          <p style={{
            ...texto,
            fontSize: isMobile ? "13px" : "14px",
          }}>
            Plano atual:{" "}
            {personal?.plano ? formatarPlanoAssinatura(personal.plano) : "Não definido"}
          </p>
          <p style={{
            ...texto,
            fontSize: isMobile ? "13px" : "14px",
          }}>
            Pagamento: {personal?.pagamentoStatus || "Não definido"}
          </p>
          <p style={{
            ...texto,
            fontSize: isMobile ? "13px" : "14px",
          }}>
            Trial até: {personal?.trialFim ? new Date(personal.trialFim).toLocaleString("pt-BR") : "--"}
          </p>
        </div>

        <div style={{
          ...cards,
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? "12px" : "16px",
        }}>
          <div style={{
            ...cardPlano,
            padding: isMobile ? "18px" : "24px",
          }}>
            <p style={planoNome}>Mensal</p>
            <h3 style={{
              ...planoValor,
              fontSize: isMobile ? "26px" : "32px",
            }}>R$ 19,99</h3>
            <p style={{
              ...planoTexto,
              fontSize: isMobile ? "13px" : "14px",
            }}>Ideal para começar.</p>
            <button
              onClick={() => escolherPlano("mensal")}
              disabled={processandoPlano === "mensal"}
              style={{
                ...botaoPlano,
                height: isMobile ? "46px" : "52px",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              {processandoPlano === "mensal" ? "Abrindo..." : "Falar no WhatsApp"}
            </button>
          </div>

          <div style={{
            ...cardPlano,
            padding: isMobile ? "18px" : "24px",
          }}>
            <p style={planoNome}>Trimestral</p>
            <h3 style={{
              ...planoValor,
              fontSize: isMobile ? "26px" : "32px",
            }}>R$ 45,00</h3>
            <p style={{
              ...planoTexto,
              fontSize: isMobile ? "13px" : "14px",
            }}>Melhor custo por período.</p>
            <button
              onClick={() => escolherPlano("trimestral")}
              disabled={processandoPlano === "trimestral"}
              style={{
                ...botaoPlano,
                height: isMobile ? "46px" : "52px",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              {processandoPlano === "trimestral" ? "Abrindo..." : "Falar no WhatsApp"}
            </button>
          </div>

          <div style={{
            ...cardPlano,
            padding: isMobile ? "18px" : "24px",
          }}>
            <p style={planoNome}>Anual</p>
            <h3 style={{
              ...planoValor,
              fontSize: isMobile ? "26px" : "32px",
            }}>R$ 120,00</h3>
            <p style={{
              ...planoTexto,
              fontSize: isMobile ? "13px" : "14px",
            }}>Mais econômico no longo prazo.</p>
            <button
              onClick={() => escolherPlano("anual")}
              disabled={processandoPlano === "anual"}
              style={{
                ...botaoPlano,
                height: isMobile ? "46px" : "52px",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              {processandoPlano === "anual" ? "Abrindo..." : "Falar no WhatsApp"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "24px",
};

const hero = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
};

const mini = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const titulo = {
  margin: "8px 0 12px 0",
  fontSize: "48px",
  color: "#fff",
  fontWeight: 900,
};

const descricao = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  fontSize: "16px",
  lineHeight: 1.8,
};

const painel = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const blocoInfo = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "24px",
};

const rotulo = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
};

const valor = {
  margin: "8px 0 12px 0",
  color: "#4ade80",
  fontSize: "34px",
  fontWeight: 900,
};

const texto = {
  margin: "6px 0",
  color: "rgba(255,255,255,0.78)",
  fontSize: "14px",
};

const cards = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

const cardPlano = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const planoNome = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "14px",
  fontWeight: 700,
};

const planoValor = {
  margin: 0,
  color: "#fff",
  fontSize: "32px",
  fontWeight: 900,
};

const planoTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const botaoPlano = {
  marginTop: "8px",
  height: "52px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
};
