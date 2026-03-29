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

// --- CONSTANTES ---
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
  const [isMobile, setIsMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  
  const [alunoNome, setAlunoNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");
  const [modoCadastro, setModoCadastro] = useState<"manual" | "automatico">("manual");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  const [inicioSemanaSelecionada, setInicioSemanaSelecionada] = useState(getInicioDaSemana(new Date()));
  const [editandoId, setEditandoId] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Efeito de Responsividade
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Carregar Alunos e Agenda
  const carregarDados = async () => {
    try {
      setCarregando(true);
      const user = auth.currentUser;
      if (!user) return;

      // Buscar Coleção de Alunos
      const snapAlunos = await getDocs(query(collection(db, "students"), where("userId", "==", user.uid)));
      const listaAlunos = snapAlunos.docs.map(d => ({ id: d.id, ...d.data() })) as Aluno[];
      setAlunos(listaAlunos);

      // Buscar Coleção de Agenda
      const snapAgenda = await getDocs(query(collection(db, "agenda"), where("userId", "==", user.uid), orderBy("data", "desc")));
      const listaAgenda = snapAgenda.docs.map(d => ({ id: d.id, ...d.data() })) as Aula[];
      setAulas(listaAgenda);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) carregarDados();
    });
    return () => unsubscribe();
  }, []);

  // Cadastro de Aula Única
  const cadastrarAula = async () => {
    if (!alunoNome || !data || !hora) return alert("Por favor, selecione o Aluno, a Data e o Horário.");
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

      limparFormulario();
      await carregarDados();
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  // Cadastro de Recorrência Profissional
  const cadastrarAulasAutomaticas = async () => {
    if (!alunoNome || !hora || diasSelecionados.length === 0) {
      return alert("Dados incompletos: Selecione aluno, hora e dias da semana.");
    }
    
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return;

      const mapaDias: Record<string, number> = { 
        domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 
      };
      
      for (let s = 0; s < quantidadeSemanas; s++) {
        for (const diaChave of diasSelecionados) {
          let dBase = new Date();
          dBase.setHours(12, 0, 0, 0); // Fixa meio-dia para evitar erro de fuso horário
          
          const diaAlvo = mapaDias[diaChave];
          const diaAtual = dBase.getDay();
          const diffSemanas = s * 7;
          const diffDias = (diaAlvo - diaAtual + 7) % 7;
          
          dBase.setDate(dBase.getDate() + diffSemanas + diffDias);
          const dataISO = dBase.toISOString().split("T")[0];

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

      limparFormulario();
      await carregarDados();
      alert("Aulas recorrentes geradas com sucesso!");
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const limparFormulario = () => {
    setAlunoNome(""); setData(""); setHora(""); setReposicao("nao"); setDiasSelecionados([]); setModoCadastro("manual");
  };

  const atualizarStatus = async (id: string, s: AulaStatus) => {
    try {
      await updateDoc(doc(db, "agenda", id), { status: s });
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const excluirAula = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este horário da agenda?")) {
      try {
        await deleteDoc(doc(db, "agenda", id));
        await carregarDados();
      } catch (e) { console.error(e); }
    }
  };

  const fimSemanaSelecionada = useMemo(() => addDiasEmISO(inicioSemanaSelecionada, 6), [inicioSemanaSelecionada]);

  // Mapa da Agenda para Visualização em Colunas
  const mapaSemanal = useMemo(() => {
    const estrutura: Record<string, Aula[]> = { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] };
    aulas.forEach(a => {
      if (a.data! >= inicioSemanaSelecionada && a.data! <= fimSemanaSelecionada) {
        const d = getChaveDiaSemana(a.data!);
        if (estrutura[d]) estrutura[d].push(a);
      }
    });
    Object.keys(estrutura).forEach(k => estrutura[k].sort((a,b) => a.hora!.localeCompare(b.hora!)));
    return estrutura;
  }, [aulas, inicioSemanaSelecionada, fimSemanaSelecionada]);

  return (
    <div style={estilos.pagina}>
      {/* HEADER DE BOAS-VINDAS */}
      <header style={estilos.hero}>
        <div style={estilos.heroPrincipal}>
          <p style={estilos.eyebrow}>TRAINER FLOW - CONSULTORIA ONLINE</p>
          <h1 style={estilos.titulo}>Agenda de Treinos</h1>
          <p style={estilos.descricao}>Gestão inteligente de horários, presenças e faturamento.</p>
        </div>
      </header>

      {/* PAINEL DE CADASTRO */}
      <section style={estilos.formCard}>
        <h2 style={estilos.cardTitulo}>Cadastrar Agendamento</h2>
        <div style={estilos.modoCadastroWrap}>
          <button style={{...estilos.modoCadastroBotao, ...(modoCadastro === "manual" ? estilos.modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("manual")}>AULA ÚNICA</button>
          <button style={{...estilos.modoCadastroBotao, ...(modoCadastro === "automatico" ? estilos.modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("automatico")}>RECORRÊNCIA MENSAL</button>
        </div>

        {modoCadastro === "automatico" && (
          <div style={estilos.recorrenciaCard}>
            <p style={estilos.label}>Selecione os dias da semana do plano:</p>
            <div style={estilos.diasSemanaCheckboxGrid}>
              {diasSemana.map(d => (
                <button key={d.chave} style={{...estilos.diaSemanaChip, ...(diasSelecionados.includes(d.chave) ? estilos.diaSemanaChipAtivo : {})}} 
                  onClick={() => setDiasSelecionados(prev => prev.includes(d.chave) ? prev.filter(x => x !== d.chave) : [...prev, d.chave])}>
                  {d.label}
                </button>
              ))}
            </div>
            <select style={estilos.selectSemanas} value={quantidadeSemanas} onChange={e => setQuantidadeSemanas(Number(e.target.value))}>
              <option value={4}>Plano Mensal (4 Semanas)</option>
              <option value={8}>Plano Bimestral (8 Semanas)</option>
              <option value={12}>Plano Trimestral (12 Semanas)</option>
            </select>
          </div>
        )}

        <div style={estilos.formGrid}>
          <div style={estilos.campo}><label style={estilos.label}>Aluno</label>
            <select style={estilos.select} value={alunoNome} onChange={e => setAlunoNome(e.target.value)}>
              <option value="">-- Selecionar Aluno --</option>
              {alunos.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
            </select>
          </div>
          <div style={estilos.campo}><label style={estilos.label}>Data</label>
            <input type="date" style={estilos.input} value={data} onChange={e => setData(e.target.value)} disabled={modoCadastro === "automatico"} />
          </div>
          <div style={estilos.campo}><label style={estilos.label}>Horário</label><input type="time" style={estilos.input} value={hora} onChange={e => setHora(e.target.value)} /></div>
          <div style={estilos.campo}><label style={estilos.label}>Reposição?</label>
            <select style={estilos.select} value={reposicao} onChange={e => setReposicao(e.target.value)}>
              <option value="nao">Não</option><option value="sim">Sim</option>
            </select>
          </div>
        </div>
        <button style={estilos.botaoPrincipal} onClick={modoCadastro === "manual" ? cadastrarAula : cadastrarAulasAutomaticas}>
          {salvando ? "PROCESSANDO..." : "SALVAR AGENDAMENTO"}
        </button>
      </section>

      {/* VISUALIZAÇÃO DA AGENDA SEMANAL */}
      <section style={estilos.quadroSemanalCard}>
        <div style={estilos.cardHeaderPlanilha}>
          <h2 style={estilos.cardTitulo}>Grade da Semana</h2>
          <div style={estilos.acoesSemana}>
            <button style={estilos.botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, -7))}>Anterior</button>
            <button style={estilos.botaoSemanaAtual} onClick={() => setInicioSemanaSelecionada(getInicioDaSemana(new Date()))}>Atual</button>
            <button style={estilos.botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, 7))}>Próxima</button>
          </div>
        </div>

        <div style={isMobile ? estilos.mobileScroll : estilos.desktopGrade}>
          {diasSemana.map(dia => (
            <div key={dia.chave} style={estilos.colunaDia}>
              <div style={estilos.headerDia}>{dia.label}</div>
              <div style={estilos.listaAulasColuna}>
                {mapaSemanal[dia.chave].length === 0 ? (
                  <div style={estilos.vazio}>Horário Livre</div>
                ) : (
                  mapaSemanal[dia.chave].map(aula => {
                    const cor = getCorAluno(aula.alunoNome);
                    return (
                      <div key={aula.id} style={{...estilos.cardAula, background: cor.fundo, border: `1px solid ${cor.borda}`}}>
                        <div style={estilos.cardAulaTopo}>
                          <span style={estilos.horaBadge}>{aula.hora}</span>
                          {aula.reposicao === "sim" && <span style={estilos.reposicaoBadge}>R</span>}
                        </div>
                        <div style={{...estilos.nomeAluno, color: cor.texto}}>{aula.alunoNome}</div>
                        <div style={estilos.statusRow}>
                          <button style={estilos.btnStatus} onClick={() => atualizarStatus(aula.id, "presente")} title="Marcar Presença">✔</button>
                          <button style={estilos.btnStatusFalta} onClick={() => atualizarStatus(aula.id, "faltou")} title="Marcar Falta">✖</button>
                          <button style={estilos.btnDelete} onClick={() => excluirAula(aula.id)}>Apagar</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- UTILITÁRIOS DE DATA ---
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
function getCorAluno(nome?: string) {
  if (!nome) return coresAluno[0];
  let sum = 0; for (let i = 0; i < nome.length; i++) sum += nome.charCodeAt(i);
  return coresAluno[sum % coresAluno.length];
}

// --- ESTILOS PROFISSIONAIS ---
const estilos = {
  pagina: { display: "flex", flexDirection: "column" as const, gap: "20px", padding: "16px", background: "#080c14", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" },
  hero: { background: "linear-gradient(145deg, #1e293b 0%, #080c14 100%)", borderRadius: "24px", padding: "28px", border: "1px solid #1e293b" },
  heroPrincipal: { maxWidth: "600px" },
  eyebrow: { fontSize: "11px", color: "#3b82f6", fontWeight: 800, letterSpacing: "1.2px", marginBottom: "8px" },
  titulo: { fontSize: "32px", fontWeight: 900, margin: "0 0 10px 0" },
  descricao: { color: "#64748b", fontSize: "15px", lineHeight: 1.6 },
  formCard: { background: "#111827", padding: "24px", borderRadius: "24px", border: "1px solid #1f2937" },
  cardTitulo: { fontSize: "20px", fontWeight: 800, marginBottom: "20px", color: "#f3f4f6" },
  modoCadastroWrap: { display: "flex", gap: "12px", marginBottom: "20px" },
  modoCadastroBotao: { flex: 1, padding: "12px", borderRadius: "12px", background: "#1f2937", color: "#9ca3af", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "12px" },
  modoCadastroBotaoAtivo: { background: "#3b82f6", color: "#fff" },
  recorrenciaCard: { background: "rgba(59, 130, 246, 0.08)", padding: "16px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #1d4ed8" },
  diasSemanaCheckboxGrid: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginBottom: "12px" },
  diaSemanaChip: { padding: "8px 14px", borderRadius: "10px", background: "#080c14", color: "#94a3b8", border: "1px solid #1f2937", fontSize: "12px", cursor: "pointer" },
  diaSemanaChipAtivo: { background: "#10b981", color: "#fff", borderColor: "#34d399" },
  selectSemanas: { width: "100%", background: "#080c14", color: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid #1f2937", outline: "none" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
  campo: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  label: { fontSize: "12px", color: "#9ca3af", fontWeight: 700 },
  input: { background: "#080c14", border: "1px solid #1f2937", color: "#fff", padding: "12px", borderRadius: "12px", fontSize: "14px", outline: "none" },
  select: { background: "#080c14", border: "1px solid #1f2937", color: "#fff", padding: "12px", borderRadius: "12px", fontSize: "14px", outline: "none" },
  botaoPrincipal: { width: "100%", background: "linear-gradient(to bottom, #3b82f6, #2563eb)", padding: "16px", borderRadius: "14px", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: "15px" },
  quadroSemanalCard: { background: "#111827", padding: "24px", borderRadius: "24px", border: "1px solid #1f2937" },
  cardHeaderPlanilha: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" as const, gap: "10px" },
  acoesSemana: { display: "flex", gap: "8px" },
  botaoSemanaSecundario: { background: "#1f2937", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", cursor: "pointer" },
  botaoSemanaAtual: { background: "#3b82f6", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" },
  desktopGrade: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" },
  mobileScroll: { display: "flex", overflowX: "auto" as const, gap: "12px", paddingBottom: "10px" },
  colunaDia: { minWidth: "220px", background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "12px" },
  headerDia: { textAlign: "center" as const, fontWeight: 800, paddingBottom: "12px", borderBottom: "1px solid #1f2937", marginBottom: "12px", color: "#3b82f6", fontSize: "13px" },
  listaAulasColuna: { display: "flex", flexDirection: "column" as const, gap: "10px" },
  cardAula: { padding: "14px", borderRadius: "16px" },
  cardAulaTopo: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  horaBadge: { background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 800 },
  reposicaoBadge: { background: "#f59e0b", color: "#000", padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: 900 },
  nomeAluno: { fontSize: "15px", fontWeight: 900, marginBottom: "12px" },
  statusRow: { display: "flex", gap: "6px" },
  btnStatus: { flex: 1, background: "#10b981", border: "none", color: "#fff", borderRadius: "10px", padding: "8px", cursor: "pointer" },
  btnStatusFalta: { flex: 1, background: "#ef4444", border: "none", color: "#fff", borderRadius: "10px", padding: "8px", cursor: "pointer" },
  btnDelete: { background: "#374151", border: "none", color: "#fff", borderRadius: "8px", padding: "8px", fontSize: "10px", cursor: "pointer" },
  vazio: { textAlign: "center" as const, padding: "20px", color: "#4b5563", fontSize: "12px", fontStyle: "italic" }
};