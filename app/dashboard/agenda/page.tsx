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

// --- CONSTANTES DE CONFIGURAÇÃO ---
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

const coresAlunos = [
  { fundo: "rgba(34,197,94,0.18)", borda: "rgba(34,197,94,0.3)", texto: "#86efac", glow: "0 8px 20px rgba(34,197,94,0.15)" },
  { fundo: "rgba(59,130,246,0.18)", borda: "rgba(59,130,246,0.3)", texto: "#93c5fd", glow: "0 8px 20px rgba(59,130,246,0.15)" },
  { fundo: "rgba(168,85,247,0.18)", borda: "rgba(168,85,247,0.3)", texto: "#d8b4fe", glow: "0 8px 20px rgba(168,85,247,0.15)" },
  { fundo: "rgba(250,204,21,0.18)", borda: "rgba(250,204,21,0.3)", texto: "#fde68a", glow: "0 8px 20px rgba(250,204,21,0.15)" },
  { fundo: "rgba(236,72,153,0.18)", borda: "rgba(236,72,153,0.3)", texto: "#f9a8d4", glow: "0 8px 20px rgba(236,72,153,0.15)" },
];

export default function AgendaPage() {
  // --- ESTADOS ---
  const [isMobile, setIsMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  // Form States
  const [alunoNome, setAlunoNome] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");
  const [modoCadastro, setModoCadastro] = useState<"manual" | "automatico">("manual");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  // Filter & Navigation
  const [inicioSemana, setInicioSemana] = useState(getInicioDaSemana(new Date()));
  const [filtroStatus, setFiltroStatus] = useState<"todos" | AulaStatus>("todos");

  // --- EFEITOS ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const user = auth.currentUser;
      if (!user) return;

      const qAlunos = query(collection(db, "students"), where("userId", "==", user.uid));
      const qAgenda = query(collection(db, "agenda"), where("userId", "==", user.uid), orderBy("data", "asc"));

      const [snapAlunos, snapAgenda] = await Promise.all([getDocs(qAlunos), getDocs(qAgenda)]);

      setAlunos(snapAlunos.docs.map(d => ({ id: d.id, ...d.data() })) as Aluno[]);
      setAulas(snapAgenda.docs.map(d => ({ id: d.id, ...d.data() })) as Aula[]);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- LÓGICA DE CADASTRO ---
  const handleCadastrar = async () => {
    if (!alunoNome || !hora) return alert("Por favor, selecione o aluno e o horário.");
    setSalvando(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (modoCadastro === "manual") {
        if (!data) return alert("Selecione a data da aula.");
        await addDoc(collection(db, "agenda"), {
          alunoNome,
          data,
          hora,
          reposicao,
          status: "pendente",
          userId: user.uid,
          criadoEm: serverTimestamp(),
        });
      } else {
        if (diasSelecionados.length === 0) return alert("Selecione ao menos um dia da semana.");
        const mapaDias: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
        
        for (let s = 0; s < quantidadeSemanas; s++) {
          for (const diaChave of diasSelecionados) {
            let dBase = new Date();
            dBase.setHours(12, 0, 0, 0); // Ajuste de fuso horário para meio-dia
            const alvo = mapaDias[diaChave];
            const atual = dBase.getDay();
            const diff = (alvo - atual + 7) % 7;
            dBase.setDate(dBase.getDate() + (s * 7) + diff);
            
            await addDoc(collection(db, "agenda"), {
              alunoNome,
              data: dBase.toISOString().split("T")[0],
              hora,
              reposicao,
              status: "pendente",
              userId: user.uid,
              criadoEm: serverTimestamp(),
            });
          }
        }
      }
      // Limpeza
      setAlunoNome(""); setData(""); setHora(""); setDiasSelecionados([]);
      await carregarDados();
      alert("Agendamento realizado com sucesso!");
    } catch (e) {
      console.error("Erro ao cadastrar:", e);
    } finally {
      setSalvando(false);
    }
  };

  const atualizarStatus = async (id: string, s: AulaStatus) => {
    try {
      await updateDoc(doc(db, "agenda", id), { status: s });
      await carregarDados();
    } catch (e) {
      console.error(e);
    }
  };

  const excluirAula = async (id: string) => {
    if (confirm("Deseja excluir este horário permanentemente?")) {
      try {
        await deleteDoc(doc(db, "agenda", id));
        await carregarDados();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- MEMOS ---
  const fimSemana = useMemo(() => addDiasEmISO(inicioSemana, 6), [inicioSemana]);

  const mapaSemanal = useMemo(() => {
    const est: Record<string, Aula[]> = { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] };
    aulas.forEach(a => {
      if (a.data! >= inicioSemana && a.data! <= fimSemana) {
        if (filtroStatus === "todos" || a.status === filtroStatus) {
          const dia = getChaveDiaSemana(a.data!);
          if (est[dia]) est[dia].push(a);
        }
      }
    });
    // Ordenar por hora
    Object.keys(est).forEach(k => est[k].sort((a, b) => a.hora!.localeCompare(b.hora!)));
    return est;
  }, [aulas, inicioSemana, fimSemana, filtroStatus]);

  // --- RENDERIZAÇÃO ---
  return (
    <div style={estilos.pagina}>
      {/* GLOWS DE FUNDO - Identidade do seu Dashboard */}
      <div style={estilos.fundoGlowUm}></div>
      <div style={estilos.fundoGlowDois}></div>

      {/* CABEÇALHO */}
      <header style={estilos.hero}>
        <p style={estilos.eyebrow}>CONTROLE DE FLUXO • GCM PASSOS</p>
        <h1 style={estilos.titulo}>Agenda de Treinos</h1>
        <p style={estilos.descricao}>Visualize sua semana, gerencie presenças e organize recorrências mensais.</p>
      </header>

      {/* CARD DE AÇÕES/CADASTRO */}
      <section style={estilos.formCard}>
        <div style={estilos.modoCadastroWrap}>
          <button 
            style={{...estilos.tab, ...(modoCadastro === "manual" ? estilos.tabAtiva : {})}} 
            onClick={() => setModoCadastro("manual")}
          >
            AULA ÚNICA
          </button>
          <button 
            style={{...estilos.tab, ...(modoCadastro === "automatico" ? estilos.tabAtiva : {})}} 
            onClick={() => setModoCadastro("automatico")}
          >
            RECORRÊNCIA MENSAL
          </button>
        </div>

        <div style={estilos.formGrid}>
          <div style={estilos.campo}>
            <label style={estilos.label}>Selecione o Aluno</label>
            <select style={estilos.select} value={alunoNome} onChange={e => setAlunoNome(e.target.value)}>
              <option value="">-- Selecionar Aluno --</option>
              {alunos.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
            </select>
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Horário do Treino</label>
            <input type="time" style={estilos.input} value={hora} onChange={e => setHora(e.target.value)} />
          </div>

          {modoCadastro === "manual" ? (
            <div style={estilos.campo}>
              <label style={estilos.label}>Data da Aula</label>
              <input type="date" style={estilos.input} value={data} onChange={e => setData(e.target.value)} />
            </div>
          ) : (
            <div style={estilos.campo}>
              <label style={estilos.label}>Duração do Plano (Semanas)</label>
              <select style={estilos.select} value={quantidadeSemanas} onChange={e => setQuantidadeSemanas(Number(e.target.value))}>
                <option value={4}>4 Semanas (1 mês)</option>
                <option value={8}>8 Semanas (2 meses)</option>
                <option value={12}>12 Semanas (3 meses)</option>
              </select>
            </div>
          )}
        </div>

        {modoCadastro === "automatico" && (
          <div style={estilos.diasBox}>
            <label style={estilos.label}>Escolha os dias fixos na semana:</label>
            <div style={estilos.diasGrid}>
              {diasSemana.map(d => (
                <button 
                  key={d.chave} 
                  style={{...estilos.diaChip, ...(diasSelecionados.includes(d.chave) ? estilos.diaChipAtivo : {})}}
                  onClick={() => setDiasSelecionados(prev => prev.includes(d.chave) ? prev.filter(x => x !== d.chave) : [...prev, d.chave])}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button style={estilos.btnPrincipal} onClick={handleCadastrar} disabled={salvando}>
          {salvando ? "PROCESSANDO..." : "CONFIRMAR AGENDAMENTO"}
        </button>
      </section>

      {/* GRADE SEMANAL - Mobile Otimizado */}
      <section style={estilos.gradeCard}>
        <div style={estilos.gradeHeader}>
          <h2 style={estilos.gradeTitulo}>Sua Grade Semanal</h2>
          <div style={estilos.navAcoes}>
            <button style={estilos.btnNav} onClick={() => setInicioSemana(addDiasEmISO(inicioSemana, -7))}>ANTERIOR</button>
            <button style={estilos.btnNavAtivo} onClick={() => setInicioSemana(getInicioDaSemana(new Date()))}>HOJE</button>
            <button style={estilos.btnNav} onClick={() => setInicioSemana(addDiasEmISO(inicioSemana, 7))}>PRÓXIMA</button>
          </div>
        </div>

        <div style={isMobile ? estilos.mobileScroll : estilos.desktopGrid}>
          {diasSemana.map(dia => (
            <div key={dia.chave} style={estilos.colunaDia}>
              <div style={estilos.diaLabel}>{dia.label}</div>
              <div style={estilos.listaAulas}>
                {mapaSemanal[dia.chave].length === 0 ? (
                  <div style={estilos.vazio}>Nenhum treino</div>
                ) : (
                  mapaSemanal[dia.chave].map(aula => {
                    const cor = getCorAluno(aula.alunoNome);
                    return (
                      <div 
                        key={aula.id} 
                        style={{...estilos.aulaCard, background: cor.fundo, border: `1px solid ${cor.borda}`, boxShadow: cor.glow}}
                      >
                        <div style={estilos.aulaHeader}>
                          <span style={estilos.aulaHora}>{aula.hora}</span>
                          <button style={estilos.btnExcluir} onClick={() => excluirAula(aula.id)}>×</button>
                        </div>
                        <div style={{...estilos.aulaNome, color: cor.texto}}>{aula.alunoNome}</div>
                        <div style={estilos.acoesStatus}>
                          <button style={estilos.btnPresente} onClick={() => atualizarStatus(aula.id, "presente")}>✔</button>
                          <button style={estilos.btnFalta} onClick={() => atualizarStatus(aula.id, "faltou")}>✖</button>
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

// --- FUNÇÕES DE DATA ---
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
  if (!nome) return coresAlunos[0];
  let s = 0;
  for (let i = 0; i < nome.length; i++) s += nome.charCodeAt(i);
  return coresAlunos[s % coresAlunos.length];
}

// --- OBJETOS DE ESTILO ---
const estilos = {
  pagina: { 
    display: "flex", 
    flexDirection: "column" as const, 
    gap: "24px", 
    position: "relative" as const,
    minHeight: "100vh",
    paddingBottom: "40px"
  },
  fundoGlowUm: { 
    position: "fixed" as const, 
    top: "-100px", 
    left: "-100px", 
    width: "350px", 
    height: "350px", 
    background: "rgba(59,130,246,0.15)", 
    filter: "blur(90px)", 
    zIndex: 0, 
    pointerEvents: "none" as const 
  },
  fundoGlowDois: { 
    position: "fixed" as const, 
    bottom: "50px", 
    right: "-100px", 
    width: "300px", 
    height: "300px", 
    background: "rgba(34,197,94,0.12)", 
    filter: "blur(80px)", 
    zIndex: 0, 
    pointerEvents: "none" as const 
  },
  hero: { 
    position: "relative" as const, 
    zIndex: 2, 
    background: "rgba(255,255,255,0.04)", 
    border: "1px solid rgba(255,255,255,0.08)", 
    padding: "32px", 
    borderRadius: "30px", 
    backdropFilter: "blur(16px)" 
  },
  eyebrow: { fontSize: "12px", fontWeight: 800, color: "#60a5fa", letterSpacing: "1.5px" },
  titulo: { fontSize: "38px", fontWeight: 900, margin: "10px 0", color: "#fff" },
  descricao: { color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.6" },
  formCard: { 
    position: "relative" as const, 
    zIndex: 2, 
    background: "rgba(255,255,255,0.04)", 
    border: "1px solid rgba(255,255,255,0.08)", 
    padding: "24px", 
    borderRadius: "30px" 
  },
  modoCadastroWrap: { display: "flex", gap: "12px", marginBottom: "24px" },
  tab: { 
    flex: 1, 
    height: "50px",
    borderRadius: "14px", 
    background: "rgba(255,255,255,0.05)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "rgba(255,255,255,0.5)", 
    fontWeight: 700, 
    cursor: "pointer",
    fontSize: "12px"
  },
  tabAtiva: { background: "#2563eb", borderColor: "#3b82f6", color: "#fff" },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
    gap: "20px", 
    marginBottom: "24px" 
  },
  campo: { display: "flex", flexDirection: "column" as const, gap: "10px" },
  label: { fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)" },
  select: { 
    height: "54px", 
    background: "#0f172a", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: "14px", 
    color: "#fff", 
    padding: "0 15px",
    fontSize: "14px"
  },
  input: { 
    height: "54px", 
    background: "#0f172a", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: "14px", 
    color: "#fff", 
    padding: "0 15px",
    fontSize: "14px"
  },
  diasBox: { marginBottom: "24px" },
  diasGrid: { display: "flex", flexWrap: "wrap" as const, gap: "10px", marginTop: "12px" },
  diaChip: { 
    padding: "10px 16px", 
    borderRadius: "12px", 
    background: "rgba(255,255,255,0.05)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff", 
    fontWeight: 700, 
    cursor: "pointer",
    fontSize: "12px"
  },
  diaChipAtivo: { background: "#22c55e", borderColor: "#4ade80" },
  btnPrincipal: { 
    width: "100%", 
    height: "60px", 
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", 
    border: "none", 
    borderRadius: "18px", 
    color: "#fff", 
    fontWeight: 900, 
    fontSize: "15px", 
    cursor: "pointer", 
    boxShadow: "0 10px 25px rgba(37,99,235,0.4)" 
  },
  gradeCard: { 
    position: "relative" as const, 
    zIndex: 2, 
    background: "rgba(255,255,255,0.04)", 
    border: "1px solid rgba(255,255,255,0.08)", 
    padding: "24px", 
    borderRadius: "30px" 
  },
  gradeHeader: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "30px", 
    flexWrap: "wrap" as const, 
    gap: "15px" 
  },
  gradeTitulo: { fontSize: "22px", fontWeight: 800, color: "#fff" },
  navAcoes: { 
    display: "flex", 
    gap: "8px", 
    background: "rgba(255,255,255,0.05)", 
    padding: "6px", 
    borderRadius: "14px" 
  },
  btnNav: { 
    padding: "8px 14px", 
    background: "transparent", 
    border: "none", 
    color: "rgba(255,255,255,0.6)", 
    fontWeight: 700, 
    cursor: "pointer",
    fontSize: "12px"
  },
  btnNavAtivo: { 
    padding: "8px 14px", 
    background: "rgba(255,255,255,0.1)", 
    borderRadius: "10px", 
    border: "none", 
    color: "#fff", 
    fontWeight: 800,
    fontSize: "12px"
  },
  desktopGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "14px" },
  mobileScroll: { 
    display: "flex", 
    overflowX: "auto" as const, 
    gap: "15px", 
    paddingBottom: "15px", 
    WebkitOverflowScrolling: "touch" as const,
    scrollSnapType: "x mandatory" as const
  },
  colunaDia: { 
    minWidth: "240px", 
    background: "rgba(255,255,255,0.02)", 
    borderRadius: "24px", 
    padding: "16px", 
    border: "1px solid rgba(255,255,255,0.05)",
    scrollSnapAlign: "start" as const
  },
  diaLabel: { 
    textAlign: "center" as const, 
    fontWeight: 900, 
    color: "#60a5fa", 
    marginBottom: "20px", 
    fontSize: "14px", 
    textTransform: "uppercase" as const,
    letterSpacing: "1px"
  },
  listaAulas: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  vazio: { textAlign: "center" as const, padding: "30px", color: "rgba(255,255,255,0.2)", fontSize: "12px" },
  aulaCard: { padding: "16px", borderRadius: "20px", position: "relative" as const },
  aulaHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  aulaHora: { 
    fontSize: "11px", 
    fontWeight: 900, 
    background: "rgba(0,0,0,0.3)", 
    padding: "5px 10px", 
    borderRadius: "10px" 
  },
  btnExcluir: { background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "20px", cursor: "pointer" },
  aulaNome: { fontSize: "17px", fontWeight: 800, marginBottom: "15px" },
  acoesStatus: { display: "flex", gap: "8px" },
  btnPresente: { flex: 1, height: "38px", background: "#22c55e", border: "none", borderRadius: "12px", color: "#fff", cursor: "pointer", fontSize: "14px" },
  btnFalta: { flex: 1, height: "38px", background: "#ef4444", border: "none", borderRadius: "12px", color: "#fff", cursor: "pointer", fontSize: "14px" },
};