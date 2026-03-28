"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import db from "../../firebaseDb";
import auth from "../../firebaseAuth";

type Aluno = {
  id: string;
  nome?: string;
  userId?: string;
};

type AulaStatus = "pendente" | "presente" | "faltou" | "cancelado";

type Aula = {
  id: string;
  alunoNome?: string;
  data?: string;
  hora?: string;
  reposicao?: string;
  status?: AulaStatus;
  userId?: string;
};

type DiaSemanaItem = {
  chave: string;
  label: string;
};

type ResumoAlunoMes = {
  alunoNome: string;
  total: number;
  presencas: number;
  faltas: number;
  canceladas: number;
  reposicoes: number;
};

const diasSemana: DiaSemanaItem[] = [
  { chave: "segunda", label: "Segunda" },
  { chave: "terca", label: "Terça" },
  { chave: "quarta", label: "Quarta" },
  { chave: "quinta", label: "Quinta" },
  { chave: "sexta", label: "Sexta" },
  { chave: "sabado", label: "Sábado" },
  { chave: "domingo", label: "Domingo" },
];

const horariosFixos = [
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const coresAluno = [
  {
    fundo: "rgba(34,197,94,0.12)",
    borda: "rgba(34,197,94,0.20)",
    texto: "#86efac",
    glow: "0 0 18px rgba(34,197,94,0.10)",
  },
  {
    fundo: "rgba(59,130,246,0.12)",
    borda: "rgba(59,130,246,0.20)",
    texto: "#93c5fd",
    glow: "0 0 18px rgba(59,130,246,0.10)",
  },
  {
    fundo: "rgba(168,85,247,0.12)",
    borda: "rgba(168,85,247,0.20)",
    texto: "#d8b4fe",
    glow: "0 0 18px rgba(168,85,247,0.10)",
  },
  {
    fundo: "rgba(250,204,21,0.12)",
    borda: "rgba(250,204,21,0.20)",
    texto: "#fde68a",
    glow: "0 0 18px rgba(250,204,21,0.10)",
  },
  {
    fundo: "rgba(236,72,153,0.12)",
    borda: "rgba(236,72,153,0.20)",
    texto: "#f9a8d4",
    glow: "0 0 18px rgba(236,72,153,0.10)",
  },
  {
    fundo: "rgba(14,165,233,0.12)",
    borda: "rgba(14,165,233,0.20)",
    texto: "#7dd3fc",
    glow: "0 0 18px rgba(14,165,233,0.10)",
  },
];

export default function AgendaPage() {
  const [isMobile, setIsMobile] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [alunoNome, setAlunoNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");

  const [modoCadastro, setModoCadastro] = useState<"manual" | "automatico">(
    "manual"
  );
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [aulasHoje, setAulasHoje] = useState(0);
  const [aulasSemana, setAulasSemana] = useState(0);

  const [aulasMes, setAulasMes] = useState(0);
  const [presencasMes, setPresencasMes] = useState(0);
  const [faltasMes, setFaltasMes] = useState(0);
  const [canceladasMes, setCanceladasMes] = useState(0);
  const [reposicoesMes, setReposicoesMes] = useState(0);

  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroAluno, setFiltroAluno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | AulaStatus | "reposicao" | "hoje"
  >("todos");

  const [inicioSemanaSelecionada, setInicioSemanaSelecionada] = useState(
    getInicioDaSemana(new Date())
  );

  const [editandoId, setEditandoId] = useState("");
  const [editAlunoNome, setEditAlunoNome] = useState("");
  const [editData, setEditData] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editReposicao, setEditReposicao] = useState("nao");
  const [editStatus, setEditStatus] = useState<AulaStatus>("pendente");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        setAlunos([]);
        setAulas([]);
        setAulasHoje(0);
        setAulasSemana(0);
        setAulasMes(0);
        setPresencasMes(0);
        setFaltasMes(0);
        setCanceladasMes(0);
        setReposicoesMes(0);
        return;
      }

      const alunosSnapshot = await getDocs(
        query(collection(db, "students"), where("userId", "==", user.uid))
      );

      const agendaSnapshot = await getDocs(
        query(
          collection(db, "agenda"),
          where("userId", "==", user.uid),
          orderBy("data", "desc")
        )
      );

      const alunosLista = alunosSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aluno[];

      const aulasLista = agendaSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aula[];

      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];

      const inicioSemanaAtual = getInicioDaSemana(hoje);
      const fimSemanaAtual = getFimDaSemanaPorInicio(inicioSemanaAtual);

      const totalHoje = aulasLista.filter((aula) => aula.data === hojeISO).length;

      const totalSemanaAtual = aulasLista.filter((aula) => {
        if (!aula.data) return false;
        return aula.data >= inicioSemanaAtual && aula.data <= fimSemanaAtual;
      }).length;

      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();

      const aulasDoMesAtual = aulasLista.filter((aula) => {
        if (!aula.data) return false;

        const [ano, mes] = aula.data.split("-").map(Number);
        return mes === mesAtual && ano === anoAtual;
      });

      const totalMesAtual = aulasDoMesAtual.length;

      const totalPresencasMes = aulasDoMesAtual.filter(
        (aula) => aula.status === "presente"
      ).length;

      const totalFaltasMes = aulasDoMesAtual.filter(
        (aula) => aula.status === "faltou"
      ).length;

      const totalCanceladasMes = aulasDoMesAtual.filter(
        (aula) => aula.status === "cancelado"
      ).length;

      const totalReposicoesMes = aulasDoMesAtual.filter(
        (aula) => aula.reposicao === "sim"
      ).length;

      setAlunos(alunosLista);
      setAulas(aulasLista);
      setAulasHoje(totalHoje);
      setAulasSemana(totalSemanaAtual);

      setAulasMes(totalMesAtual);
      setPresencasMes(totalPresencasMes);
      setFaltasMes(totalFaltasMes);
      setCanceladasMes(totalCanceladasMes);
      setReposicoesMes(totalReposicoesMes);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
      alert("Erro ao carregar agenda");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    carregarDados();
  }, []);

  async function cadastrarAula() {
    if (!alunoNome) {
      alert("Selecione um aluno");
      return;
    }

    if (!data) {
      alert("Informe a data");
      return;
    }

    if (!hora) {
      alert("Informe a hora");
      return;
    }

    try {
      setSalvando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado");
        return;
      }

      await addDoc(collection(db, "agenda"), {
        alunoNome,
        data,
        hora,
        reposicao,
        status: "pendente",
        userId: user.uid,
        criadoEm: serverTimestamp(),
      });

      alert("Aula cadastrada com sucesso");

      setAlunoNome("");
      setData("");
      setHora("");
      setReposicao("nao");

      await carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar aula:", error);
      alert("Erro ao cadastrar aula");
    } finally {
      setSalvando(false);
    }
  }

  async function cadastrarAulasAutomaticas() {
    if (!alunoNome) {
      alert("Selecione um aluno");
      return;
    }

    if (!hora) {
      alert("Informe a hora");
      return;
    }

    if (diasSelecionados.length === 0) {
      alert("Selecione pelo menos um dia da semana");
      return;
    }

    try {
      setSalvando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado");
        return;
      }

      const hoje = new Date();

      for (let semana = 0; semana < quantidadeSemanas; semana += 1) {
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
            data: dataISO,
            hora,
            reposicao,
            status: "pendente",
            userId: user.uid,
            criadoEm: serverTimestamp(),
          });
        }
      }

      alert("Aulas recorrentes cadastradas com sucesso");

      setAlunoNome("");
      setData("");
      setHora("");
      setReposicao("nao");
      setDiasSelecionados([]);
      setQuantidadeSemanas(4);
      setModoCadastro("manual");

      await carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar aulas recorrentes:", error);
      alert("Erro ao cadastrar aulas recorrentes");
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(aula: Aula) {
    setEditandoId(aula.id);
    setEditAlunoNome(aula.alunoNome || "");
    setEditData(aula.data || "");
    setEditHora(aula.hora || "");
    setEditReposicao(aula.reposicao || "nao");
    setEditStatus((aula.status as AulaStatus) || "pendente");

    setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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

    if (!editAlunoNome) {
      alert("Selecione um aluno");
      return;
    }

    if (!editData) {
      alert("Informe a data");
      return;
    }

    if (!editHora) {
      alert("Informe a hora");
      return;
    }

    try {
      setSalvandoEdicao(true);

      await updateDoc(doc(db, "agenda", editandoId), {
        alunoNome: editAlunoNome,
        data: editData,
        hora: editHora,
        reposicao: editReposicao,
        status: editStatus,
      });

      alert("Aula atualizada com sucesso");
      cancelarEdicao();
      await carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      alert("Erro ao atualizar aula");
    } finally {
      setSalvandoEdicao(false);
    }
  }
  async function atualizarStatusAula(id: string, novoStatus: AulaStatus) {
    try {
      await updateDoc(doc(db, "agenda", id), {
        status: novoStatus,
      });

      await carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  }

  async function excluirAula(id: string) {
    const confirmar = window.confirm("Deseja excluir esta aula?");
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "agenda", id));
      await carregarDados();
    } catch (error) {
      console.error("Erro ao excluir aula:", error);
      alert("Erro ao excluir aula");
    }
  }

  function irSemanaAnterior() {
    setInicioSemanaSelecionada((valorAtual) => addDiasEmISO(valorAtual, -7));
  }

  function irProximaSemana() {
    setInicioSemanaSelecionada((valorAtual) => addDiasEmISO(valorAtual, 7));
  }

  function irSemanaAtual() {
    setInicioSemanaSelecionada(getInicioDaSemana(new Date()));
  }

  function aplicarFiltroAluno() {
    setFiltroAluno(buscaAluno.trim());
  }

  function limparFiltrosAgenda() {
    setBuscaAluno("");
    setFiltroAluno("");
    setFiltroStatus("todos");
  }

  function toggleDiaSelecionado(chave: string) {
    setDiasSelecionados((valorAtual) =>
      valorAtual.includes(chave)
        ? valorAtual.filter((item) => item !== chave)
        : [...valorAtual, chave]
    );
  }

  const fimSemanaSelecionada = useMemo(
    () => getFimDaSemanaPorInicio(inicioSemanaSelecionada),
    [inicioSemanaSelecionada]
  );

  const aulasFiltradasBase = useMemo(() => {
    let lista = [...aulas];

    if (filtroAluno.trim()) {
      const termo = filtroAluno.trim().toLowerCase();
      lista = lista.filter((aula) =>
        (aula.alunoNome || "").toLowerCase().includes(termo)
      );
    }

    if (filtroStatus === "hoje") {
      const hojeISO = new Date().toISOString().split("T")[0];
      lista = lista.filter((aula) => aula.data === hojeISO);
    } else if (filtroStatus === "reposicao") {
      lista = lista.filter((aula) => aula.reposicao === "sim");
    } else if (filtroStatus !== "todos") {
      lista = lista.filter((aula) => aula.status === filtroStatus);
    }

    return lista;
  }, [aulas, filtroAluno, filtroStatus]);

  const aulasDaSemanaSelecionada = useMemo(() => {
    return aulasFiltradasBase.filter((aula) => {
      if (!aula.data) return false;
      return (
        aula.data >= inicioSemanaSelecionada &&
        aula.data <= fimSemanaSelecionada
      );
    });
  }, [aulasFiltradasBase, inicioSemanaSelecionada, fimSemanaSelecionada]);

  const mapaSemanal = useMemo(() => {
    const estrutura: Record<string, Aula[]> = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: [],
    };

    aulasDaSemanaSelecionada.forEach((aula) => {
      if (!aula.data) return;
      const chave = getChaveDiaSemana(aula.data);
      estrutura[chave].push(aula);
    });

    Object.keys(estrutura).forEach((chave) => {
      estrutura[chave].sort((a, b) =>
        (a.hora || "").localeCompare(b.hora || "")
      );
    });

    return estrutura;
  }, [aulasDaSemanaSelecionada]);

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

  const presencasSemana = useMemo(
    () =>
      aulasDaSemanaSelecionada.filter((aula) => aula.status === "presente")
        .length,
    [aulasDaSemanaSelecionada]
  );

  const faltasSemana = useMemo(
    () =>
      aulasDaSemanaSelecionada.filter((aula) => aula.status === "faltou").length,
    [aulasDaSemanaSelecionada]
  );

  const canceladasSemana = useMemo(
    () =>
      aulasDaSemanaSelecionada.filter((aula) => aula.status === "cancelado")
        .length,
    [aulasDaSemanaSelecionada]
  );

  const reposicoesSemana = useMemo(
    () =>
      aulasDaSemanaSelecionada.filter((aula) => aula.reposicao === "sim").length,
    [aulasDaSemanaSelecionada]
  );

  const percentualPresencaSemana = useMemo(() => {
    const base = presencasSemana + faltasSemana + canceladasSemana;
    if (base === 0) return 0;
    return Math.round((presencasSemana / base) * 100);
  }, [presencasSemana, faltasSemana, canceladasSemana]);

  const percentualPresencaMes = useMemo(() => {
    const base = presencasMes + faltasMes + canceladasMes;
    if (base === 0) return 0;
    return Math.round((presencasMes / base) * 100);
  }, [presencasMes, faltasMes, canceladasMes]);

  const nomeMesAtual = useMemo(() => {
    const agora = new Date();
    return agora.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, []);

  const resumoMensalPorAluno = useMemo<ResumoAlunoMes[]>(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const mapa: Record<string, ResumoAlunoMes> = {};

    aulasFiltradasBase.forEach((aula) => {
      if (!aula.data || !aula.alunoNome) return;

      const [ano, mes] = aula.data.split("-").map(Number);

      if (mes !== mesAtual || ano !== anoAtual) return;

      if (!mapa[aula.alunoNome]) {
        mapa[aula.alunoNome] = {
          alunoNome: aula.alunoNome,
          total: 0,
          presencas: 0,
          faltas: 0,
          canceladas: 0,
          reposicoes: 0,
        };
      }

      mapa[aula.alunoNome].total += 1;

      if (aula.status === "presente") mapa[aula.alunoNome].presencas += 1;
      if (aula.status === "faltou") mapa[aula.alunoNome].faltas += 1;
      if (aula.status === "cancelado") mapa[aula.alunoNome].canceladas += 1;
      if (aula.reposicao === "sim") mapa[aula.alunoNome].reposicoes += 1;
    });

    return Object.values(mapa).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.alunoNome.localeCompare(b.alunoNome);
    });
  }, [aulasFiltradasBase]);

  const pagina = {
    display: "flex",
    flexDirection: "column" as const,
    gap: isMobile ? "16px" : "24px",
    padding: isMobile ? "12px" : "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const hero = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(300px, 1fr))",
    gap: isMobile ? "12px" : "20px",
    width: "100%",
  };

  const heroPrincipal = {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: isMobile ? "22px" : "28px",
    padding: isMobile ? "18px" : "28px",
    boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box" as const,
  };

  const heroResumoGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: isMobile ? "12px" : "20px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  };

  const heroResumo = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: isMobile ? "22px" : "28px",
    padding: isMobile ? "16px" : "24px",
    boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={pagina}>
      <section style={hero}>
        <div style={heroPrincipal}>
          <p style={eyebrow}>Agenda e controle de aulas</p>
          <h1 style={titulo}>Agenda</h1>
          <p style={descricao}>
            Organize seus atendimentos, registre horários, acompanhe reposições,
            presença, faltas e visualize a semana em formato de planilha
            profissional por dia e por horário.
          </p>
        </div>

        <div style={heroResumoGrid}>
          <div style={heroResumo}>
            <p style={heroResumoRotulo}>Aulas do dia</p>
            <h2 style={heroResumoValorAzul}>
              {filtroAluno || filtroStatus !== "todos"
                ? aulasFiltradasBase.filter(
                    (aula) => aula.data === new Date().toISOString().split("T")[0]
                  ).length
                : aulasHoje}
            </h2>
            <p style={heroResumoTexto}>Total de aulas cadastradas para hoje.</p>
          </div>

          <div style={heroResumo}>
            <p style={heroResumoRotulo}>Aulas da semana atual</p>
            <h2 style={heroResumoValorVerde}>
              {filtroAluno || filtroStatus !== "todos"
                ? aulasDaSemanaSelecionada.length
                : aulasSemana}
            </h2>
            <p style={heroResumoTexto}>
              Visão consolidada da semana em andamento.
            </p>
          </div>

          <div style={heroResumo}>
            <p style={heroResumoRotulo}>Aulas no mês</p>
            <h2 style={heroResumoValorAzul}>{aulasMes}</h2>
            <p style={heroResumoTexto}>
              Total de aulas registradas no mês atual.
            </p>
          </div>

          <div style={heroResumo}>
            <p style={heroResumoRotulo}>Presença no mês</p>
            <h2 style={heroResumoValorVerde}>{percentualPresencaMes}%</h2>
            <p style={heroResumoTexto}>
              Presenças: {presencasMes} • Faltas: {faltasMes} • Canceladas:{" "}
              {canceladasMes}
            </p>
          </div>
        </div>
      </section>

      <section style={blocoPrincipal}>
        <div style={buscaCard}>
          <div style={buscaHeader}>
            <div>
              <p style={cardMini}>Busca e filtros</p>
              <h2 style={cardTitulo}>Filtrar agenda</h2>
            </div>

            {filtroAluno || filtroStatus !== "todos" ? (
              <button onClick={limparFiltrosAgenda} style={botaoLimparBusca}>
                Limpar filtros
              </button>
            ) : null}
          </div>

          <div style={buscaLinha}>
            <input
              type="text"
              placeholder="Buscar por nome do aluno"
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              style={inputBusca}
            />

            <button onClick={aplicarFiltroAluno} style={botaoAplicarBusca}>
              Filtrar aluno
            </button>
          </div>

          <div style={filtrosRapidos}>
            <button
              onClick={() => setFiltroStatus("todos")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "todos" ? botaoFiltroRapidoAtivo : {}),
              }}
            >
              Todos
            </button>

            <button
              onClick={() => setFiltroStatus("hoje")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "hoje" ? botaoFiltroRapidoAtivo : {}),
              }}
            >
              Só hoje
            </button>

            <button
              onClick={() => setFiltroStatus("pendente")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "pendente" ? botaoFiltroRapidoAtivo : {}),
              }}
            >
              Pendentes
            </button>

            <button
              onClick={() => setFiltroStatus("presente")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "presente" ? botaoFiltroRapidoAtivo : {}),
              }}
            >
              Presenças
            </button>

            <button
              onClick={() => setFiltroStatus("faltou")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "faltou" ? botaoFiltroRapidoAtivo : {}),
              }}
            >
              Faltas
            </button>

            <button
              onClick={() => setFiltroStatus("cancelado")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "cancelado"
                  ? botaoFiltroRapidoAtivo
                  : {}),
              }}
            >
              Canceladas
            </button>

            <button
              onClick={() => setFiltroStatus("reposicao")}
              style={{
                ...botaoFiltroRapido,
                ...(filtroStatus === "reposicao"
                  ? botaoFiltroRapidoAtivo
                  : {}),
              }}
            >
              Reposições
            </button>
          </div>

          <p style={buscaTexto}>
            {filtroAluno
              ? `Filtro de aluno ativo: ${filtroAluno}`
              : "Nenhum filtro de aluno aplicado."}
          </p>
        </div>

        <div style={formCard}>
          <div style={cardGlow}></div>

          <div style={cardHeader}>
            <div>
              <p style={cardMini}>Organização premium</p>
              <h2 style={cardTitulo}>Cadastrar aula</h2>
            </div>
          </div>

          <div style={modoCadastroWrap}>
            <button
              type="button"
              onClick={() => setModoCadastro("manual")}
              style={{
                ...modoCadastroBotao,
                ...(modoCadastro === "manual" ? modoCadastroBotaoAtivo : {}),
              }}
            >
              Aula única
            </button>

            <button
              type="button"
              onClick={() => setModoCadastro("automatico")}
              style={{
                ...modoCadastroBotao,
                ...(modoCadastro === "automatico"
                  ? modoCadastroBotaoAtivo
                  : {}),
              }}
            >
              Recorrência mensal
            </button>
          </div>

          {modoCadastro === "automatico" && (
            <div style={recorrenciaCard}>
              <div style={recorrenciaTopo}>
                <div>
                  <p style={recorrenciaMini}>Configuração automática</p>
                  <h3 style={recorrenciaTitulo}>Dias fixos da semana</h3>
                </div>

                <div style={quantidadeSemanasBox}>
                  <span style={quantidadeSemanasLabel}>Semanas</span>
                  <select
                    value={quantidadeSemanas}
                    onChange={(e) => setQuantidadeSemanas(Number(e.target.value))}
                    style={selectSemanas}
                  >
                    <option value={4}>4 semanas</option>
                    <option value={5}>5 semanas</option>
                    <option value={6}>6 semanas</option>
                    <option value={8}>8 semanas</option>
                  </select>
                </div>
              </div>

              <div style={diasSemanaCheckboxGrid}>
                {diasSemana.map((dia) => {
                  const ativo = diasSelecionados.includes(dia.chave);

                  return (
                    <button
                      key={dia.chave}
                      type="button"
                      onClick={() => toggleDiaSelecionado(dia.chave)}
                      style={{
                        ...diaSemanaChip,
                        ...(ativo ? diaSemanaChipAtivo : {}),
                      }}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={formGrid}>
            <div style={campo}>
              <label style={label}>Aluno</label>
              <select
                value={alunoNome}
                onChange={(e) => setAlunoNome(e.target.value)}
                style={select}
              >
                <option value="">Selecione um aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.nome}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={campo}>
              <label style={label}>Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={input}
                disabled={modoCadastro === "automatico"}
              />
            </div>

            <div style={campo}>
              <label style={label}>Hora</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={input}
              />
            </div>

            <div style={campo}>
              <label style={label}>Foi reposição?</label>
              <select
                value={reposicao}
                onChange={(e) => setReposicao(e.target.value)}
                style={select}
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
          </div>

          <div style={acoes}>
            <button
              onClick={
                modoCadastro === "manual"
                  ? cadastrarAula
                  : cadastrarAulasAutomaticas
              }
              disabled={salvando}
              style={botaoPrincipal}
            >
              {salvando
                ? "Salvando..."
                : modoCadastro === "manual"
                ? "Cadastrar aula"
                : "Cadastrar aulas automáticas"}
            </button>
          </div>
        </div>
        <div style={resumoMensalCard}>
          <div style={cardHeader}>
            <div>
              <p style={cardMini}>Resumo mensal</p>
              <h2 style={cardTitulo}>
                Mês atual - {primeiraMaiuscula(nomeMesAtual)}
              </h2>
            </div>
          </div>

          <div style={faixaMensal}>
            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Aulas no mês</span>
              <strong style={analiticaValorAzul}>{aulasMes}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Presenças no mês</span>
              <strong style={analiticaValorVerde}>{presencasMes}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Faltas no mês</span>
              <strong style={analiticaValorVermelho}>{faltasMes}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Canceladas no mês</span>
              <strong style={analiticaValorAmarelo}>{canceladasMes}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Reposições no mês</span>
              <strong style={analiticaValorRoxo}>{reposicoesMes}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Presença no mês</span>
              <strong style={analiticaValorVerde}>
                {percentualPresencaMes}%
              </strong>
            </div>
          </div>
        </div>

        <div style={quadroSemanalCard}>
          <div style={cardHeaderPlanilha}>
            <div>
              <p style={cardMini}>Visão semanal avançada</p>
              <h2 style={cardTitulo}>Planilha por horário</h2>
            </div>

            <div style={acoesSemana}>
              <button onClick={irSemanaAnterior} style={botaoSemanaSecundario}>
                Semana anterior
              </button>

              <button onClick={irSemanaAtual} style={botaoSemanaAtual}>
                Semana atual
              </button>

              <button onClick={irProximaSemana} style={botaoSemanaSecundario}>
                Próxima semana
              </button>
            </div>
          </div>

          <div style={barraPeriodo}>
            <div style={periodoBox}>
              <span style={periodoLabel}>Período exibido</span>
              <strong style={periodoValor}>
                {formatarData(inicioSemanaSelecionada)} até{" "}
                {formatarData(fimSemanaSelecionada)}
              </strong>
            </div>

            <div style={periodoResumoBox}>
              <span style={periodoResumoLabel}>Total na semana</span>
              <strong style={periodoResumoValor}>{totalSemanaSelecionada}</strong>
            </div>
          </div>

          <div style={faixaAnalitica}>
            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Conflitos</span>
              <strong style={analiticaValorVermelho}>{conflitoTotal}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Presenças</span>
              <strong style={analiticaValorVerde}>{presencasSemana}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Faltas</span>
              <strong style={analiticaValorAzul}>{faltasSemana}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Canceladas</span>
              <strong style={analiticaValorAmarelo}>{canceladasSemana}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Reposições</span>
              <strong style={analiticaValorRoxo}>{reposicoesSemana}</strong>
            </div>

            <div style={analiticaCard}>
              <span style={analiticaRotulo}>Presença semana</span>
              <strong style={analiticaValorVerde}>
                {percentualPresencaSemana}%
              </strong>
            </div>
          </div>

          <div style={quadroSemanalInfo}>
            <span style={quadroSemanalInfoTexto}>
              Grade semanal com horários fixos e colunas por dia. Cada aluno
              recebe uma cor própria, horários com mais de uma aula são
              destacados como conflito, e agora você também controla presença,
              falta, cancelamento e acompanha métricas mensais.
            </span>
          </div>

          {isMobile ? (
  <div style={carrosselDias}>
    {diasSemana.map((dia) => {
      const aulasDoDia = mapaSemanal[dia.chave] || [];

      return (
        <div key={dia.chave} style={cardDiaMobile}>
          <div style={cardDiaTopoMobile}>
            <h3 style={cardDiaTituloMobile}>{dia.label}</h3>
            <span style={cardDiaQtdMobile}>
              {aulasDoDia.length} {aulasDoDia.length === 1 ? "aula" : "aulas"}
            </span>
          </div>

          {aulasDoDia.length === 0 ? (
            <div style={slotVazioMobile}>Nenhuma aula</div>
          ) : (
            <div style={listaAulasMobile}>
              {aulasDoDia.map((aula) => {
                const cor = getCorAluno(aula.alunoNome);
                const statusVisual = getStatusVisual(
                  (aula.status as AulaStatus) || "pendente"
                );

                return (
                  <div
                    key={aula.id}
                    style={{
                      ...blocoAulaMobile,
                      background: cor.fundo,
                      border: `1px solid ${cor.borda}`,
                      boxShadow: cor.glow,
                    }}
                  >
                    <div style={blocoAulaTopo}>
                      <span style={blocoHora}>{aula.hora || "--:--"}</span>

                      <span
                        style={{
                          ...reposicaoBadge,
                          ...(aula.reposicao === "sim"
                            ? reposicaoSim
                            : reposicaoNao),
                        }}
                      >
                        {aula.reposicao === "sim" ? "Reposição" : "Normal"}
                      </span>
                    </div>

                    <div style={{ ...blocoAluno, color: cor.texto }}>
                      {aula.alunoNome || "Aluno"}
                    </div>

                    <div style={blocoData}>{formatarData(aula.data)}</div>

                    <div
                      style={{
                        ...statusAula,
                        background: statusVisual.background,
                        border: statusVisual.border,
                        color: statusVisual.color,
                      }}
                    >
                      {statusVisual.label}
                    </div>

                    <div style={blocoAcoesStatus}>
                      <button
                        onClick={() => atualizarStatusAula(aula.id, "presente")}
                        style={botaoPresente}
                      >
                        ✔
                      </button>

                      <button
                        onClick={() => atualizarStatusAula(aula.id, "faltou")}
                        style={botaoFalta}
                      >
                        ✖
                      </button>

                      <button
                        onClick={() => atualizarStatusAula(aula.id, "cancelado")}
                        style={botaoCancelado}
                      >
                        ⛔
                      </button>
                    </div>

                    <div style={blocoAcoes}>
                      <button
                        onClick={() => abrirEdicao(aula)}
                        style={botaoMiniEditar}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirAula(aula.id)}
                        style={botaoMiniExcluir}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </div>
) : (
  <div style={gradeWrapper}>
    {/* tabela desktop */}
  </div>
)}
        
<div style={gradeHeader}>
  <div style={celulaHorarioHeader}>Horário</div>

  {diasSemana.map((dia) => {
    const totalDia = (mapaSemanal[dia.chave] || []).length;
    const livres = horariosFixos.length - totalDia;

    return (
      <div key={dia.chave} style={celulaDiaHeader}>
        <div style={diaHeaderTitulo}>{dia.label}</div>
        <div style={diaHeaderSubtitulo}>
          {totalDia} {totalDia === 1 ? "aula" : "aulas"} • {livres} livres
        </div>
      </div>
    );
  })}
</div>

  {horariosFixos.map((horario) => (
    <div key={horario} style={gradeLinha}>
      <div style={celulaHorario}>{horario}</div>

      {diasSemana.map((dia) => {
        const aulasNoBloco = gradeSemanal[dia.chave]?.[horario] || [];
        const conflito = aulasNoBloco.length > 1;

        return (
          <div
            key={`${dia.chave}-${horario}`}
            style={{
              ...celulaAgenda,
              ...(conflito ? celulaAgendaConflito : {}),
            }}
          >
            {aulasNoBloco.length === 0 ? (
              <div style={slotVazio}>
                <span style={slotVazioTexto}>Livre</span>
              </div>
            ) : (
              <>
                {aulasNoBloco.map((aula) => {
                  const cor = getCorAluno(aula.alunoNome);
                  const statusVisual = getStatusVisual(
                    (aula.status as AulaStatus) || "pendente"
                  );

                  return (
                    <div
                      key={aula.id}
                      style={{
                        ...blocoAula,
                        background: cor.fundo,
                        border: `1px solid ${cor.borda}`,
                        boxShadow: cor.glow,
                      }}
                    >
                      <div style={blocoAulaTopo}>
                        <span style={blocoHora}>{aula.hora || horario}</span>

                        <span
                          style={{
                            ...reposicaoBadge,
                            ...(aula.reposicao === "sim"
                              ? reposicaoSim
                              : reposicaoNao),
                          }}
                        >
                          {aula.reposicao === "sim" ? "Reposição" : "Normal"}
                        </span>
                      </div>

                      <div style={{ ...blocoAluno, color: cor.texto }}>
                        {aula.alunoNome || "Aluno"}
                      </div>

                      <div style={blocoData}>{formatarData(aula.data)}</div>

                      <div
                        style={{
                          ...statusAula,
                          background: statusVisual.background,
                          border: statusVisual.border,
                          color: statusVisual.color,
                        }}
                      >
                        {statusVisual.label}
                      </div>

                      <div style={blocoAcoesStatus}>
                        <button
                          onClick={() => atualizarStatusAula(aula.id, "presente")}
                          style={botaoPresente}
                          title="Marcar presença"
                        >
                          ✔
                        </button>

                        <button
                          onClick={() => atualizarStatusAula(aula.id, "faltou")}
                          style={botaoFalta}
                          title="Marcar falta"
                        >
                          ✖
                        </button>

                        <button
                          onClick={() => atualizarStatusAula(aula.id, "cancelado")}
                          style={botaoCancelado}
                          title="Marcar cancelado"
                        >
                          ⛔
                        </button>
                      </div>

                      <div style={blocoAcoes}>
                        <button
                          onClick={() => abrirEdicao(aula)}
                          style={botaoMiniEditar}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirAula(aula.id)}
                          style={botaoMiniExcluir}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}

                {conflito && (
                  <div style={alertaConflito}>Conflito de horário</div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  ))}
</div>
          <div ref={editorRef} style={editorCard}>
            <div style={cardHeader}>
              <div>
                <p style={cardMini}>Atualização da agenda</p>
                <h2 style={cardTitulo}>Editar aula</h2>
              </div>
            </div>

            <div style={formGrid}>
              <div style={campo}>
                <label style={label}>Aluno</label>
                <select
                  value={editAlunoNome}
                  onChange={(e) => setEditAlunoNome(e.target.value)}
                  style={select}
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.nome}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={campo}>
                <label style={label}>Data</label>
                <input
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  style={input}
                />
              </div>

              <div style={campo}>
                <label style={label}>Hora</label>
                <input
                  type="time"
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  style={input}
                />
              </div>

              <div style={campo}>
                <label style={label}>Foi reposição?</label>
                <select
                  value={editReposicao}
                  onChange={(e) => setEditReposicao(e.target.value)}
                  style={select}
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>

              <div style={campo}>
                <label style={label}>Status da aula</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AulaStatus)}
                  style={select}
                >
                  <option value="pendente">Pendente</option>
                  <option value="presente">Presente</option>
                  <option value="faltou">Faltou</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div style={acoesEdicao}>
              <button onClick={cancelarEdicao} style={botaoCancelar}>
                Cancelar
              </button>

              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                style={botaoSalvarEdicao}
              >
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        

        <div style={resumoPorAlunoCard}>
          <div style={cardHeader}>
            <div>
              <p style={cardMini}>Performance mensal</p>
              <h2 style={cardTitulo}>Resumo por aluno no mês</h2>
            </div>
          </div>

          {resumoMensalPorAluno.length === 0 ? (
            <div style={vazioBox}>
              <p style={vazioTexto}>
                Nenhuma aula encontrada no mês atual para gerar resumo por aluno.
              </p>
            </div>
          ) : (
            <div style={listaResumoAluno}>
              {resumoMensalPorAluno.map((item) => {
                const cor = getCorAluno(item.alunoNome);

                return (
                  <div
                    key={item.alunoNome}
                    style={{
                      ...resumoAlunoItem,
                      border: `1px solid ${cor.borda}`,
                      boxShadow: cor.glow,
                    }}
                  >
                    <div style={resumoAlunoTopo}>
                      <h3 style={{ ...resumoAlunoNome, color: cor.texto }}>
                        {item.alunoNome}
                      </h3>

                      <div style={resumoAlunoBadge}>
                        {item.total} {item.total === 1 ? "aula" : "aulas"}
                      </div>
                    </div>

                    <div style={resumoAlunoGrid}>
                      <div style={resumoAlunoInfoBox}>
                        <p style={resumoAlunoInfoLabel}>Presenças</p>
                        <p style={resumoAlunoInfoValorVerde}>{item.presencas}</p>
                      </div>

                      <div style={resumoAlunoInfoBox}>
                        <p style={resumoAlunoInfoLabel}>Faltas</p>
                        <p style={resumoAlunoInfoValorVermelho}>{item.faltas}</p>
                      </div>

                      <div style={resumoAlunoInfoBox}>
                        <p style={resumoAlunoInfoLabel}>Canceladas</p>
                        <p style={resumoAlunoInfoValorAmarelo}>
                          {item.canceladas}
                        </p>
                      </div>

                      <div style={resumoAlunoInfoBox}>
                        <p style={resumoAlunoInfoLabel}>Reposições</p>
                        <p style={resumoAlunoInfoValorAzul}>{item.reposicoes}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={listaCard}>
          <div style={cardHeader}>
            <div>
              <p style={cardMini}>Agenda registrada</p>
              <h2 style={cardTitulo}>Aulas cadastradas</h2>
            </div>
          </div>

          {carregando ? (
            <div style={vazioBox}>
              <p style={vazioTexto}>Carregando aulas...</p>
            </div>
          ) : aulasFiltradasBase.length === 0 ? (
            <div style={vazioBox}>
              <p style={vazioTexto}>
                Nenhuma aula encontrada para os filtros atuais.
              </p>
            </div>
          ) : (
            <div style={lista}>
              {aulasFiltradasBase.map((aula) => {
                const cor = getCorAluno(aula.alunoNome);
                const statusVisual = getStatusVisual(
                  (aula.status as AulaStatus) || "pendente"
                );

                return (
                  <div
                    key={aula.id}
                    style={{
                      ...itemAula,
                      border: `1px solid ${cor.borda}`,
                      boxShadow: cor.glow,
                    }}
                  >
                    <div>
                      <h3 style={{ ...itemNome, color: cor.texto }}>
                        {aula.alunoNome || "Aluno"}
                      </h3>
                      <p style={itemData}>
                        {formatarData(aula.data)} às {aula.hora || "--:--"}
                      </p>

                      <div
                        style={{
                          ...statusAula,
                          marginTop: "10px",
                          background: statusVisual.background,
                          border: statusVisual.border,
                          color: statusVisual.color,
                        }}
                      >
                        {statusVisual.label}
                      </div>
                    </div>

                    <div style={itemAulaDireita}>
                      <div
                        style={{
                          ...badgeReposicao,
                          ...(aula.reposicao === "sim" ? badgeSim : badgeNao),
                        }}
                      >
                        Reposição: {aula.reposicao === "sim" ? "Sim" : "Não"}
                      </div>

                      <div style={itemListaAcoes}>
                        <button
                          onClick={() => atualizarStatusAula(aula.id, "presente")}
                          style={botaoPresente}
                          title="Presente"
                        >
                          ✔
                        </button>

                        <button
                          onClick={() => atualizarStatusAula(aula.id, "faltou")}
                          style={botaoFalta}
                          title="Faltou"
                        >
                          ✖
                        </button>

                        <button
                          onClick={() => atualizarStatusAula(aula.id, "cancelado")}
                          style={botaoCancelado}
                          title="Cancelado"
                        >
                          ⛔
                        </button>

                        <button
                          onClick={() => abrirEdicao(aula)}
                          style={botaoMiniEditar}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirAula(aula.id)}
                          style={botaoMiniExcluir}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getInicioDaSemana(data: Date) {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getFimDaSemanaPorInicio(inicioISO: string) {
  return addDiasEmISO(inicioISO, 6);
}

function addDiasEmISO(dataISO: string, dias: number) {
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
}

function getChaveDiaSemana(dataISO: string) {
  const data = new Date(`${dataISO}T12:00:00`);
  const dia = data.getDay();

  if (dia === 1) return "segunda";
  if (dia === 2) return "terca";
  if (dia === 3) return "quarta";
  if (dia === 4) return "quinta";
  if (dia === 5) return "sexta";
  if (dia === 6) return "sabado";
  return "domingo";
}

function formatarData(dataISO?: string) {
  if (!dataISO) return "--/--/----";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarHoraParaGrade(hora?: string) {
  if (!hora) return "";
  const [h] = hora.split(":");
  return `${h.padStart(2, "0")}:00`;
}

function getCorAluno(nome?: string) {
  if (!nome) return coresAluno[0];
  let soma = 0;
  for (let i = 0; i < nome.length; i += 1) {
    soma += nome.charCodeAt(i);
  }
  return coresAluno[soma % coresAluno.length];
}

function getStatusVisual(status: AulaStatus) {
  if (status === "presente") {
    return {
      label: "Presente",
      background: "rgba(34,197,94,0.14)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#86efac",
    };
  }

  if (status === "faltou") {
    return {
      label: "Faltou",
      background: "rgba(239,68,68,0.14)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#fca5a5",
    };
  }

  if (status === "cancelado") {
    return {
      label: "Cancelado",
      background: "rgba(250,204,21,0.14)",
      border: "1px solid rgba(250,204,21,0.22)",
      color: "#fde68a",
    };
  }

  return {
    label: "Pendente",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
  };
}

function primeiraMaiuscula(texto: string) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
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

const heroResumoValorAzul = {
  margin: "12px 0",
  fontSize: "42px",
  fontWeight: 900,
  color: "#60a5fa",
};

const heroResumoValorVerde = {
  margin: "12px 0",
  fontSize: "42px",
  fontWeight: 900,
  color: "#4ade80",
};

const heroResumoTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "15px",
  lineHeight: 1.7,
};

const blocoPrincipal = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "22px",
};

const buscaCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "24px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const buscaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "18px",
};

const buscaLinha = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginBottom: "14px",
};

const inputBusca = {
  flex: 1,
  minWidth: "240px",
  height: "56px",
  padding: "0 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.62)",
  color: "#ffffff",
  fontSize: "15px",
  outline: "none",
};

const botaoAplicarBusca = {
  height: "56px",
  padding: "0 18px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoLimparBusca = {
  height: "44px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid rgba(250,204,21,0.24)",
  background: "rgba(250,204,21,0.12)",
  color: "#fde68a",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
};

const filtrosRapidos = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginBottom: "12px",
};

const botaoFiltroRapido = {
  height: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const botaoFiltroRapidoAtivo = {
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.20)",
  color: "#86efac",
};

const buscaTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
};

const formCard = {
  position: "relative" as const,
  overflow: "hidden" as const,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const modoCadastroWrap = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginBottom: "18px",
  position: "relative" as const,
  zIndex: 1,
};

const modoCadastroBotao = {
  height: "42px",
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const modoCadastroBotaoAtivo = {
  background: "rgba(59,130,246,0.16)",
  border: "1px solid rgba(59,130,246,0.22)",
  color: "#93c5fd",
};

const recorrenciaCard = {
  position: "relative" as const,
  zIndex: 1,
  marginBottom: "18px",
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const recorrenciaTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap" as const,
  marginBottom: "16px",
};

const recorrenciaMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.7px",
};

const recorrenciaTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 900,
};

const quantidadeSemanasBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  minWidth: "140px",
};

const quantidadeSemanasLabel = {
  color: "rgba(255,255,255,0.70)",
  fontSize: "13px",
  fontWeight: 700,
};

const selectSemanas = {
  width: "100%",
  height: "44px",
  padding: "0 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.62)",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
};

const diasSemanaCheckboxGrid = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const diaSemanaChip = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const diaSemanaChipAtivo = {
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.22)",
  color: "#86efac",
};

const quadroSemanalCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const editorCard = {
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(255,255,255,0.035))",
  border: "1px solid rgba(34,197,94,0.18)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const listaCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const resumoMensalCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const resumoPorAlunoCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const cardGlow = {
  position: "absolute" as const,
  top: "-30px",
  right: "-20px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.10)",
  filter: "blur(36px)",
};

const cardHeader = {
  position: "relative" as const,
  zIndex: 1,
  marginBottom: "22px",
};

const cardHeaderPlanilha = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "22px",
  flexWrap: "wrap" as const,
};

const cardMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const cardTitulo = {
  margin: "8px 0 0 0",
  fontSize: "38px",
  fontWeight: 900,
  color: "#ffffff",
};

const formGrid = {
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

const acoes = {
  position: "relative" as const,
  zIndex: 1,
  marginTop: "24px",
};

const botaoPrincipal = {
  width: "100%",
  height: "60px",
  borderRadius: "18px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 18px 34px rgba(34,197,94,0.28)",
};

const acoesSemana = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const botaoSemanaSecundario = {
  height: "44px",
  padding: "0 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
};

const botaoSemanaAtual = {
  height: "44px",
  padding: "0 16px",
  borderRadius: "14px",
  border: "1px solid rgba(34,197,94,0.20)",
  background: "rgba(34,197,94,0.12)",
  color: "#86efac",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
};

const barraPeriodo = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "16px",
  alignItems: "center",
  marginBottom: "18px",
};

const periodoBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
};

const periodoLabel = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
};

const periodoValor = {
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: 800,
};

const periodoResumoBox = {
  padding: "12px 16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const periodoResumoLabel = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "13px",
};

const periodoResumoValor = {
  color: "#4ade80",
  fontSize: "20px",
  fontWeight: 900,
};

const faixaAnalitica = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const faixaMensal = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "14px",
};

const analiticaCard = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const analiticaRotulo = {
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
};

const analiticaValorVermelho = {
  color: "#fca5a5",
  fontSize: "28px",
  fontWeight: 900,
};

const analiticaValorAzul = {
  color: "#93c5fd",
  fontSize: "28px",
  fontWeight: 900,
};

const analiticaValorVerde = {
  color: "#86efac",
  fontSize: "28px",
  fontWeight: 900,
};

const analiticaValorAmarelo = {
  color: "#fde68a",
  fontSize: "28px",
  fontWeight: 900,
};

const analiticaValorRoxo = {
  color: "#d8b4fe",
  fontSize: "28px",
  fontWeight: 900,
};

const quadroSemanalInfo = {
  marginBottom: "20px",
};

const quadroSemanalInfoTexto = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "15px",
  lineHeight: 1.7,
};

const mobileContainer = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
};

const carrosselDias = {
  display: "flex",
  gap: "12px",
  overflowX: "auto" as const,
  scrollSnapType: "x mandatory" as const,
  WebkitOverflowScrolling: "touch" as const,
  paddingBottom: "8px",
};

const cardDiaMobile = {
  minWidth: "100%",
  maxWidth: "100%",
  scrollSnapAlign: "start" as const,
  borderRadius: "20px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "14px",
  boxSizing: "border-box" as const,
};

const cardDiaTopoMobile = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const cardDiaTituloMobile = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
  color: "#ffffff",
};

const cardDiaQtdMobile = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.18)",
  color: "#93c5fd",
  fontSize: "12px",
  fontWeight: 800,
};

const listaAulasMobile = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const blocoAulaMobile = {
  borderRadius: "16px",
  padding: "10px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
};

const slotVazioMobile = {
  borderRadius: "14px",
  border: "1px dashed rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  padding: "18px 12px",
  textAlign: "center" as const,
  color: "rgba(255,255,255,0.48)",
  fontSize: "13px",
  fontWeight: 700,
};

const gradeWrapper = {
  width: "100%",
  overflowX: "auto" as const,
  overflowY: "hidden" as const,
  WebkitOverflowScrolling: "touch" as const,
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
};

const gradeHeader = {
  display: "grid",
  minWidth: "980px",
  gridTemplateColumns: "60px repeat(7, minmax(120px, 1fr))",
  background: "rgba(255,255,255,0.04)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const celulaHorarioHeader = {
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  fontSize: "12px",
  fontWeight: 900,
  color: "rgba(255,255,255,0.72)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
};

const celulaDiaHeader = {
  minHeight: "58px",
  padding: "8px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  gap: "4px",
  borderRight: "1px solid rgba(255,255,255,0.08)",
};

const diaHeaderTitulo = {
  fontSize: "12px",
  fontWeight: 900,
  color: "#ffffff",
};

const diaHeaderSubtitulo = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.58)",
  fontWeight: 700,
};

const gradeLinha = {
  display: "grid",
  minWidth: "980px",
  gridTemplateColumns: "60px repeat(7, minmax(120px, 1fr))",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const celulaHorario = {
  minHeight: "60px", // 🔥 menor
  padding: "6px 4px", // 🔥 menor
  display: "flex",
  alignItems: "center", // 🔥 centralizado
  justifyContent: "center",
  fontSize: "10px", // 🔥 menor
  fontWeight: 800,
  color: "#93c5fd",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
};

const celulaAgenda = {
  minHeight: "60px",
  padding: "4px",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  position: "relative" as const,
};

const celulaAgendaConflito = {
  background: "rgba(239,68,68,0.04)",
};

const slotVazio = {
  flex: 1,
  borderRadius: "10px",
  border: "1px dashed rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.015)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const slotVazioTexto = {
  color: "rgba(255,255,255,0.34)",
  fontSize: "10px",
  fontWeight: 700,
};

const blocoAula = {
  borderRadius: "12px",
  padding: "6px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
};

const blocoAulaTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "6px",
};

const blocoHora = {
  padding: "4px 8px",
  borderRadius: "999px",
  background: "rgba(96,165,250,0.14)",
  border: "1px solid rgba(96,165,250,0.18)",
  color: "#93c5fd",
  fontSize: "10px",
  fontWeight: 800,
};

const reposicaoBadge = {
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 800,
  whiteSpace: "nowrap" as const,
};

const reposicaoSim = {
  background: "rgba(250,204,21,0.12)",
  border: "1px solid rgba(250,204,21,0.18)",
  color: "#fde68a",
};

const reposicaoNao = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
};

const blocoAluno = {
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.25,
};

const blocoData = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.58)",
};

const statusAula = {
  fontSize: "10px",
  fontWeight: 800,
  padding: "4px 7px",
  borderRadius: "9px",
  width: "fit-content",
};

const blocoAcoesStatus = {
  display: "flex",
  gap: "6px",
};

const blocoAcoes = {
  display: "flex",
  gap: "6px",
};

const alertaConflito = {
  marginTop: "2px",
  padding: "6px 8px",
  borderRadius: "10px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#fca5a5",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center" as const,
};

const botaoPresente = {
  flex: 1,
  height: "30px",
  borderRadius: "10px",
  border: "1px solid rgba(34,197,94,0.25)",
  background: "rgba(34,197,94,0.15)",
  color: "#4ade80",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoFalta = {
  flex: 1,
  height: "30px",
  borderRadius: "10px",
  border: "1px solid rgba(239,68,68,0.25)",
  background: "rgba(239,68,68,0.15)",
  color: "#f87171",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoCancelado = {
  flex: 1,
  height: "30px",
  borderRadius: "10px",
  border: "1px solid rgba(250,204,21,0.25)",
  background: "rgba(250,204,21,0.15)",
  color: "#fde68a",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoMiniEditar = {
  flex: 1,
  height: "30px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
};

const botaoMiniExcluir = {
  flex: 1,
  height: "30px",
  borderRadius: "10px",
  border: "1px solid rgba(239,68,68,0.18)",
  background: "rgba(239,68,68,0.12)",
  color: "#fca5a5",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
};

const acoesEdicao = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
};

const botaoCancelar = {
  flex: 1,
  height: "56px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
};

const botaoSalvarEdicao = {
  flex: 1,
  height: "56px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 18px 34px rgba(34,197,94,0.24)",
};

const vazioBox = {
  padding: "20px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const vazioTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.74)",
  fontSize: "15px",
};

const lista = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const itemAula = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.045)",
};

const itemNome = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
};

const itemData = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: "15px",
};

const itemAulaDireita = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end" as const,
};

const itemListaAcoes = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const badgeReposicao = {
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap" as const,
};

const badgeSim = {
  background: "rgba(250,204,21,0.12)",
  border: "1px solid rgba(250,204,21,0.18)",
  color: "#fde68a",
};

const badgeNao = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
};

const listaResumoAluno = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const resumoAlunoItem = {
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.045)",
};

const resumoAlunoTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginBottom: "14px",
};

const resumoAlunoNome = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 900,
};

const resumoAlunoBadge = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
};

const resumoAlunoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
};

const resumoAlunoInfoBox = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const resumoAlunoInfoLabel = {
  margin: 0,
  color: "rgba(255,255,255,0.60)",
  fontSize: "12px",
};

const resumoAlunoInfoValorVerde = {
  margin: "8px 0 0 0",
  color: "#86efac",
  fontSize: "20px",
  fontWeight: 900,
};

const resumoAlunoInfoValorVermelho = {
  margin: "8px 0 0 0",
  color: "#fca5a5",
  fontSize: "20px",
  fontWeight: 900,
};

const resumoAlunoInfoValorAmarelo = {
  margin: "8px 0 0 0",
  color: "#fde68a",
  fontSize: "20px",
  fontWeight: 900,
};

const resumoAlunoInfoValorAzul = {
  margin: "8px 0 0 0",
  color: "#93c5fd",
  fontSize: "20px",
  fontWeight: 900,
};