"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import db from "../../firebaseDb";
import auth from "../../firebaseAuth";
import { limparTelefoneWhatsApp } from "@/utils/whatsapp";

// ============================================================================
// TYPES
// ============================================================================
type Aluno = {
  id: string;
  nome?: string;
  valor?: string | number;
  telefone?: string;
  userId?: string;
};

type AulaStatus = "pendente" | "presente" | "faltou" | "cancelado";

type Aula = {
  id: string;
  alunoId?: string;
  alunoNome?: string;
  data?: string;
  hora?: string;
  reposicao?: string;
  status?: AulaStatus;
  valorAula?: number;
  userId?: string;
};

type DiaSemanaItem = {
  chave: string;
  label: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================
const diasSemana: DiaSemanaItem[] = [
  { chave: "segunda", label: "Segunda" },
  { chave: "terca", label: "Terca" },
  { chave: "quarta", label: "Quarta" },
  { chave: "quinta", label: "Quinta" },
  { chave: "sexta", label: "Sexta" },
  { chave: "sabado", label: "Sabado" },
  { chave: "domingo", label: "Domingo" },
];

const horariosFixos = [
  "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

const coresAluno = [
  { fundo: "rgba(34,197,94,0.12)", borda: "rgba(34,197,94,0.20)", texto: "#86efac", glow: "0 0 18px rgba(34,197,94,0.10)" },
  { fundo: "rgba(59,130,246,0.12)", borda: "rgba(59,130,246,0.20)", texto: "#93c5fd", glow: "0 0 18px rgba(59,130,246,0.10)" },
  { fundo: "rgba(168,85,247,0.12)", borda: "rgba(168,85,247,0.20)", texto: "#d8b4fe", glow: "0 0 18px rgba(168,85,247,0.10)" },
  { fundo: "rgba(250,204,21,0.12)", borda: "rgba(250,204,21,0.20)", texto: "#fde68a", glow: "0 0 18px rgba(250,204,21,0.10)" },
  { fundo: "rgba(236,72,153,0.12)", borda: "rgba(236,72,153,0.20)", texto: "#f9a8d4", glow: "0 0 18px rgba(236,72,153,0.10)" },
  { fundo: "rgba(14,165,233,0.12)", borda: "rgba(14,165,233,0.20)", texto: "#7dd3fc", glow: "0 0 18px rgba(14,165,233,0.10)" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getInicioDaSemana(data: Date): string {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getFimDaSemanaPorInicio(inicioISO: string): string {
  return addDiasEmISO(inicioISO, 6);
}

function addDiasEmISO(dataISO: string, dias: number): string {
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
}

function getChaveDiaSemana(dataISO: string): string {
  const data = new Date(`${dataISO}T12:00:00`);
  const dia = data.getDay();
  const mapa: Record<number, string> = {
    0: "domingo", 1: "segunda", 2: "terca", 3: "quarta",
    4: "quinta", 5: "sexta", 6: "sabado",
  };
  return mapa[dia] || "segunda";
}

function formatarData(dataISO?: string): string {
  if (!dataISO) return "--/--/----";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarHoraParaGrade(hora?: string): string {
  if (!hora) return "";
  const [h] = hora.split(":");
  return `${h.padStart(2, "0")}:00`;
}

function getCorAluno(nome?: string) {
  if (!nome) return coresAluno[0];
  let soma = 0;
  for (let i = 0; i < nome.length; i++) {
    soma += nome.charCodeAt(i);
  }
  return coresAluno[soma % coresAluno.length];
}

function getStatusVisual(status: AulaStatus) {
  const statusMap: Record<AulaStatus, { label: string; background: string; border: string; color: string }> = {
    presente: { label: "Presente", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.22)", color: "#86efac" },
    faltou: { label: "Faltou", background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" },
    cancelado: { label: "Cancelado", background: "rgba(250,204,21,0.14)", border: "1px solid rgba(250,204,21,0.22)", color: "#fde68a" },
    pendente: { label: "Pendente", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff" },
  };
  return statusMap[status] || statusMap.pendente;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function gerarLinkWhatsAppAula(telefone?: string, alunoNome?: string, data?: string, hora?: string): string {
  const numero = limparTelefoneWhatsApp(telefone);
  const mensagem = encodeURIComponent(
    `Ola ${alunoNome || "Aluno"}! Lembrete da sua aula de treino agendada para ${formatarData(data)} as ${hora || "--:--"}. Confirme sua presenca!`
  );
  return `https://wa.me/${numero}?text=${mensagem}`;
}

function getDataDoDiaISO(inicioSemana: string, chaveDia: string): string {
  const mapa: Record<string, number> = {
    segunda: 0, terca: 1, quarta: 2, quinta: 3, sexta: 4, sabado: 5, domingo: 6
  };
  return addDiasEmISO(inicioSemana, mapa[chaveDia] || 0);
}

// ============================================================================
// ICONS
// ============================================================================
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconDollar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AgendaPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [alunoNome, setAlunoNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");

  const [modoCadastro, setModoCadastro] = useState<"manual" | "automatico">("manual");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  const [salvando, setSalvando] = useState(false);

  const [aulasHoje, setAulasHoje] = useState(0);
  const [aulasSemana, setAulasSemana] = useState(0);
  const [faturamentoMensal, setFaturamentoMensal] = useState(0);

  const [aulasMes, setAulasMes] = useState(0);
  const [presencasMes, setPresencasMes] = useState(0);
  const [faltasMes, setFaltasMes] = useState(0);

  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroAluno, setFiltroAluno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | AulaStatus | "reposicao" | "hoje">("todos");

  const [inicioSemanaSelecionada, setInicioSemanaSelecionada] = useState(getInicioDaSemana(new Date()));

  const [editandoId, setEditandoId] = useState("");
  const [editAlunoNome, setEditAlunoNome] = useState("");
  const [editData, setEditData] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editReposicao, setEditReposicao] = useState("nao");
  const [editStatus, setEditStatus] = useState<AulaStatus>("pendente");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const carrosselRef = useRef<HTMLDivElement | null>(null);

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 900);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Carregar dados do Firebase
  const carregarDados = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Carregar alunos
      const alunosSnapshot = await getDocs(
        query(collection(db, "students"), where("userId", "==", user.uid))
      );
      const listaAlunos = alunosSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aluno[];

      // Carregar aulas
      const aulasSnapshot = await getDocs(
        query(collection(db, "agenda"), where("userId", "==", user.uid))
      );
      const listaAulas = aulasSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aula[];

      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];
      const inicioSemanaAtual = getInicioDaSemana(hoje);
      const fimSemanaAtual = getFimDaSemanaPorInicio(inicioSemanaAtual);

      const totalHoje = listaAulas.filter((aula) => aula.data === hojeISO).length;

      const totalSemanaAtual = listaAulas.filter((aula) => {
        if (!aula.data) return false;
        return aula.data >= inicioSemanaAtual && aula.data <= fimSemanaAtual;
      }).length;

      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();

      const aulasDoMesAtual = listaAulas.filter((aula) => {
        if (!aula.data) return false;
        const [ano, mes] = aula.data.split("-").map(Number);
        return mes === mesAtual && ano === anoAtual;
      });

      // Calcular faturamento mensal (soma do valor das aulas com presenca)
      const faturamento = aulasDoMesAtual
        .filter((aula) => aula.status === "presente")
        .reduce((acc, aula) => acc + (aula.valorAula || 0), 0);

      setAlunos(listaAlunos);
      setAulas(listaAulas);
      setAulasHoje(totalHoje);
      setAulasSemana(totalSemanaAtual);
      setFaturamentoMensal(faturamento);
      setAulasMes(aulasDoMesAtual.length);
      setPresencasMes(aulasDoMesAtual.filter((a) => a.status === "presente").length);
      setFaltasMes(aulasDoMesAtual.filter((a) => a.status === "faltou").length);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        carregarDados();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [carregarDados]);

  // Cadastrar aula manual
  async function cadastrarAula() {
    if (!alunoNome) return alert("Selecione um aluno");
    if (!data) return alert("Informe a data");
    if (!hora) return alert("Informe a hora");

    const user = auth.currentUser;
    if (!user) return alert("Usuario nao autenticado");

    setSalvando(true);
    
    try {
      const aluno = alunos.find((a) => a.nome === alunoNome);
      const valorNumerico = aluno?.valor ? Number(aluno.valor) : 0;

      await addDoc(collection(db, "agenda"), {
        alunoNome,
        alunoId: aluno?.id || "",
        data,
        hora,
        reposicao,
        valorAula: valorNumerico,
        status: "pendente",
        userId: user.uid,
        criadoEm: new Date().toISOString(),
      });

      alert("Aula cadastrada com sucesso!");
      setAlunoNome("");
      setData("");
      setHora("");
      setReposicao("nao");
      carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar aula:", error);
      alert("Erro ao cadastrar aula");
    } finally {
      setSalvando(false);
    }
  }

  // Cadastrar aulas automaticas (recorrentes)
  async function cadastrarAulasAutomaticas() {
    if (!alunoNome) return alert("Selecione um aluno");
    if (!hora) return alert("Informe a hora");
    if (diasSelecionados.length === 0) return alert("Selecione pelo menos um dia da semana");

    const user = auth.currentUser;
    if (!user) return alert("Usuario nao autenticado");

    setSalvando(true);
    
    try {
      const aluno = alunos.find((a) => a.nome === alunoNome);
      const valorNumerico = aluno?.valor ? Number(aluno.valor) : 0;
      const hoje = new Date();

      for (let semana = 0; semana < quantidadeSemanas; semana++) {
        for (const dia of diasSelecionados) {
          const dataBase = new Date(hoje);
          dataBase.setHours(12, 0, 0, 0);
          dataBase.setDate(hoje.getDate() + semana * 7);

          while (getChaveDiaSemana(dataBase.toISOString().split("T")[0]) !== dia) {
            dataBase.setDate(dataBase.getDate() + 1);
          }

          const dataISO = dataBase.toISOString().split("T")[0];

          await addDoc(collection(db, "agenda"), {
            alunoNome,
            alunoId: aluno?.id || "",
            data: dataISO,
            hora,
            reposicao,
            valorAula: valorNumerico,
            status: "pendente",
            userId: user.uid,
            criadoEm: new Date().toISOString(),
          });
        }
      }

      alert(`${quantidadeSemanas * diasSelecionados.length} aulas recorrentes cadastradas com sucesso!`);
      setAlunoNome("");
      setData("");
      setHora("");
      setReposicao("nao");
      setDiasSelecionados([]);
      setQuantidadeSemanas(4);
      setModoCadastro("manual");
      carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar aulas:", error);
      alert("Erro ao cadastrar aulas");
    } finally {
      setSalvando(false);
    }
  }

  // Edicao
  function abrirEdicao(aula: Aula) {
    setEditandoId(aula.id);
    setEditAlunoNome(aula.alunoNome || "");
    setEditData(aula.data || "");
    setEditHora(aula.hora || "");
    setEditReposicao(aula.reposicao || "nao");
    setEditStatus((aula.status as AulaStatus) || "pendente");

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function cancelarEdicao() {
    setEditandoId("");
    setEditAlunoNome("");
    setEditData("");
    setEditHora("");
    setEditReposicao("nao");
    setEditStatus("pendente");
  }

  async function salvarEdicao() {
    if (!editandoId) return;
    if (!editAlunoNome) return alert("Selecione um aluno");
    if (!editData) return alert("Informe a data");
    if (!editHora) return alert("Informe a hora");

    setSalvandoEdicao(true);
    
    try {
      const aluno = alunos.find((a) => a.nome === editAlunoNome);
      const valorNumerico = aluno?.valor ? Number(aluno.valor) : 0;

      await updateDoc(doc(db, "agenda", editandoId), {
        alunoNome: editAlunoNome,
        alunoId: aluno?.id || "",
        data: editData,
        hora: editHora,
        reposicao: editReposicao,
        valorAula: valorNumerico,
        status: editStatus,
        atualizadoEm: new Date().toISOString(),
      });

      alert("Aula atualizada com sucesso!");
      cancelarEdicao();
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar edicao:", error);
      alert("Erro ao atualizar aula");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function atualizarStatusAula(id: string, novoStatus: AulaStatus) {
    try {
      await updateDoc(doc(db, "agenda", id), {
        status: novoStatus,
        atualizadoEm: new Date().toISOString(),
      });
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  }

  async function excluirAula(id: string) {
    if (!window.confirm("Deseja excluir esta aula?")) return;
    
    try {
      await deleteDoc(doc(db, "agenda", id));
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir aula:", error);
      alert("Erro ao excluir aula");
    }
  }

  // Navegacao semanal
  function irSemanaAnterior() {
    setInicioSemanaSelecionada((v) => addDiasEmISO(v, -7));
  }
  function irProximaSemana() {
    setInicioSemanaSelecionada((v) => addDiasEmISO(v, 7));
  }
  function irSemanaAtual() {
    setInicioSemanaSelecionada(getInicioDaSemana(new Date()));
  }

  // Filtros
  function aplicarFiltroAluno() {
    setFiltroAluno(buscaAluno.trim());
  }
  function limparFiltrosAgenda() {
    setBuscaAluno("");
    setFiltroAluno("");
    setFiltroStatus("todos");
  }
  function toggleDiaSelecionado(chave: string) {
    setDiasSelecionados((v) =>
      v.includes(chave) ? v.filter((i) => i !== chave) : [...v, chave]
    );
  }

  // Memos
  const fimSemanaSelecionada = useMemo(() => getFimDaSemanaPorInicio(inicioSemanaSelecionada), [inicioSemanaSelecionada]);

  const aulasFiltradasBase = useMemo(() => {
    let lista = [...aulas];

    if (filtroAluno.trim()) {
      const termo = filtroAluno.trim().toLowerCase();
      lista = lista.filter((a) => (a.alunoNome || "").toLowerCase().includes(termo));
    }

    if (filtroStatus === "hoje") {
      const hojeISO = new Date().toISOString().split("T")[0];
      lista = lista.filter((a) => a.data === hojeISO);
    } else if (filtroStatus === "reposicao") {
      lista = lista.filter((a) => a.reposicao === "sim");
    } else if (filtroStatus !== "todos") {
      lista = lista.filter((a) => a.status === filtroStatus);
    }

    return lista;
  }, [aulas, filtroAluno, filtroStatus]);

  const aulasDaSemanaSelecionada = useMemo(() => {
    return aulasFiltradasBase.filter((a) => {
      if (!a.data) return false;
      return a.data >= inicioSemanaSelecionada && a.data <= fimSemanaSelecionada;
    });
  }, [aulasFiltradasBase, inicioSemanaSelecionada, fimSemanaSelecionada]);

  const gradeSemanal = useMemo(() => {
    const grade: Record<string, Record<string, Aula[]>> = {};

    diasSemana.forEach((dia) => {
      grade[dia.chave] = {};
      horariosFixos.forEach((horario) => {
        grade[dia.chave][horario] = [];
      });
    });

    aulasDaSemanaSelecionada.forEach((aula) => {
      if (!aula.data || !aula.hora) return;
      const chaveDia = getChaveDiaSemana(aula.data);
      const horaBase = normalizarHoraParaGrade(aula.hora);
      if (grade[chaveDia] && grade[chaveDia][horaBase]) {
        grade[chaveDia][horaBase].push(aula);
      }
    });

    return grade;
  }, [aulasDaSemanaSelecionada]);

  const mapaSemanal = useMemo(() => {
    const estrutura: Record<string, Aula[]> = {
      segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [],
    };

    aulasDaSemanaSelecionada.forEach((aula) => {
      if (!aula.data) return;
      const chave = getChaveDiaSemana(aula.data);
      estrutura[chave].push(aula);
    });

    Object.keys(estrutura).forEach((chave) => {
      estrutura[chave].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
    });

    return estrutura;
  }, [aulasDaSemanaSelecionada]);

  const totalSemanaSelecionada = aulasDaSemanaSelecionada.length;

  const conflitoTotal = useMemo(() => {
    let total = 0;
    diasSemana.forEach((dia) => {
      horariosFixos.forEach((horario) => {
        const lista = gradeSemanal[dia.chave]?.[horario] || [];
        if (lista.length > 1) total += 1;
      });
    });
    return total;
  }, [gradeSemanal]);

  const presencasSemana = useMemo(() => aulasDaSemanaSelecionada.filter((a) => a.status === "presente").length, [aulasDaSemanaSelecionada]);
  const faltasSemana = useMemo(() => aulasDaSemanaSelecionada.filter((a) => a.status === "faltou").length, [aulasDaSemanaSelecionada]);

  // ============================================================================
  // RENDER - Card de Aula
  // ============================================================================
  function renderAulaCard(aula: Aula, showDate = false) {
    const cor = getCorAluno(aula.alunoNome);
    const statusInfo = getStatusVisual(aula.status as AulaStatus);
    const aluno = alunos.find(a => a.nome === aula.alunoNome);

    return (
      <div
        key={aula.id}
        style={{
          background: cor.fundo,
          border: `1px solid ${cor.borda}`,
          borderRadius: "12px",
          padding: "12px",
          marginBottom: "8px",
          boxShadow: cor.glow,
          backdropFilter: "blur(10px)",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: cor.texto, fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
              {aula.alunoNome || "Sem nome"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
              <IconClock />
              <span>{aula.hora || "--:--"}</span>
              {showDate && <span>| {formatarData(aula.data)}</span>}
            </div>
          </div>
          <div
            style={{
              background: statusInfo.background,
              border: statusInfo.border,
              color: statusInfo.color,
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            {statusInfo.label}
          </div>
        </div>

        {aula.reposicao === "sim" && (
          <div style={{ 
            background: "rgba(250,204,21,0.15)", 
            color: "#fde68a", 
            padding: "4px 8px", 
            borderRadius: "6px", 
            fontSize: "11px", 
            marginBottom: "8px",
            display: "inline-block"
          }}>
            Reposicao
          </div>
        )}

        {aula.valorAula && aula.valorAula > 0 && (
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "8px" }}>
            {formatarMoeda(aula.valorAula)}
          </div>
        )}

        {/* Acoes rapidas */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => atualizarStatusAula(aula.id, "presente")}
            style={{
              background: "rgba(34,197,94,0.2)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#86efac",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
            }}
            title="Marcar Presenca"
          >
            <IconCheck /> Presenca
          </button>

          <button
            onClick={() => atualizarStatusAula(aula.id, "faltou")}
            style={{
              background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
            }}
            title="Marcar Falta"
          >
            <IconX /> Falta
          </button>

          <a
            href={gerarLinkWhatsAppAula(aluno?.telefone, aula.alunoNome, aula.data, aula.hora)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(37,211,102,0.2)",
              border: "1px solid rgba(37,211,102,0.3)",
              color: "#25D366",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            title="Enviar WhatsApp"
          >
            <IconWhatsApp /> WhatsApp
          </a>

          <button
            onClick={() => abrirEdicao(aula)}
            style={{
              background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#93c5fd",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
            }}
            title="Editar"
          >
            <IconEdit />
          </button>

          <button
            onClick={() => excluirAula(aula.id)}
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
            }}
            title="Excluir"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(59,130,246,0.2)",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Carregando agenda...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div style={{ padding: isMobile ? "0" : "0" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <h1 style={{
              color: "#ffffff",
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              Agenda
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "4px 0 0 0", fontSize: "14px" }}>
              Gerencie suas aulas e horarios
            </p>
          </div>
          <button
            onClick={carregarDados}
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "#93c5fd",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <IconRefresh /> Atualizar
          </button>
        </div>

        {/* Dashboard Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}>
          {/* Faturamento Mensal */}
          <div style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                background: "rgba(34,197,94,0.2)",
                borderRadius: "10px",
                padding: "10px",
                color: "#22c55e",
              }}>
                <IconDollar />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Faturamento Mensal</span>
            </div>
            <div style={{ color: "#86efac", fontSize: "28px", fontWeight: 700 }}>
              {formatarMoeda(faturamentoMensal)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>
              {presencasMes} aulas realizadas
            </div>
          </div>

          {/* Aulas Hoje */}
          <div style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                background: "rgba(59,130,246,0.2)",
                borderRadius: "10px",
                padding: "10px",
                color: "#3b82f6",
              }}>
                <IconCalendar />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Aulas Hoje</span>
            </div>
            <div style={{ color: "#93c5fd", fontSize: "28px", fontWeight: 700 }}>
              {aulasHoje}
            </div>
          </div>

          {/* Aulas na Semana */}
          <div style={{
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                background: "rgba(168,85,247,0.2)",
                borderRadius: "10px",
                padding: "10px",
                color: "#a855f7",
              }}>
                <IconUsers />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Esta Semana</span>
            </div>
            <div style={{ color: "#d8b4fe", fontSize: "28px", fontWeight: 700 }}>
              {aulasSemana}
            </div>
          </div>

          {/* Resumo Mes */}
          <div style={{
            background: "rgba(250,204,21,0.08)",
            border: "1px solid rgba(250,204,21,0.2)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                background: "rgba(250,204,21,0.2)",
                borderRadius: "10px",
                padding: "10px",
                color: "#facc15",
              }}>
                <IconCalendar />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Este Mes</span>
            </div>
            <div style={{ color: "#fde68a", fontSize: "28px", fontWeight: 700 }}>
              {aulasMes}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>
              {presencasMes} presencas | {faltasMes} faltas
            </div>
          </div>
        </div>

        {/* Formulario de Cadastro */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          backdropFilter: "blur(20px)",
        }}>
          <h2 style={{ color: "#ffffff", fontSize: "18px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <IconPlus /> Nova Aula
          </h2>

          {/* Tabs de modo */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              onClick={() => setModoCadastro("manual")}
              style={{
                background: modoCadastro === "manual" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${modoCadastro === "manual" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: modoCadastro === "manual" ? "#93c5fd" : "rgba(255,255,255,0.6)",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Aula Manual
            </button>
            <button
              onClick={() => setModoCadastro("automatico")}
              style={{
                background: modoCadastro === "automatico" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${modoCadastro === "automatico" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: modoCadastro === "automatico" ? "#93c5fd" : "rgba(255,255,255,0.6)",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              Aulas Recorrentes
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: "16px",
          }}>
            {/* Selecao de aluno */}
            <div>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Aluno
              </label>
              <select
                value={alunoNome}
                onChange={(e) => setAlunoNome(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Selecione...</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.nome} style={{ background: "#1e293b" }}>
                    {aluno.nome} - {formatarMoeda(Number(aluno.valor) || 0)}
                  </option>
                ))}
              </select>
            </div>

            {modoCadastro === "manual" ? (
              <>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                    Data
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                    Semanas
                  </label>
                  <select
                    value={quantidadeSemanas}
                    onChange={(e) => setQuantidadeSemanas(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value={4} style={{ background: "#1e293b" }}>4 semanas</option>
                    <option value={8} style={{ background: "#1e293b" }}>8 semanas</option>
                    <option value={12} style={{ background: "#1e293b" }}>12 semanas</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Horario
              </label>
              <select
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Selecione...</option>
                {horariosFixos.map((h) => (
                  <option key={h} value={h} style={{ background: "#1e293b" }}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Reposicao?
              </label>
              <select
                value={reposicao}
                onChange={(e) => setReposicao(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="nao" style={{ background: "#1e293b" }}>Nao</option>
                <option value="sim" style={{ background: "#1e293b" }}>Sim</option>
              </select>
            </div>
          </div>

          {/* Dias da semana para recorrencia */}
          {modoCadastro === "automatico" && (
            <div style={{ marginTop: "16px" }}>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "10px", display: "block" }}>
                Dias da Semana
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {diasSemana.map((dia) => (
                  <button
                    key={dia.chave}
                    onClick={() => toggleDiaSelecionado(dia.chave)}
                    style={{
                      background: diasSelecionados.includes(dia.chave) ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${diasSelecionados.includes(dia.chave) ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                      color: diasSelecionados.includes(dia.chave) ? "#93c5fd" : "rgba(255,255,255,0.6)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "all 0.2s",
                    }}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={modoCadastro === "manual" ? cadastrarAula : cadastrarAulasAutomaticas}
            disabled={salvando}
            style={{
              marginTop: "20px",
              background: salvando ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none",
              color: "#ffffff",
              padding: "14px 28px",
              borderRadius: "10px",
              cursor: salvando ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {salvando ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                Salvando...
              </>
            ) : (
              <>
                <IconPlus />
                {modoCadastro === "manual" ? "Cadastrar Aula" : "Criar Aulas Recorrentes"}
              </>
            )}
          </button>
        </div>

        {/* Editor de Aula */}
        {editandoId && (
          <div
            ref={editorRef}
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              backdropFilter: "blur(20px)",
            }}
          >
            <h2 style={{ color: "#93c5fd", fontSize: "18px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconEdit /> Editar Aula
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
              gap: "16px",
            }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Aluno
                </label>
                <select
                  value={editAlunoNome}
                  onChange={(e) => setEditAlunoNome(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Selecione...</option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.nome} style={{ background: "#1e293b" }}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Data
                </label>
                <input
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Horario
                </label>
                <select
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {horariosFixos.map((h) => (
                    <option key={h} value={h} style={{ background: "#1e293b" }}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AulaStatus)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <option value="pendente" style={{ background: "#1e293b" }}>Pendente</option>
                  <option value="presente" style={{ background: "#1e293b" }}>Presente</option>
                  <option value="faltou" style={{ background: "#1e293b" }}>Faltou</option>
                  <option value="cancelado" style={{ background: "#1e293b" }}>Cancelado</option>
                </select>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Reposicao?
                </label>
                <select
                  value={editReposicao}
                  onChange={(e) => setEditReposicao(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <option value="nao" style={{ background: "#1e293b" }}>Nao</option>
                  <option value="sim" style={{ background: "#1e293b" }}>Sim</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                style={{
                  background: salvandoEdicao ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  border: "none",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: salvandoEdicao ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconCheck /> {salvandoEdicao ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={cancelarEdicao}
                style={{
                  background: "rgba(239,68,68,0.2)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconX /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros e Navegacao */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: "16px",
          }}>
            {/* Navegacao semanal */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={irSemanaAnterior}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <IconChevronLeft />
              </button>

              <div style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "8px",
                padding: "10px 16px",
                color: "#93c5fd",
                fontSize: "14px",
                fontWeight: 500,
                minWidth: isMobile ? "auto" : "200px",
                textAlign: "center",
              }}>
                {formatarData(inicioSemanaSelecionada)} - {formatarData(fimSemanaSelecionada)}
              </div>

              <button
                onClick={irProximaSemana}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <IconChevronRight />
              </button>

              <button
                onClick={irSemanaAtual}
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#93c5fd",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <IconRefresh /> Hoje
              </button>
            </div>

            {/* Busca e filtros */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  type="text"
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarFiltroAluno()}
                  placeholder="Buscar aluno..."
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#ffffff",
                    fontSize: "14px",
                    width: isMobile ? "100%" : "180px",
                  }}
                />
                <button
                  onClick={aplicarFiltroAluno}
                  style={{
                    background: "rgba(59,130,246,0.2)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    color: "#93c5fd",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconSearch />
                </button>
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="todos" style={{ background: "#1e293b" }}>Todos</option>
                <option value="hoje" style={{ background: "#1e293b" }}>Hoje</option>
                <option value="pendente" style={{ background: "#1e293b" }}>Pendente</option>
                <option value="presente" style={{ background: "#1e293b" }}>Presente</option>
                <option value="faltou" style={{ background: "#1e293b" }}>Faltou</option>
                <option value="cancelado" style={{ background: "#1e293b" }}>Cancelado</option>
                <option value="reposicao" style={{ background: "#1e293b" }}>Reposicao</option>
              </select>

              {(filtroAluno || filtroStatus !== "todos") && (
                <button
                  onClick={limparFiltrosAgenda}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#fca5a5",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <IconX /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Stats da semana */}
          <div style={{
            display: "flex",
            gap: "16px",
            marginTop: "16px",
            flexWrap: "wrap",
          }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              <span style={{ color: "#93c5fd", fontWeight: 600 }}>{totalSemanaSelecionada}</span> aulas na semana
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              <span style={{ color: "#86efac", fontWeight: 600 }}>{presencasSemana}</span> presencas
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              <span style={{ color: "#fca5a5", fontWeight: 600 }}>{faltasSemana}</span> faltas
            </div>
            {conflitoTotal > 0 && (
              <div style={{ color: "#facc15", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                <IconAlertTriangle /> {conflitoTotal} conflitos de horario
              </div>
            )}
          </div>
        </div>

        {/* Grade Semanal - Desktop */}
        {!isMobile && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(20px)",
            overflowX: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{
                    padding: "12px",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "12px",
                    fontWeight: 600,
                    textAlign: "left",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    width: "60px",
                  }}>
                    Hora
                  </th>
                  {diasSemana.map((dia) => {
                    const dataDia = getDataDoDiaISO(inicioSemanaSelecionada, dia.chave);
                    const isHoje = dataDia === new Date().toISOString().split("T")[0];
                    return (
                      <th
                        key={dia.chave}
                        style={{
                          padding: "12px",
                          color: isHoje ? "#3b82f6" : "rgba(255,255,255,0.8)",
                          fontSize: "13px",
                          fontWeight: 600,
                          textAlign: "center",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          background: isHoje ? "rgba(59,130,246,0.08)" : "transparent",
                        }}
                      >
                        <div>{dia.label}</div>
                        <div style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                          {formatarData(dataDia)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {horariosFixos.map((horario) => (
                  <tr key={horario}>
                    <td style={{
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      verticalAlign: "top",
                    }}>
                      {horario}
                    </td>
                    {diasSemana.map((dia) => {
                      const aulasSlot = gradeSemanal[dia.chave]?.[horario] || [];
                      const dataDia = getDataDoDiaISO(inicioSemanaSelecionada, dia.chave);
                      const isHoje = dataDia === new Date().toISOString().split("T")[0];
                      return (
                        <td
                          key={dia.chave}
                          style={{
                            padding: "6px",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            verticalAlign: "top",
                            background: isHoje ? "rgba(59,130,246,0.04)" : "transparent",
                            minWidth: "140px",
                          }}
                        >
                          {aulasSlot.map((aula) => renderAulaCard(aula))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Carrossel Mobile */}
        {isMobile && (
          <div
            ref={carrosselRef}
            style={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              gap: "16px",
              paddingBottom: "16px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {diasSemana.map((dia) => {
              const dataDia = getDataDoDiaISO(inicioSemanaSelecionada, dia.chave);
              const isHoje = dataDia === new Date().toISOString().split("T")[0];
              const aulasDia = mapaSemanal[dia.chave] || [];
              
              return (
                <div
                  key={dia.chave}
                  style={{
                    minWidth: "300px",
                    maxWidth: "300px",
                    scrollSnapAlign: "start",
                    background: isHoje ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isHoje ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "16px",
                    padding: "16px",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    <div>
                      <div style={{ color: isHoje ? "#3b82f6" : "#ffffff", fontWeight: 600, fontSize: "16px" }}>
                        {dia.label}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                        {formatarData(dataDia)}
                      </div>
                    </div>
                    <div style={{
                      background: isHoje ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.1)",
                      color: isHoje ? "#93c5fd" : "rgba(255,255,255,0.7)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}>
                      {aulasDia.length} aulas
                    </div>
                  </div>

                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {aulasDia.length === 0 ? (
                      <div style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "13px",
                        textAlign: "center",
                        padding: "40px 0",
                      }}>
                        Nenhuma aula
                      </div>
                    ) : (
                      aulasDia.map((aula) => renderAulaCard(aula, true))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        
        select option {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}
