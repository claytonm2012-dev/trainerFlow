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
  Timestamp,
} from "firebase/firestore";

import db from "../../firebaseDb";
import auth from "../../firebaseAuth";

// --- TIPAGENS AVANÇADAS ---
type Aluno = {
  id: string;
  nome: string;
  telefone?: string;
  valorAula?: number;
  userId?: string;
};

type AulaStatus = "pendente" | "presente" | "faltou" | "cancelado";

type Aula = {
  id: string;
  alunoId?: string;
  alunoNome: string;
  data: string;
  hora: string;
  reposicao: string;
  status: AulaStatus;
  userId: string;
  valor?: number;
  criadoEm?: any;
};

type DiaSemanaItem = {
  chave: string;
  label: string;
};

// --- CONSTANTES DE DESIGN SYSTEM ---
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
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

const coresPaleta = [
  { fundo: "rgba(34,197,94,0.15)", borda: "#22c55e", texto: "#86efac", glow: "0 4px 12px rgba(34,197,94,0.2)" },
  { fundo: "rgba(59,130,246,0.15)", borda: "#3b82f6", texto: "#93c5fd", glow: "0 4px 12px rgba(59,130,246,0.2)" },
  { fundo: "rgba(168,85,247,0.15)", borda: "#a855f7", texto: "#d8b4fe", glow: "0 4px 12px rgba(168,85,247,0.2)" },
  { fundo: "rgba(245,158,11,0.15)", borda: "#f59e0b", texto: "#fcd34d", glow: "0 4px 12px rgba(245,158,11,0.2)" },
  { fundo: "rgba(236,72,153,0.15)", borda: "#ec4899", texto: "#f9a8d4", glow: "0 4px 12px rgba(236,72,153,0.2)" },
  { fundo: "rgba(14,165,233,0.15)", borda: "#0ea5e9", texto: "#7dd3fc", glow: "0 4px 12px rgba(14,165,233,0.2)" },
];

