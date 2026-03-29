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

// --- DEFINIÇÕES DE TIPOS ---
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

// --- CONSTANTES E CONFIGURAÇÕES ---
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
  "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const coresAluno = [
  { fundo: "rgba(34,197,94,0.12)", borda: "rgba(34,197,94,0.20)", texto: "#86efac", glow: "0 0 18px rgba(34,197,94,0.10)" },
  { fundo: "rgba(59,130,246,0.12)", borda: "rgba(59,130,246,0.20)", texto: "#93c5fd", glow: "0 0 18px rgba(59,130,246,0.10)" },
  { fundo: "rgba(168,85,247,0.12)", borda: "rgba(168,85,247,0.20)", texto: "#d8b4fe", glow: "0 0 18px rgba(168,85,247,0.10)" },
  { fundo: "rgba(250,204,21,0.12)", borda: "rgba(250,204,21,0.20)", texto: "#fde68a", glow: "0 0 18px rgba(250,204,21,0.10)" },
  { fundo: "rgba(236,72,153,0.12)", borda: "rgba(236,72,153,0.20)", texto: "#f9a8d4", glow: "0 0 18px rgba(236,72,153,0.10)" },
  { fundo: "rgba(14,165,233,0.12)", borda: "rgba(14,165,233,0.20)", texto: "#7dd3fc", glow: "0 0 18px rgba(14,165,233,0.10)" },
];

