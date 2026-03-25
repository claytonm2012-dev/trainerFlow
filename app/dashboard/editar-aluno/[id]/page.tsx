"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../../../firebaseDb";
import auth from "../../../firebaseAuth";
import { useParams, useRouter } from "next/navigation";

export default function EditarAluno() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoPlano, setTipoPlano] = useState("mensal");
  const [tipoPagamento, setTipoPagamento] = useState("mensal");
  const [formaCobranca, setFormaCobranca] = useState("antecipado");
  const [valor, setValor] = useState("");
  const [reposicoes, setReposicoes] = useState("0");
  const [status, setStatus] = useState("ativo");
  const [pagamentoStatus, setPagamentoStatus] = useState("pendente");
  const [diaVencimento, setDiaVencimento] = useState("5");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function carregarAluno() {
      try {
        setCarregando(true);

        const user = auth.currentUser;

        if (!user) {
          alert("Usuário não autenticado.");
          router.push("/login");
          return;
        }

        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("Aluno não encontrado");
          router.push("/dashboard/lista-alunos");
          return;
        }

        const aluno = docSnap.data();

        if (aluno.userId !== user.uid) {
          alert("Você não tem permissão para editar este aluno.");
          router.push("/dashboard/lista-alunos");
          return;
        }

        setNome(aluno.nome || "");
        setTelefone(aluno.telefone || "");
        setTipoPlano(aluno.tipoPlano || "mensal");
        setTipoPagamento(aluno.tipoPagamento || "mensal");
        setFormaCobranca(aluno.formaCobranca || "antecipado");
        setValor(aluno.valor || "");
        setReposicoes(String(aluno.reposicoes ?? 0));
        setStatus(aluno.status || "ativo");
        setPagamentoStatus(aluno.pagamentoStatus || "pendente");
        setDiaVencimento(String(aluno.diaVencimento || 5));
      } catch (error) {
        console.error("Erro ao carregar aluno:", error);
        alert("Erro ao carregar aluno");
      } finally {
        setCarregando(false);
      }
    }

    carregarAluno();
  }, [id, router]);

  async function salvarAlteracoes() {
    if (!nome.trim()) {
      alert("Digite o nome do aluno");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite o telefone do aluno");
      return;
    }

    if (!valor.trim()) {
      alert("Digite o valor");
      return;
    }

    const dia = Number(diaVencimento);

    if (!dia || dia < 1 || dia > 31) {
      alert("Informe um dia de vencimento entre 1 e 31");
      return;
    }

    try {
      setSalvando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        return;
      }

      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Aluno não encontrado.");
        router.push("/dashboard/lista-alunos");
        return;
      }

      const alunoAtual = docSnap.data();

      if (alunoAtual.userId !== user.uid) {
        alert("Você não tem permissão para editar este aluno.");
        router.push("/dashboard/lista-alunos");
        return;
      }

      await updateDoc(doc(db, "students", id), {
        nome,
        telefone,
        tipoPlano,
        tipoPagamento,
        formaCobranca,
        valor,
        reposicoes: Number(reposicoes),
        status,
        pagamentoStatus,
        diaVencimento: dia,
      });

      alert("Aluno atualizado com sucesso");
      router.push("/dashboard/lista-alunos");
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      alert("Erro ao atualizar aluno");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div style={pagina}>
        <div style={mensagemBox}>
          <p style={mensagemTexto}>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pagina}>
      <div style={topo}>
        <div>
          <p style={subtitulo}>Atualização de cadastro</p>
          <h1 style={titulo}>Editar aluno</h1>
        </div>
      </div>

      <div style={card}>
        <div style={linha}>
          <div style={campo}>
            <label style={label}>Nome do aluno</label>
            <input
              placeholder="Digite o nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={campo}>
            <label style={label}>Telefone</label>
            <input
              placeholder="Digite o telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={linha}>
          <div style={campo}>
            <label style={label}>Plano de aulas</label>
            <select
              value={tipoPlano}
              onChange={(e) => setTipoPlano(e.target.value)}
              style={selectStyle}
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
              style={selectStyle}
            >
              <option value="mensal">Mensal</option>
              <option value="por-aula">Por aula</option>
            </select>
          </div>
        </div>

        <div style={linha}>
          <div style={campo}>
            <label style={label}>Forma de cobrança</label>
            <select
              value={formaCobranca}
              onChange={(e) => setFormaCobranca(e.target.value)}
              style={selectStyle}
            >
              <option value="antecipado">Antecipado</option>
              <option value="posterior">Posterior</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Valor</label>
            <input
              placeholder="Ex: 200"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={linha}>
          <div style={campo}>
            <label style={label}>Reposições realizadas</label>
            <input
              type="number"
              min="0"
              value={reposicoes}
              onChange={(e) => setReposicoes(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={campo}>
            <label style={label}>Status do aluno</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={selectStyle}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div style={linha}>
          <div style={campo}>
            <label style={label}>Status do pagamento</label>
            <select
              value={pagamentoStatus}
              onChange={(e) => setPagamentoStatus(e.target.value)}
              style={selectStyle}
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>

          <div style={campo}>
            <label style={label}>Dia do vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 5"
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={linha}>
          <div style={campo}>
            <label style={label}>Resumo</label>
            <div style={resumoBox}>
              <span style={resumoTexto}>
                Plano: {formatarPlano(tipoPlano)} | Pagamento:{" "}
                {formatarPagamento(tipoPagamento)} | Vencimento: dia{" "}
                {diaVencimento || "-"}
              </span>
            </div>
          </div>
        </div>

        <div style={acoes}>
          <button
            onClick={() => router.push("/dashboard/lista-alunos")}
            style={botaoSecundario}
          >
            Cancelar
          </button>

          <button
            onClick={salvarAlteracoes}
            style={botao}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
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

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const topo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "12px",
};

const subtitulo = {
  color: "rgba(255,255,255,0.65)",
  margin: 0,
  fontSize: "14px",
};

const titulo = {
  fontSize: "40px",
  margin: "6px 0 0 0",
  fontWeight: 800,
};

const card = {
  maxWidth: "980px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "18px",
  background: "rgba(255,255,255,0.08)",
  padding: "28px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.20)",
};

const linha = {
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
  fontSize: "14px",
  color: "rgba(255,255,255,0.88)",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.55)",
  color: "#ffffff",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};

const selectStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.55)",
  color: "#ffffff",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box" as const,
  appearance: "none" as const,
};

const resumoBox = {
  minHeight: "49px",
  display: "flex",
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const resumoTexto = {
  color: "rgba(255,255,255,0.78)",
  fontSize: "14px",
};

const acoes = {
  display: "flex",
  gap: "12px",
  marginTop: "10px",
};

const botao = {
  flex: 1,
  padding: "16px",
  background: "#22c55e",
  border: "none",
  borderRadius: "14px",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "16px",
  boxShadow: "0 12px 26px rgba(34,197,94,0.28)",
};

const botaoSecundario = {
  flex: 1,
  padding: "16px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "14px",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "16px",
};

const mensagemBox = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "16px",
  padding: "24px",
};

const mensagemTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.8)",
  fontSize: "16px",
};