export default function AgendaProfissionalPage() {
  // --- ESTADOS CORE ---
  const [isMobile, setIsMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [viewMode, setViewMode] = useState<"grade" | "lista">("grade");

  // --- ESTADOS DE DADOS ---
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  
  // --- FORMULÁRIO ---
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reposicao, setReposicao] = useState("nao");
  const [modoCadastro, setModoCadastro] = useState<"unica" | "recorrente">("unica");
  const [diasRecorrentes, setDiasRecorrentes] = useState<string[]>([]);
  const [numSemanas, setNumSemanas] = useState(4);

  // --- FILTROS & NAVEGAÇÃO ---
  const [termoBusca, setTermoBusca] = useState("");
  const [dataInicioSemana, setDataInicioSemana] = useState(obterSegundaFeira(new Date()));
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // --- MODAIS ---
  const [aulaEmEdicao, setAulaEmEdicao] = useState<Aula | null>(null);

  // --- EFEITOS INICIAIS ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchDados = async () => {
    try {
      setCarregando(true);
      const user = auth.currentUser;
      if (!user) return;

      const qAlunos = query(collection(db, "students"), where("userId", "==", user.uid));
      const qAgenda = query(collection(db, "agenda"), where("userId", "==", user.uid), orderBy("data", "asc"));

      const [resAlunos, resAgenda] = await Promise.all([getDocs(qAlunos), getDocs(qAgenda)]);

      const listaAlunos = resAlunos.docs.map(d => ({ id: d.id, ...d.data() })) as Aluno[];
      const listaAgenda = resAgenda.docs.map(d => ({ id: d.id, ...d.data() })) as Aula[];

      setAlunos(listaAlunos.sort((a, b) => a.nome.localeCompare(b.nome)));
      setAulas(listaAgenda);
    } catch (e) {
      console.error("Erro ao sincronizar dados:", e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => { if (user) fetchDados(); });
    return () => unsub();
  }, []);

  // --- LÓGICA DE NEGÓCIO: AGENDAMENTO ---
  const handleAgendar = async () => {
    if (!alunoSelecionado || !hora || (modoCadastro === "unica" && !data)) {
      alert("Erro: Preencha aluno, horário e data.");
      return;
    }

    setSalvando(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (modoCadastro === "unica") {
        await addDoc(collection(db, "agenda"), {
          alunoId: alunoSelecionado.id,
          alunoNome: alunoSelecionado.nome,
          data,
          hora,
          reposicao,
          status: "pendente",
          valor: alunoSelecionado.valorAula || 0,
          userId: user.uid,
          criadoEm: serverTimestamp(),
        });
      } else {
        // LÓGICA DE RECORRÊNCIA AVANÇADA
        const mapaDias: Record<string, number> = { segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 0 };
        for (let i = 0; i < numSemanas; i++) {
          for (const diaChave of diasRecorrentes) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            const alvo = mapaDias[diaChave];
            const hoje = d.getDay();
            const diff = (alvo - hoje + 7) % 7;
            d.setDate(d.getDate() + diff + (i * 7));
            
            await addDoc(collection(db, "agenda"), {
              alunoId: alunoSelecionado.id,
              alunoNome: alunoSelecionado.nome,
              data: d.toISOString().split("T")[0],
              hora,
              reposicao: "nao",
              status: "pendente",
              valor: alunoSelecionado.valorAula || 0,
              userId: user.uid,
              criadoEm: serverTimestamp(),
            });
          }
        }
      }
      alert("Sucesso: Agenda atualizada!");
      resetForm();
      fetchDados();
    } catch (e) {
      alert("Erro ao gravar no banco.");
    } finally {
      setSalvando(false);
    }
  };

  const resetForm = () => {
    setAlunoSelecionado(null); setData(""); setHora(""); setModoCadastro("unica"); setDiasRecorrentes([]);
  };

  const updateStatus = async (id: string, novoStatus: AulaStatus) => {
    try {
      await updateDoc(doc(db, "agenda", id), { status: novoStatus });
      setAulas(prev => prev.map(a => a.id === id ? { ...a, status: novoStatus } : a));
    } catch (e) { console.error(e); }
  };

  const deletarAula = async (id: string) => {
    if (!confirm("Confirmar exclusão definitiva?")) return;
    await deleteDoc(doc(db, "agenda", id));
    fetchDados();
  };

  // --- CÁLCULOS DE DASHBOARD ---
  const stats = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    const mesAtual = new Date().getMonth();
    const aulasMes = aulas.filter(a => new Date(a.data).getMonth() === mesAtual);

    return {
      totalHoje: aulas.filter(a => a.data === hoje).length,
      pendentes: aulas.filter(a => a.status === "pendente").length,
      faturamentoPrevisto: aulasMes.reduce((acc, curr) => acc + (curr.valor || 0), 0),
      faturamentoRealizado: aulasMes.filter(a => a.status === "presente").reduce((acc, curr) => acc + (curr.valor || 0), 0),
      taxaPresenca: Math.round((aulasMes.filter(a => a.status === "presente").length / (aulasMes.length || 1)) * 100)
    };
  }, [aulas]);

  // --- FILTRAGEM DA GRADE ---
  const dataFimSemana = useMemo(() => {
    const d = new Date(dataInicioSemana);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  }, [dataInicioSemana]);

  const aulasFiltradas = useMemo(() => {
    return aulas.filter(a => {
      const matchBusca = a.alunoNome.toLowerCase().includes(termoBusca.toLowerCase());
      const matchStatus = filtroStatus === "todos" || a.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [aulas, termoBusca, filtroStatus]);

  const gradeCalculada = useMemo(() => {
    const mapa: Record<string, Record<string, Aula[]>> = {};
    diasSemana.forEach(dia => {
      mapa[dia.chave] = {};
      horariosFixos.forEach(h => mapa[dia.chave][h] = []);
    });

    aulasFiltradas.forEach(aula => {
      if (aula.data >= dataInicioSemana && aula.data <= dataFimSemana) {
        const diaChave = converterDataParaChave(aula.data);
        const horaBase = aula.hora.split(":")[0] + ":00";
        if (mapa[diaChave] && mapa[diaChave][horaBase]) {
          mapa[diaChave][horaBase].push(aula);
        }
      }
    });
    return mapa;
  }, [aulasFiltradas, dataInicioSemana, dataFimSemana]);

  // --- FUNÇÕES DE INTERFACE ---
  const shareWhatsApp = (aula: Aula) => {
    const tel = alunos.find(al => al.id === aula.alunoId)?.telefone || "";
    const msg = `Olá ${aula.alunoNome}, confirmando nosso treino dia ${formatarDataBr(aula.data)} às ${aula.hora}. Aguardo você!`;
    window.open(`https://wa.me/55${tel.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div style={s.container}>
      {/* HEADER DINÂMICO */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.badgeLive}>• LIVE</span>
          <h1 style={s.logo}>TrainerFlow <span style={s.logoPro}>PRO</span></h1>
        </div>
        <div style={s.headerRight}>
          <div style={s.userProfile}>
            <div style={s.avatar}>{auth.currentUser?.email?.charAt(0).toUpperCase()}</div>
            {!isMobile && <span>{auth.currentUser?.email}</span>}
          </div>
        </div>
      </header>

      {/* DASHBOARD DE PERFORMANCE */}
      <section style={s.dashboard}>
        <div style={s.statCard}>
          <span style={s.statLabel}>Hoje</span>
          <h2 style={s.statValue}>{stats.totalHoje}</h2>
          <div style={s.statSub}>Aulas agendadas</div>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Faturamento Estimado</span>
          <h2 style={{ ...s.statValue, color: "#4ade80" }}>R$ {stats.faturamentoPrevisto}</h2>
          <div style={s.statSub}>Competência atual</div>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Aderência</span>
          <h2 style={{ ...s.statValue, color: "#3b82f6" }}>{stats.taxaPresenca}%</h2>
          <div style={s.statSub}>Presenças confirmadas</div>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Status</span>
          <h2 style={{ ...s.statValue, color: "#f59e0b" }}>{stats.pendentes}</h2>
          <div style={s.statSub}>Aguardando checklist</div>
        </div>
      </section>

      <main style={s.mainGrid}>
        {/* LADO ESQUERDO: CONTROLES E CADASTRO */}
        <aside style={s.sidebar}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Agendar Treino</h3>
            
            <div style={s.tabContainer}>
              <button 
                onClick={() => setModoCadastro("unica")} 
                style={modoCadastro === "unica" ? s.tabActive : s.tab}
              >Única</button>
              <button 
                onClick={() => setModoCadastro("recorrente")} 
                style={modoCadastro === "recorrente" ? s.tabActive : s.tab}
              >Mensal</button>
            </div>

            <div style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Aluno</label>
                <select 
                  style={s.select}
                  value={alunoSelecionado?.id || ""} 
                  onChange={(e) => setAlunoSelecionado(alunos.find(a => a.id === e.target.value) || null)}
                >
                  <option value="">Selecionar aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              {modoCadastro === "unica" ? (
                <div style={s.inputGroup}>
                  <label style={s.label}>Data do Treino</label>
                  <input type="date" style={s.input} value={data} onChange={e => setData(e.target.value)} />
                </div>
              ) : (
                <div style={s.recorrenciaBox}>
                  <label style={s.label}>Dias da Semana</label>
                  <div style={s.chipGrid}>
                    {diasSemana.map(d => (
                      <button 
                        key={d.chave}
                        onClick={() => setDiasRecorrentes(prev => prev.includes(d.chave) ? prev.filter(x => x !== d.chave) : [...prev, d.chave])}
                        style={diasRecorrentes.includes(d.chave) ? s.chipActive : s.chip}
                      >{d.label.substring(0,3)}</button>
                    ))}
                  </div>
                  <label style={{...s.label, marginTop: "10px"}}>Duração (Semanas)</label>
                  <input type="number" style={s.input} value={numSemanas} onChange={e => setNumSemanas(Number(e.target.value))} />
                </div>
              )}

              <div style={s.inputGroup}>
                <label style={s.label}>Horário</label>
                <select style={s.select} value={hora} onChange={e => setHora(e.target.value)}>
                  <option value="">--:--</option>
                  {horariosFixos.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <button 
                disabled={salvando} 
                onClick={handleAgendar} 
                style={s.btnPrimary}
              >
                {salvando ? "Processando..." : "Confirmar Horário"}
              </button>
            </div>
          </div>

          <div style={{...s.card, marginTop: "20px"}}>
            <h3 style={s.cardTitle}>Busca e Filtros</h3>
            <input 
              style={s.input} 
              placeholder="Filtrar por nome..." 
              value={termoBusca} 
              onChange={e => setTermoBusca(e.target.value)} 
            />
            <div style={{marginTop: "10px"}}>
               <label style={s.label}>Status da Aula</label>
               <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                 <option value="todos">Todos os status</option>
                 <option value="pendente">Pendentes</option>
                 <option value="presente">Presenças</option>
                 <option value="faltou">Faltas</option>
                 <option value="cancelado">Cancelados</option>
               </select>
            </div>
          </div>
        </aside>

        {/* LADO DIREITO: GRADE/AGENDA */}
        <section style={s.content}>
          <div style={s.contentHeader}>
            <div style={s.navigation}>
              <button style={s.btnNav} onClick={() => setDataInicioSemana(prev => moverSemana(prev, -7))}>Anterior</button>
              <div style={s.currentRange}>
                {formatarDataBr(dataInicioSemana)} — {formatarDataBr(dataFimSemana)}
              </div>
              <button style={s.btnNav} onClick={() => setDataInicioSemana(prev => moverSemana(prev, 7))}>Próxima</button>
            </div>
            <div style={s.viewToggle}>
              <button onClick={() => setViewMode("grade")} style={viewMode === "grade" ? s.toggleBtnActive : s.toggleBtn}>Grade</button>
              <button onClick={() => setViewMode("lista")} style={viewMode === "lista" ? s.toggleBtnActive : s.toggleBtn}>Lista</button>
            </div>
          </div>

          {viewMode === "grade" ? (
            <div style={s.gradeWrapper}>
              <div style={s.gradeGrid}>
                <div style={s.hourCol}>
                  <div style={s.gridHeaderCell}>Hora</div>
                  {horariosFixos.map(h => <div key={h} style={s.hourCell}>{h}</div>)}
                </div>
                {diasSemana.map(dia => (
                  <div key={dia.chave} style={s.dayCol}>
                    <div style={s.gridHeaderCell}>{dia.label}</div>
                    {horariosFixos.map(horario => {
                      const aulasNoSlot = gradeCalculada[dia.chave][horario];
                      return (
                        <div key={horario} style={s.gridCell}>
                          {aulasNoSlot.map(aula => {
                            const cor = getCorPorNome(aula.alunoNome);
                            return (
                              <div 
                                key={aula.id} 
                                style={{
                                  ...s.aulaCard, 
                                  background: cor.fundo, 
                                  borderLeft: `4px solid ${cor.borda}`,
                                  opacity: aula.status === "cancelado" ? 0.5 : 1
                                }}
                                onClick={() => setAulaEmEdicao(aula)}
                              >
                                <div style={s.aulaHeader}>
                                  <strong style={{color: cor.texto}}>{aula.alunoNome}</strong>
                                </div>
                                <div style={s.aulaFooter}>
                                  <span>{aula.hora}</span>
                                  {aula.status === "presente" && <span style={s.dotGreen}>●</span>}
                                  {aula.status === "faltou" && <span style={s.dotRed}>●</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={s.listaContainer}>
               {aulasFiltradas.length === 0 && <div style={s.vazio}>Nenhum registro encontrado.</div>}
               {aulasFiltradas.slice(0, 50).map(aula => (
                 <div key={aula.id} style={s.listItem}>
                    <div style={s.listInfo}>
                      <strong>{aula.alunoNome}</strong>
                      <span>{formatarDataBr(aula.data)} às {aula.hora}</span>
                    </div>
                    <div style={s.listActions}>
                      <button onClick={() => updateStatus(aula.id, "presente")} style={s.btnOk}>Presença</button>
                      <button onClick={() => updateStatus(aula.id, "faltou")} style={s.btnNo}>Falta</button>
                      <button onClick={() => shareWhatsApp(aula)} style={s.btnWa}>Zap</button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE EDIÇÃO AVANÇADA */}
      {aulaEmEdicao && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3>Gerenciar Treino</h3>
              <button onClick={() => setAulaEmEdicao(null)} style={s.btnClose}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p>Aluno: <strong>{aulaEmEdicao.alunoNome}</strong></p>
              <p>Data: {formatarDataBr(aulaEmEdicao.data)} às {aulaEmEdicao.hora}</p>
              
              <div style={s.statusGrid}>
                <button onClick={() => { updateStatus(aulaEmEdicao.id, "presente"); setAulaEmEdicao(null); }} style={s.statusBtn}>Confirmar Presença</button>
                <button onClick={() => { updateStatus(aulaEmEdicao.id, "faltou"); setAulaEmEdicao(null); }} style={s.statusBtnRed}>Marcar Falta</button>
                <button onClick={() => { updateStatus(aulaEmEdicao.id, "cancelado"); setAulaEmEdicao(null); }} style={s.statusBtnGrey}>Cancelar Aula</button>
                <button onClick={() => shareWhatsApp(aulaEmEdicao)} style={s.statusBtnWa}>Enviar Lembrete WhatsApp</button>
              </div>

              <button 
                onClick={() => { deletarAula(aulaEmEdicao.id); setAulaEmEdicao(null); }} 
                style={s.btnDanger}
              >Excluir Agendamento</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER MOBILE FIXO */}
      {isMobile && (
        <nav style={s.mobileNav}>
          <button style={s.navItem} onClick={() => window.location.reload()}>🔄</button>
          <button style={{...s.navItem, color: "#3b82f6"}} onClick={() => setViewMode("grade")}>📅</button>
          <button style={s.navItem} onClick={() => setModoCadastro("unica")}>➕</button>
          <button style={s.navItem}>👤</button>
        </nav>
      )}
    </div>
  );
}

// --- UTILITÁRIOS ---
function obterSegundaFeira(d: Date) {
  const date = new Date(d);
  const dia = date.getDay();
  const diff = date.getDate() - dia + (dia === 0 ? -6 : 1);
  const segunda = new Date(date.setDate(diff));
  return segunda.toISOString().split("T")[0];
}

function moverSemana(dataIso: string, dias: number) {
  const d = new Date(dataIso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

function formatarDataBr(dataIso: string) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}`;
}

function converterDataParaChave(dataIso: string) {
  const d = new Date(dataIso + "T12:00:00");
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return dias[d.getDay()];
}

function getCorPorNome(nome: string) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % coresPaleta.length;
  return coresPaleta[index];
}

// --- DESIGN SYSTEM (CSS-IN-JS) ---
const s: Record<string, any> = {
  container: {
    background: "#0a0a0c",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'Inter', sans-serif",
    paddingBottom: "80px"
  },
  header: {
    height: "70px",
    background: "#121216",
    borderBottom: "1px solid #1f1f23",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  badgeLive: { background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" },
  logo: { fontSize: "20px", fontWeight: "bold", letterSpacing: "-0.5px" },
  logoPro: { color: "#3b82f6", fontStyle: "italic" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  userProfile: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#94a3b8" },

  dashboard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    padding: "24px",
  },
  statCard: {
    background: "#121216",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #1f1f23",
  },
  statLabel: { color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  statValue: { fontSize: "28px", fontWeight: "bold", margin: "8px 0" },
  statSub: { color: "#475569", fontSize: "11px" },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    gap: "24px",
    padding: "0 24px 24px 24px",
  },
  sidebar: { display: "flex", flexDirection: "column", gap: "20px" },
  card: {
    background: "#121216",
    borderRadius: "16px",
    border: "1px solid #1f1f23",
    padding: "20px"
  },
  cardTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "16px" },
  tabContainer: {
    display: "flex",
    background: "#0a0a0c",
    padding: "4px",
    borderRadius: "10px",
    marginBottom: "16px"
  },
  tab: { flex: 1, padding: "8px", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", borderRadius: "8px" },
  tabActive: { flex: 1, padding: "8px", border: "none", background: "#1f1f23", color: "white", borderRadius: "8px", fontWeight: "bold" },

  form: { display: "flex", flexDirection: "column", gap: "12px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", color: "#94a3b8" },
  input: { background: "#0a0a0c", border: "1px solid #1f1f23", padding: "12px", borderRadius: "10px", color: "white", outline: "none" },
  select: { background: "#0a0a0c", border: "1px solid #1f1f23", padding: "12px", borderRadius: "10px", color: "white", outline: "none" },
  btnPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  
  chipGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" },
  chip: { background: "#0a0a0c", border: "1px solid #1f1f23", color: "#94a3b8", padding: "8px", borderRadius: "8px", fontSize: "10px", cursor: "pointer" },
  chipActive: { background: "#3b82f6", border: "1px solid #3b82f6", color: "white", padding: "8px", borderRadius: "8px", fontSize: "10px", cursor: "pointer" },

  content: { background: "#121216", borderRadius: "16px", border: "1px solid #1f1f23", overflow: "hidden", display: "flex", flexDirection: "column" },
  contentHeader: { padding: "20px", borderBottom: "1px solid #1f1f23", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navigation: { display: "flex", alignItems: "center", gap: "16px" },
  btnNav: { background: "#1f1f23", border: "none", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" },
  currentRange: { fontWeight: "bold", fontSize: "14px" },
  viewToggle: { display: "flex", background: "#0a0a0c", padding: "4px", borderRadius: "8px" },
  toggleBtn: { padding: "6px 12px", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "12px" },
  toggleBtnActive: { padding: "6px 12px", border: "none", background: "#1f1f23", color: "white", borderRadius: "6px", fontSize: "12px" },

  gradeWrapper: { flex: 1, overflowX: "auto" },
  gradeGrid: {
    display: "grid",
    gridTemplateColumns: "60px repeat(7, 1fr)",
    minWidth: "1000px"
  },
  hourCol: { borderRight: "1px solid #1f1f23" },
  dayCol: { borderRight: "1px solid #1f1f23", minHeight: "800px" },
  gridHeaderCell: { height: "50px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #1f1f23", color: "#94a3b8" },
  hourCell: { height: "100px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#475569", borderBottom: "1px solid #1f1f23" },
  gridCell: { height: "100px", borderBottom: "1px solid #0f0f12", padding: "4px", position: "relative" },

  aulaCard: {
    padding: "8px",
    borderRadius: "8px",
    fontSize: "11px",
    cursor: "pointer",
    marginBottom: "4px",
    transition: "transform 0.2s",
    ":hover": { transform: "scale(1.02)" }
  },
  aulaHeader: { fontWeight: "bold", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  aulaFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", opacity: 0.8 },
  dotGreen: { color: "#22c55e" },
  dotRed: { color: "#ef4444" },

  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#121216", width: "90%", maxWidth: "400px", borderRadius: "20px", border: "1px solid #1f1f23", padding: "24px" },
  modalHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  btnClose: { background: "transparent", border: "none", color: "white", fontSize: "20px", cursor: "pointer" },
  statusGrid: { display: "grid", gap: "10px", margin: "20px 0" },
  statusBtn: { background: "#22c55e", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  statusBtnRed: { background: "#ef4444", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  statusBtnGrey: { background: "#334155", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  statusBtnWa: { background: "#25d366", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  btnDanger: { width: "100%", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", padding: "10px", borderRadius: "10px", cursor: "pointer", marginTop: "10px" },

  mobileNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70px",
    background: "#121216",
    borderTop: "1px solid #1f1f23",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000
  },
  navItem: { background: "none", border: "none", fontSize: "24px", color: "#94a3b8" },

  listItem: { padding: "16px", borderBottom: "1px solid #1f1f23", display: "flex", justifyContent: "space-between", alignItems: "center" },
  listInfo: { display: "flex", flexDirection: "column", gap: "4px" },
  listActions: { display: "flex", gap: "8px" },
  btnOk: { background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e", padding: "6px 12px", borderRadius: "6px", fontSize: "12px" },
  btnNo: { background: "#ef444422", color: "#ef4444", border: "1px solid #ef4444", padding: "6px 12px", borderRadius: "6px", fontSize: "12px" },
  btnWa: { background: "#25d36622", color: "#25d366", border: "1px solid #25d366", padding: "6px 12px", borderRadius: "6px", fontSize: "12px" },
};