export default function AgendaPage() {
  // Estados de Interface
  const [isMobile, setIsMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  
  // Estados de Dados
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  
  // Estados de Formulário (Cadastro)
  const [alunoNome, setAlunoNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");
  const [modoCadastro, setModoCadastro] = useState<"manual" | "automatico">("manual");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  // Estados de Filtro e Navegação
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroAluno, setFiltroAluno] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | AulaStatus | "reposicao" | "hoje">("todos");
  const [inicioSemanaSelecionada, setInicioSemanaSelecionada] = useState(getInicioDaSemana(new Date()));

  // Estados de Edição
  const [editandoId, setEditandoId] = useState("");
  const [editAlunoNome, setEditAlunoNome] = useState("");
  const [editData, setEditData] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editReposicao, setEditReposicao] = useState("nao");
  const [editStatus, setEditStatus] = useState<AulaStatus>("pendente");

  const editorRef = useRef<HTMLDivElement | null>(null);

  // Efeito para Responsividade
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Carregamento de Dados do Firebase
  const carregarDados = async () => {
    try {
      setCarregando(true);
      const user = auth.currentUser;
      if (!user) return;

      const qAlunos = query(collection(db, "students"), where("userId", "==", user.uid));
      const qAgenda = query(collection(db, "agenda"), where("userId", "==", user.uid), orderBy("data", "desc"));

      const [snapAlunos, snapAgenda] = await Promise.all([getDocs(qAlunos), getDocs(qAgenda)]);

      setAlunos(snapAlunos.docs.map(d => ({ id: d.id, ...d.data() })) as Aluno[]);
      setAulas(snapAgenda.docs.map(d => ({ id: d.id, ...d.data() })) as Aula[]);
    } catch (error) {
      console.error("Erro Firestore:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  // Lógica de Cadastro de Aula Única
  const cadastrarAula = async () => {
    if (!alunoNome || !data || !hora) return alert("Preencha Aluno, Data e Hora.");
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "agenda"), {
        alunoNome,
        data,
        hora,
        reposicao,
        status: "pendente",
        userId: user.uid,
        criadoEm: serverTimestamp()
      });

      limparCampos();
      await carregarDados();
      alert("Aula agendada com sucesso!");
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  // Lógica de Cadastro de Recorrência (Melhorada para Profissionais)
  const cadastrarAulasAutomaticas = async () => {
    if (!alunoNome || !hora || diasSelecionados.length === 0) {
      return alert("Selecione o Aluno, a Hora e ao menos um Dia da Semana.");
    }
    
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return;

      const mapaDias: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
      
      for (let s = 0; s < quantidadeSemanas; s++) {
        for (const diaChave of diasSelecionados) {
          let dataBase = new Date();
          dataBase.setHours(12, 0, 0, 0); // Trava no meio do dia para evitar erro de fuso
          
          const diaAlvo = mapaDias[diaChave];
          const diaAtual = dataBase.getDay();
          const diffSemanas = s * 7;
          const diffDias = (diaAlvo - diaAtual + 7) % 7;
          
          dataBase.setDate(dataBase.getDate() + diffSemanas + diffDias);
          const dataISO = dataBase.toISOString().split("T")[0];

          await addDoc(collection(db, "agenda"), {
            alunoNome,
            data: dataISO,
            hora,
            reposicao,
            status: "pendente",
            userId: user.uid,
            criadoEm: serverTimestamp()
          });
        }
      }

      limparCampos();
      await carregarDados();
      alert("Recorrência mensal gerada com sucesso!");
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const limparCampos = () => {
    setAlunoNome(""); setData(""); setHora(""); setReposicao("nao"); setDiasSelecionados([]); setModoCadastro("manual");
  };

  const atualizarStatus = async (id: string, s: AulaStatus) => {
    try {
      await updateDoc(doc(db, "agenda", id), { status: s });
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const salvarEdicao = async () => {
    if (!editandoId) return;
    try {
      setSalvandoEdicao(true);
      await updateDoc(doc(db, "agenda", editandoId), {
        alunoNome: editAlunoNome, data: editData, hora: editHora, reposicao: editReposicao, status: editStatus
      });
      setEditandoId("");
      await carregarDados();
    } catch (e) { console.error(e); } finally { setSalvandoEdicao(false); }
  };

  const excluirAula = async (id: string) => {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      await deleteDoc(doc(db, "agenda", id));
      await carregarDados();
    }
  };

  // --- MEMOS DE FILTRAGEM ---
  const fimSemanaSelecionada = useMemo(() => addDiasEmISO(inicioSemanaSelecionada, 6), [inicioSemanaSelecionada]);

  const aulasFiltradas = useMemo(() => {
    let result = [...aulas];
    if (filtroAluno) result = result.filter(a => a.alunoNome?.toLowerCase().includes(filtroAluno.toLowerCase()));
    if (filtroStatus === "hoje") result = result.filter(a => a.data === new Date().toISOString().split("T")[0]);
    else if (filtroStatus === "reposicao") result = result.filter(a => a.reposicao === "sim");
    else if (filtroStatus !== "todos") result = result.filter(a => a.status === filtroStatus);
    return result;
  }, [aulas, filtroAluno, filtroStatus]);

  const mapaSemanal = useMemo(() => {
    const estrutura: Record<string, Aula[]> = { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] };
    aulasFiltradas.forEach(a => {
      if (a.data! >= inicioSemanaSelecionada && a.data! <= fimSemanaSelecionada) {
        const d = getChaveDiaSemana(a.data!);
        if (estrutura[d]) estrutura[d].push(a);
      }
    });
    Object.keys(estrutura).forEach(k => estrutura[k].sort((a,b) => a.hora!.localeCompare(b.hora!)));
    return estrutura;
  }, [aulasFiltradas, inicioSemanaSelecionada, fimSemanaSelecionada]);

  // --- RENDERIZAÇÃO ---
  return (
    <div style={estilos.pagina}>
      {/* HEADER */}
      <section style={estilos.hero}>
        <div style={estilos.heroPrincipal}>
          <p style={estilos.eyebrow}>SISTEMA GCM PASSOS - MÓDULO FITNESS</p>
          <h1 style={estilos.titulo}>Agenda de Treinos</h1>
          <p style={estilos.descricao}>Controle profissional de alunos, presenças e recorrências automáticas.</p>
        </div>
      </section>

      {/* ÁREA DE FILTROS */}
      <div style={estilos.buscaCard}>
        <h2 style={estilos.cardTitulo}>Busca Rápida</h2>
        <div style={estilos.buscaLinha}>
          <input style={estilos.inputBusca} placeholder="Buscar aluno..." value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} />
          <button style={estilos.botaoAplicarBusca} onClick={() => setFiltroAluno(buscaAluno)}>Filtrar</button>
        </div>
        <div style={estilos.filtrosRapidos}>
          {["todos", "hoje", "pendente", "presente", "faltou"].map(f => (
            <button key={f} style={{...estilos.botaoFiltroRapido, ...(filtroStatus === f ? estilos.botaoFiltroRapidoAtivo : {})}} onClick={() => setFiltroStatus(f as any)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CADASTRO */}
      <div style={estilos.formCard}>
        <h2 style={estilos.cardTitulo}>Novo Agendamento</h2>
        <div style={estilos.modoCadastroWrap}>
          <button style={{...estilos.modoCadastroBotao, ...(modoCadastro === "manual" ? estilos.modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("manual")}>AULA ÚNICA</button>
          <button style={{...estilos.modoCadastroBotao, ...(modoCadastro === "automatico" ? estilos.modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("automatico")}>RECORRÊNCIA MENSAL</button>
        </div>

        {modoCadastro === "automatico" && (
          <div style={estilos.recorrenciaCard}>
            <p style={estilos.label}>Selecione os dias da semana para repetir:</p>
            <div style={estilos.diasSemanaCheckboxGrid}>
              {diasSemana.map(d => (
                <button key={d.chave} style={{...estilos.diaSemanaChip, ...(diasSelecionados.includes(d.chave) ? estilos.diaSemanaChipAtivo : {})}} 
                  onClick={() => setDiasSelecionados(prev => prev.includes(d.chave) ? prev.filter(x => x !== d.chave) : [...prev, d.chave])}>
                  {d.label}
                </button>
              ))}
            </div>
            <select style={estilos.selectSemanas} value={quantidadeSemanas} onChange={e => setQuantidadeSemanas(Number(e.target.value))}>
              <option value={4}>Repetir por 4 Semanas (1 Mês)</option>
              <option value={8}>Repetir por 8 Semanas (2 Meses)</option>
              <option value={12}>Repetir por 12 Semanas (3 Meses)</option>
            </select>
          </div>
        )}

        <div style={estilos.formGrid}>
          <div style={estilos.campo}><label style={estilos.label}>Aluno</label>
            <select style={estilos.select} value={alunoNome} onChange={e => setAlunoNome(e.target.value)}>
              <option value="">-- Selecionar --</option>
              {alunos.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
            </select>
          </div>
          <div style={estilos.campo}><label style={estilos.label}>Data</label>
            <input type="date" style={estilos.input} value={data} onChange={e => setData(e.target.value)} disabled={modoCadastro === "automatico"} />
          </div>
          <div style={estilos.campo}><label style={estilos.label}>Hora</label><input type="time" style={estilos.input} value={hora} onChange={e => setHora(e.target.value)} /></div>
          <div style={estilos.campo}><label style={estilos.label}>Reposição?</label>
            <select style={estilos.select} value={reposicao} onChange={e => setReposicao(e.target.value)}>
              <option value="nao">Não</option><option value="sim">Sim</option>
            </select>
          </div>
        </div>
        <button style={estilos.botaoPrincipal} onClick={modoCadastro === "manual" ? cadastrarAula : cadastrarAulasAutomaticas}>
          {salvando ? "PROCESSANDO..." : "CONFIRMAR AGENDAMENTO"}
        </button>
      </div>

      {/* GRADE SEMANAL VISUAL */}
      <div style={estilos.quadroSemanalCard}>
        <div style={estilos.cardHeaderPlanilha}>
          <h2 style={estilos.cardTitulo}>Visualização da Semana</h2>
          <div style={estilos.acoesSemana}>
            <button style={estilos.botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, -7))}>ANTERIOR</button>
            <button style={estilos.botaoSemanaAtual} onClick={() => setInicioSemanaSelecionada(getInicioDaSemana(new Date()))}>ATUAL</button>
            <button style={estilos.botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, 7))}>PRÓXIMA</button>
          </div>
        </div>
        <p style={estilos.periodoTexto}>{formatarDataVisual(inicioSemanaSelecionada)} até {formatarDataVisual(fimSemanaSelecionada)}</p>

        <div style={isMobile ? estilos.mobileScroll : estilos.desktopGrade}>
          {diasSemana.map(dia => (
            <div key={dia.chave} style={estilos.colunaDia}>
              <div style={estilos.headerDia}>{dia.label}</div>
              <div style={estilos.listaAulasColuna}>
                {mapaSemanal[dia.chave].length === 0 ? (
                  <div style={estilos.vazio}>Vago</div>
                ) : (
                  mapaSemanal[dia.chave].map(aula => {
                    const cor = getCorAluno(aula.alunoNome);
                    return (
                      <div key={aula.id} style={{...estilos.cardAula, background: cor.fundo, border: `1px solid ${cor.borda}`, boxShadow: cor.glow}}>
                        <div style={estilos.cardAulaTopo}>
                          <span style={estilos.horaBadge}>{aula.hora}</span>
                          {aula.reposicao === "sim" && <span style={estilos.reposicaoBadge}>REP</span>}
                        </div>
                        <div style={{...estilos.nomeAluno, color: cor.texto}}>{aula.alunoNome}</div>
                        <div style={estilos.statusRow}>
                          <button style={estilos.btnStatus} onClick={() => atualizarStatus(aula.id, "presente")}>✔</button>
                          <button style={estilos.btnStatusFalta} onClick={() => atualizarStatus(aula.id, "faltou")}>✖</button>
                          <button style={estilos.btnEdit} onClick={() => { setEditandoId(aula.id); setEditAlunoNome(aula.alunoNome || ""); }}>EDIT</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR MODAL */}
      {editandoId && (
        <div style={estilos.modalOverlay}>
          <div style={estilos.modalContent} ref={editorRef}>
            <h3 style={estilos.cardTitulo}>Ajustar Horário</h3>
            <div style={estilos.formGrid}>
              <input style={estilos.input} value={editAlunoNome} onChange={e => setEditAlunoNome(e.target.value)} />
              <input type="date" style={estilos.input} value={editData} onChange={e => setEditData(e.target.value)} />
              <input type="time" style={estilos.input} value={editHora} onChange={e => setEditHora(e.target.value)} />
            </div>
            <div style={estilos.modalAcoes}>
              <button style={estilos.botaoCancelar} onClick={() => setEditandoId("")}>CANCELAR</button>
              <button style={estilos.botaoSalvarEdicao} onClick={salvarEdicao}>SALVAR</button>
            </div>
            <button style={{...estilos.botaoCancelar, backgroundColor: '#ef4444', marginTop: '10px'}} onClick={() => { excluirAula(editandoId); setEditandoId(""); }}>EXCLUIR AULA</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FUNÇÕES DE APOIO ---
function getInicioDaSemana(d: Date) {
  const date = new Date(d);
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split("T")[0];
}
function addDiasEmISO(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function getChaveDiaSemana(iso: string) {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return dias[new Date(iso + "T12:00:00").getDay()];
}
function formatarDataVisual(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}`;
}
function getCorAluno(nome?: string) {
  if (!nome) return coresAluno[0];
  let sum = 0; for (let i = 0; i < nome.length; i++) sum += nome.charCodeAt(i);
  return coresAluno[sum % coresAluno.length];
}
function primeiraMaiuscula(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }

// --- OBJETOS DE ESTILO (COMPLETO) ---
const estilos = {
  pagina: { display: "flex", flexDirection: "column" as const, gap: "20px", padding: "16px", background: "#0f172a", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },
  hero: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "24px", padding: "30px", border: "1px solid #334155" },
  heroPrincipal: { maxWidth: "600px" },
  eyebrow: { fontSize: "12px", color: "#3b82f6", fontWeight: 800, letterSpacing: "1px" },
  titulo: { fontSize: "36px", fontWeight: 900, margin: "10px 0", color: "#f8fafc" },
  descricao: { color: "#94a3b8", fontSize: "16px", lineHeight: 1.6 },
  buscaCard: { background: "#1e293b", padding: "20px", borderRadius: "20px", border: "1px solid #334155" },
  cardTitulo: { fontSize: "18px", fontWeight: 800, marginBottom: "15px", color: "#e2e8f0" },
  buscaLinha: { display: "flex", gap: "10px", marginBottom: "15px" },
  inputBusca: { flex: 1, background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "12px", borderRadius: "12px" },
  botaoAplicarBusca: { background: "#3b82f6", border: "none", color: "#fff", padding: "0 20px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" },
  filtrosRapidos: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  botaoFiltroRapido: { background: "#334155", border: "none", color: "#94a3b8", padding: "8px 16px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, cursor: "pointer" },
  botaoFiltroRapidoAtivo: { background: "#3b82f6", color: "#fff" },
  formCard: { background: "#1e293b", padding: "24px", borderRadius: "24px", border: "1px solid #334155" },
  modoCadastroWrap: { display: "flex", gap: "10px", marginBottom: "20px" },
  modoCadastroBotao: { flex: 1, padding: "12px", borderRadius: "12px", background: "#334155", color: "#64748b", border: "none", fontWeight: 800, cursor: "pointer" },
  modoCadastroBotaoAtivo: { background: "#3b82f6", color: "#fff" },
  recorrenciaCard: { background: "rgba(59, 130, 246, 0.05)", padding: "15px", borderRadius: "15px", marginBottom: "20px", border: "1px solid #1d4ed8" },
  diasSemanaCheckboxGrid: { display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "12px" },
  diaSemanaChip: { padding: "6px 12px", borderRadius: "10px", background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", fontSize: "11px", cursor: "pointer" },
  diaSemanaChipAtivo: { background: "#22c55e", color: "#fff", borderColor: "#4ade80" },
  selectSemanas: { width: "100%", background: "#0f172a", color: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid #334155" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
  campo: { display: "flex", flexDirection: "column" as const, gap: "5px" },
  label: { fontSize: "12px", color: "#64748b", fontWeight: 700 },
  input: { background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "12px", borderRadius: "12px" },
  select: { background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "12px", borderRadius: "12px" },
  botaoPrincipal: { width: "100%", background: "linear-gradient(to right, #22c55e, #16a34a)", padding: "16px", borderRadius: "12px", border: "none", color: "#fff", fontWeight: 900, fontSize: "15px", cursor: "pointer" },
  quadroSemanalCard: { background: "#1e293b", padding: "24px", borderRadius: "24px", border: "1px solid #334155" },
  cardHeaderPlanilha: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "10px" },
  acoesSemana: { display: "flex", gap: "8px" },
  botaoSemanaSecundario: { background: "#334155", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", cursor: "pointer" },
  botaoSemanaAtual: { background: "#3b82f6", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" },
  periodoTexto: { color: "#64748b", fontSize: "13px", margin: "10px 0 20px 0", textAlign: "center" as const, fontWeight: 700 },
  desktopGrade: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" },
  mobileScroll: { display: "flex", overflowX: "auto" as const, gap: "12px", paddingBottom: "10px" },
  colunaDia: { minWidth: "220px", background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "12px" },
  headerDia: { textAlign: "center" as const, fontWeight: 900, padding: "12px", borderBottom: "1px solid #334155", marginBottom: "12px", color: "#3b82f6", fontSize: "14px" },
  listaAulasColuna: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  cardAula: { padding: "14px", borderRadius: "16px", position: "relative" as const },
  cardAulaTopo: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  horaBadge: { background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 900, color: "#fff" },
  reposicaoBadge: { background: "#eab308", color: "#000", padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: 900 },
  nomeAluno: { fontSize: "16px", fontWeight: 900, marginBottom: "12px" },
  statusRow: { display: "flex", gap: "6px" },
  btnStatus: { flex: 1, background: "#22c55e", border: "none", color: "#fff", borderRadius: "10px", padding: "8px", cursor: "pointer" },
  btnStatusFalta: { flex: 1, background: "#ef4444", border: "none", color: "#fff", borderRadius: "10px", padding: "8px", cursor: "pointer" },
  btnEdit: { flex: 1, background: "#334155", border: "none", color: "#fff", borderRadius: "10px", padding: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" },
  vazio: { textAlign: "center" as const, padding: "30px", color: "#475569", fontSize: "12px", fontStyle: "italic" },
  modalOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#1e293b", padding: "30px", borderRadius: "24px", width: "90%", maxWidth: "450px", border: "1px solid #334155" },
  modalAcoes: { display: "flex", gap: "10px", marginTop: "20px" },
  botaoCancelar: { flex: 1, padding: "14px", borderRadius: "12px", background: "#334155", color: "#fff", border: "none", cursor: "pointer" },
  botaoSalvarEdicao: { flex: 1, padding: "14px", borderRadius: "12px", background: "#22c55e", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }
};