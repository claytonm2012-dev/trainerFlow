"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import db from "../../firebaseDb";
import auth from "../../firebaseAuth";

type AlunoOption = {
  id: string;
  nome?: string;
  telefone?: string;
  userId?: string;
};

export default function AlunosPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoPlano, setTipoPlano] = useState("mensal");
  const [tipoPagamento, setTipoPagamento] = useState("mensal");
  const [formaCobranca, setFormaCobranca] = useState("antecipado");
  const [valor, setValor] = useState("");
  const [reposicoes, setReposicoes] = useState("0");
  const [status, setStatus] = useState("ativo");
  const [pagamentoStatus, setPagamentoStatus] = useState("pendente");
  const [salvando, setSalvando] = useState(false);
  const [totalAlunos, setTotalAlunos] = useState(0);

  async function carregarResumo() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setTotalAlunos(0);
        return;
      }

      const snapshot = await getDocs(
        query(collection(db, "students"), where("userId", "==", user.uid))
      );

      setTotalAlunos(snapshot.size);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  async function cadastrarAluno() {
    if (!nome.trim()) {
      alert("Digite o nome do aluno");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite o telefone");
      return;
    }

    if (!valor.trim()) {
      alert("Digite o valor");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        return;
      }

      setSalvando(true);

      await addDoc(collection(db, "students"), {
        nome,
        telefone,
        tipoPlano,
        tipoPagamento,
        formaCobranca,
        valor,
        reposicoes: Number(reposicoes),
        status,
        pagamentoStatus,
        userId: user.uid,
        criadoEm: serverTimestamp(),
      });

      alert("Aluno cadastrado com sucesso");

      setNome("");
      setTelefone("");
      setTipoPlano("mensal");
      setTipoPagamento("mensal");
      setFormaCobranca("antecipado");
      setValor("");
      setReposicoes("0");
      setStatus("ativo");
      setPagamentoStatus("pendente");

      carregarResumo();
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      alert("Erro ao cadastrar aluno");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={pagina}>
      <section style={hero}>
        <div style={heroPrincipal}>
          <p style={eyebrow}>Cadastro e gestão de alunos</p>
          <h1 style={titulo}>Alunos</h1>
          <p style={descricao}>
            Cadastre novos alunos com estrutura profissional, definindo plano,
            cobrança, situação financeira e status de acompanhamento.
          </p>
        </div>

        <div style={heroResumo}>
          <p style={heroResumoRotulo}>Base cadastrada</p>
          <h2 style={heroResumoValor}>{totalAlunos}</h2>
          <p style={heroResumoTexto}>
            Total de alunos registrados na plataforma neste momento.
          </p>
        </div>
      </section>

      <section style={painel}>
        <div style={painelGlow}></div>

        <div style={painelHeader}>
          <div>
            <p style={painelMini}>Cadastro premium</p>
            <h2 style={painelTitulo}>Cadastrar aluno</h2>
          </div>

          <div style={pillBox}>
            <span style={pill}>Gestão organizada</span>
          </div>
        </div>

        <div style={grid}>
          <div style={campo}>
            <label style={label}>Nome do aluno</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome completo"
              style={input}
            />
          </div>

          <div style={campo}>
            <label style={label}>Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Digite o telefone"
              style={input}
            />
          </div>

          <div style={campo}>
            <label style={label}>Plano de aulas</label>
            <select
              value={tipoPlano}
              onChange={(e) => setTipoPlano(e.target.value)}
              style={select}
            >
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Tipo de pagamento</label>
            <select
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value)}
              style={select}
            >
              <option value="mensal">Mensal</option>
              <option value="por-aula">Por aula</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Forma de cobrança</label>
            <select
              value={formaCobranca}
              onChange={(e) => setFormaCobranca(e.target.value)}
              style={select}
            >
              <option value="antecipado">Antecipado</option>
              <option value="posterior">Posterior</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Valor</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 250"
              style={input}
            />
          </div>

          <div style={campo}>
            <label style={label}>Reposições realizadas</label>
            <input
              type="number"
              min="0"
              value={reposicoes}
              onChange={(e) => setReposicoes(e.target.value)}
              style={input}
            />
          </div>

          <div style={campo}>
            <label style={label}>Status do aluno</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={select}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Status do pagamento</label>
            <select
              value={pagamentoStatus}
              onChange={(e) => setPagamentoStatus(e.target.value)}
              style={select}
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Resumo profissional</label>
            <div style={resumoBox}>
              <span style={resumoTexto}>
                Plano: {formatarPlano(tipoPlano)} • Pagamento:{" "}
                {formatarPagamento(tipoPagamento)} • Cobrança:{" "}
                {formatarCobranca(formaCobranca)}
              </span>
            </div>
          </div>
        </div>

        <div style={acoes}>
          <button
            onClick={cadastrarAluno}
            disabled={salvando}
            style={botaoPrincipal}
          >
            {salvando ? "Salvando aluno..." : "Cadastrar aluno"}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatarPlano(valor: string) {
  if (valor === "diaria") return "Diária";
  if (valor === "semanal") return "Semanal";
  return "Mensal";
}

function formatarPagamento(valor: string) {
  if (valor === "por-aula") return "Por aula";
  return "Mensal";
}

function formatarCobranca(valor: string) {
  if (valor === "posterior") return "Posterior";
  return "Antecipado";
}

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "24px",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: "20px",
};

const heroPrincipal = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
};

const heroResumo = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
};

const eyebrow = {
  margin: 0,
  color: "rgba(255,255,255,0.6)",
  fontSize: "14px",
};

const titulo = {
  margin: "10px 0 14px 0",
  fontSize: "52px",
  lineHeight: 1,
  fontWeight: 900,
  color: "#ffffff",
};

const descricao = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "17px",
  lineHeight: 1.8,
};

const heroResumoRotulo = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
};

const heroResumoValor = {
  margin: "12px 0",
  fontSize: "46px",
  fontWeight: 900,
  color: "#4ade80",
};

const heroResumoTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "15px",
  lineHeight: 1.7,
};

const painel = {
  position: "relative" as const,
  overflow: "hidden" as const,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const painelGlow = {
  position: "absolute" as const,
  top: "-40px",
  right: "-30px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.10)",
  filter: "blur(36px)",
};

const painelHeader = {
  position: "relative" as const,
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
};

const painelMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const painelTitulo = {
  margin: "8px 0 0 0",
  fontSize: "38px",
  fontWeight: 900,
  color: "#ffffff",
};

const pillBox = {
  display: "flex",
  alignItems: "center",
};

const pill = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.20)",
  color: "#86efac",
  fontSize: "13px",
  fontWeight: 800,
};

const grid = {
  position: "relative" as const,
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
};

const campo = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const label = {
  fontSize: "15px",
  fontWeight: 800,
  color: "rgba(255,255,255,0.88)",
};

const input = {
  width: "100%",
  height: "56px",
  padding: "0 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.62)",
  color: "#ffffff",
  fontSize: "15px",
  outline: "none",
};

const select = {
  width: "100%",
  height: "56px",
  padding: "0 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.62)",
  color: "#ffffff",
  fontSize: "15px",
  outline: "none",
};

const resumoBox = {
  minHeight: "56px",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
};

const resumoTexto = {
  color: "rgba(255,255,255,0.76)",
  fontSize: "14px",
};

const acoes = {
  position: "relative" as const,
  zIndex: 1,
  marginTop: "24px",
  display: "flex",
};

const botaoPrincipal = {
  width: "100%",
  height: "60px",
  borderRadius: "18px",
  border: "none",
  background:
    "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 18px 34px rgba(34,197,94,0.28)",
};