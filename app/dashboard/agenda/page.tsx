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
        setAlunos([]); setAulas([]); return;
      }
      const [alunosSnapshot, agendaSnapshot] = await Promise.all([
        getDocs(query(collection(db, "students"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "agenda"), where("userId", "==", user.uid), orderBy("data", "desc")))
      ]);
      const alunosLista = alunosSnapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() })) as Aluno[];
      const aulasLista = agendaSnapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() })) as Aula[];
      
      const hojeISO = new Date().toISOString().split("T")[0];
      const inicioSemanaAtual = getInicioDaSemana(new Date());
      const fimSemanaAtual = getFimDaSemanaPorInicio(inicioSemanaAtual);
      const hoje = new Date();
      const mesAt = hoje.getMonth() + 1;
      const anoAt = hoje.getFullYear();
      const aulasDoMesActual = aulasLista.filter(aula => {
        if (!aula.data) return false;
        const [ano, mes] = aula.data.split("-").map(Number);
        return mes === mesAt && ano === anoAt;
      });

      setAlunos(alunosLista);
      setAulas(aulasLista);
      setAulasHoje(aulasLista.filter(a => a.data === hojeISO).length);
      setAulasSemana(aulasLista.filter(a => a.data! >= inicioSemanaAtual && a.data! <= fimSemanaAtual).length);
      setAulasMes(aulasDoMesActual.length);
      setPresencasMes(aulasDoMesActual.filter(a => a.status === "presente").length);
      setFaltasMes(aulasDoMesActual.filter(a => a.status === "faltou").length);
      setCanceladasMes(aulasDoMesActual.filter(a => a.status === "cancelado").length);
      setReposicoesMes(aulasDoMesActual.filter(a => a.reposicao === "sim").length);
    } catch (error) { console.error(error);
    } finally { setCarregando(false); }
  }

  useEffect(() => { carregarDados(); }, []);

  async function cadastrarAula() {
    if (!alunoNome || !data || !hora) return alert("Selecione todos os campos.");
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return alert("Usuário não autenticado.");
      await addDoc(collection(db, "agenda"), {
        alunoNome, data, hora, reposicao, status: "pendente", userId: user.uid, criadoEm: serverTimestamp()
      });
      alert("Aula cadastrada!"); setAlunoNome(""); setData(""); setHora("");
      await carregarDados();
    } catch (e) { console.error(e); } finally { setSalvando(false); }
  }

  async function cadastrarAulasAutomaticas() {
    if (!alunoNome || !hora || diasSelecionados.length === 0) return alert("Faltam dados obrigatórios.");
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return alert("Usuário não autenticado.");
      const mapaDias: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
      for (let s = 0; s < quantidadeSemanas; s++) {
        for (const dia of diasSelecionados) {
          let dBase = new Date(); dBase.setHours(12, 0, 0, 0); // Evita erros fuso
          const diff = (mapaDias[dia] - dBase.getDay() + 7) % 7;
          dBase.setDate(dBase.getDate() + (s * 7) + diff);
          await addDoc(collection(db, "agenda"), {
            alunoNome, data: dBase.toISOString().split("T")[0], hora, reposicao, status: "pendente", userId: user.uid, criadoEm: serverTimestamp()
          });
        }
      }
      alert("Aulas recorrentes cadastradas!"); setAlunoNome(""); setHora("");
      setModoCadastro("manual"); setDiasSelecionados([]);
      await carregarDados();
    } catch (e) { console.error(e); } finally { setSalvando(false); }
  }

  function abrirEdicao(aula: Aula) {
    setEditandoId(aula.id); setEditAlunoNome(aula.alunoNome || ""); setEditData(aula.data || "");
    setEditHora(aula.hora || ""); setEditReposicao(aula.reposicao || "nao"); setEditStatus(aula.status || "pendente");
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth" }), 120);
  }

  async function salvarEdicao() {
    if (!editandoId) return;
    try {
      setSalvandoEdicao(true);
      await updateDoc(doc(db, "agenda", editandoId), {
        alunoNome: editAlunoNome, data: editData, hora: editHora, reposicao: editReposicao, status: editStatus
      });
      alert("Aula atualizada!"); setEditandoId(""); await carregarDados();
    } catch (e) { console.error(e); } finally { setSalvandoEdicao(false); }
  }

  async function atualizarStatusAula(id: string, novoStatus: AulaStatus) {
    try { await updateDoc(doc(db, "agenda", id), { status: novoStatus }); await carregarDados();
    } catch (e) { console.error(e); }
  }

  async function excluirAula(id: string) {
    if (window.confirm("Excluir esta aula permanentemente?")) {
      try { await deleteDoc(doc(db, "agenda", id)); await carregarDados();
      } catch (e) { console.error(e); }
    }
  }

  const fimSemanaSelecionada = useMemo(() => getFimDaSemanaPorInicio(inicioSemanaSelecionada), [inicioSemanaSelecionada]);

  const aulasFiltradasBase = useMemo(() => {
    let lista = [...aulas];
    if (filtroAluno) lista = lista.filter(a => a.alunoNome?.toLowerCase().includes(filtroAluno.toLowerCase()));
    if (filtroStatus === "hoje") lista = lista.filter(a => a.data === new Date().toISOString().split("T")[0]);
    else if (filtroStatus === "reposicao") lista = lista.filter(a => a.reposicao === "sim");
    else if (filtroStatus !== "todos") lista = lista.filter(a => a.status === filtroStatus);
    return lista;
  }, [aulas, filtroAluno, filtroStatus]);

  const aulasDaSemanaSelecionada = useMemo(() => 
    aulasFiltradasBase.filter(a => a.data! >= inicioSemanaSelecionada && a.data! <= fimSemanaSelecionada)
  , [aulasFiltradasBase, inicioSemanaSelecionada, fimSemanaSelecionada]);

  const mapaSemanal = useMemo(() => {
    const est: Record<string, Aula[]> = { segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] };
    aulasDaSemanaSelecionada.forEach(a => { const c = getChaveDiaSemana(a.data!); if (est[c]) est[c].push(a); });
    Object.keys(est).forEach(c => est[c].sort((a, b) => a.hora!.localeCompare(b.hora!)));
    return est;
  }, [aulasDaSemanaSelecionada]);

  const gradeSemanal = useMemo(() => {
    const grade: Record<string, Record<string, Aula[]>> = {};
    diasSemana.forEach(d => { grade[d.chave] = {}; horariosFixos.forEach(h => grade[d.chave][h] = []); });
    aulasDaSemanaSelecionada.forEach(a => {
      const chaveDia = getChaveDiaSemana(a.data!); const horaBase = normalizarHoraParaGrade(a.hora);
      if (grade[chaveDia]?.[horaBase]) grade[chaveDia][horaBase].push(a);
    });
    return grade;
  }, [aulasDaSemanaSelecionada]);

  const percentualPresencaMes = useMemo(() => {
    const base = presencasMes + faltasMes + canceladasMes;
    return base === 0 ? 0 : Math.round((presencasMes / base) * 100);
  }, [presencasMes, faltasMes, canceladasMes]);

  return (
    <div style={pagina}>
      <section style={hero}>
        <div style={heroPrincipal}>
          <p style={eyebrow}>Agenda e controle de aulas</p>
          <h1 style={titulo}>Agenda</h1>
          <p style={descricao}>Visualize e organize seus atendimentos de forma profissional.</p>
        </div>
        <div style={heroResumoGrid}>
          <div style={heroResumo}><p style={heroResumoRotulo}>Hoje</p><h2 style={heroResumoValorAzul}>{aulasHoje}</h2></div>
          <div style={heroResumo}><p style={heroResumoRotulo}>No Mês</p><h2 style={heroResumoValorVerde}>{aulasMes}</h2></div>
          <div style={heroResumo}><p style={heroResumoRotulo}>Presença Mês</p><h2 style={heroResumoValorVerde}>{percentualPresencaMes}%</h2></div>
        </div>
      </section>

      <section style={blocoPrincipal}>
        <div style={buscaCard}>
          <div style={buscaHeader}><div><p style={cardMini}>Filtros Avançados</p><h2 style={cardTitulo}>Filtrar Agenda</h2></div></div>
          <div style={buscaLinha}>
            <input style={inputBusca} placeholder="Nome do aluno" value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} />
            <button style={botaoAplicarBusca} onClick={() => setFiltroAluno(buscaAluno)}>Filtrar Aluno</button>
          </div>
          <div style={filtrosRapidos}>
            {["todos", "hoje", "pendente", "presente", "faltou", "cancelado", "reposicao"].map(f => (
              <button key={f} style={{...botaoFiltroRapido, ...(filtroStatus === f ? botaoFiltroRapidoAtivo : {})}} onClick={() => setFiltroStatus(f as any)}>{primeiraMaiuscula(f)}</button>
            ))}
          </div>
        </div>

        <div style={formCard}>
          <div style={cardHeader}><p style={cardMini}>Novo Registro</p><h2 style={cardTitulo}>Cadastrar Aula</h2></div>
          <div style={modoCadastroWrap}>
            <button style={{...modoCadastroBotao, ...(modoCadastro === "manual" ? modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("manual")}>Aula única</button>
            <button style={{...modoCadastroBotao, ...(modoCadastro === "automatico" ? modoCadastroBotaoAtivo : {})}} onClick={() => setModoCadastro("automatico")}>Recorrência mensal</button>
          </div>
          {modoCadastro === "automatico" && (
            <div style={recorrenciaCard}>
              <select style={selectSemanas} value={quantidadeSemanas} onChange={e => setQuantidadeSemanas(Number(e.target.value))}>
                {[4, 5, 6, 8].map(n => <option key={n} value={n}>{n} semanas</option>)}
              </select>
              <div style={diasSemanaCheckboxGrid}>
                {diasSemana.map(dia => (
                  <button key={dia.chave} style={{...diaSemanaChip, ...(diasSelecionados.includes(dia.chave) ? diaSemanaChipAtivo : {})}} onClick={() => setDiasSelecionados(prev => prev.includes(dia.chave) ? prev.filter(item => item !== dia.chave) : [...prev, dia.chave])}>{dia.label}</button>
                ))}
              </div>
            </div>
          )}
          <div style={formGrid}>
            <div style={campo}><label style={label}>Aluno</label>
              <select style={select} value={alunoNome} onChange={e => setAlunoNome(e.target.value)}>
                <option value="">Selecione um aluno</option>
                {alunos.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
              </select>
            </div>
            <div style={campo}><label style={label}>Data</label><input type="date" style={input} value={data} onChange={e => setData(e.target.value)} disabled={modoCadastro === "automatico"} /></div>
            <div style={campo}><label style={label}>Hora</label><input type="time" style={input} value={hora} onChange={e => setHora(e.target.value)} /></div>
            <div style={campo}><label style={label}>Foi reposição?</label><select style={select} value={reposicao} onChange={e => setReposicao(e.target.value)}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
          </div>
          <button style={botaoPrincipal} onClick={modoCadastro === "manual" ? cadastrarAula : cadastrarAulasAutomaticas}>{salvando ? "Salvando..." : "Cadastrar Aula"}</button>
        </div>

        {/* PLANILHA SEMANAL */}
        <div style={quadroSemanalCard}>
          <div style={cardHeaderPlanilha}>
            <div><p style={cardMini}>Visão Semanal</p><h2 style={cardTitulo}>Grade de Horários</h2></div>
            <div style={acoesSemana}>
              <button style={botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, -7))}>Semana anterior</button>
              <button style={botaoSemanaAtual} onClick={() => setInicioSemanaSelecionada(getInicioDaSemana(new Date()))}>Semana atual</button>
              <button style={botaoSemanaSecundario} onClick={() => setInicioSemanaSelecionada(prev => addDiasEmISO(prev, 7))}>Próxima semana</button>
            </div>
          </div>
          <p style={periodoValor}>{formatarData(inicioSemanaSelecionada)} até {formatarData(fimSemanaSelecionada)}</p>
          
          {isMobile ? (
            <div style={carrosselDias}>
              {diasSemana.map(dia => (
                <div key={dia.chave} style={cardDiaMobile}>
                  <h3 style={cardDiaTituloMobile}>{dia.label}</h3>
                  {mapaSemanal[dia.chave].map(aula => (
                    <div key={aula.id} style={{...blocoAulaMobile, background: getCorAluno(aula.alunoNome).fundo, border: `1px solid ${getCorAluno(aula.alunoNome).borda}`}}>
                      <div style={blocoAluno}>{aula.hora} - {aula.alunoNome}</div>
                      <div style={blocoAcoesStatus}>
                        <button style={botaoPresente} onClick={() => atualizarStatusAula(aula.id, "presente")}>✔</button>
                        <button style={botaoFalta} onClick={() => atualizarStatusAula(aula.id, "faltou")}>✖</button>
                        <button style={botaoMiniEditar} onClick={() => abrirEdicao(aula)}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={gradeWrapper}>
              <div style={gradeHeader}>
                <div style={celulaHorarioHeader}>Hora</div>
                {diasSemana.map(d => <div key={d.chave} style={celulaDiaHeader}>{d.label}</div>)}
              </div>
              {horariosFixos.map(h => (
                <div key={h} style={gradeLinha}>
                  <div style={celulaHorario}>{h}</div>
                  {diasSemana.map(d => (
                    <div key={d.chave} style={celulaAgenda}>
                      {gradeSemanal[d.chave][h].map(aula => (
                        <div key={aula.id} style={{...blocoAula, background: getCorAluno(aula.alunoNome).fundo}}>
                          <div style={blocoAluno}>{aula.alunoNome}</div>
                          <button style={{border:'none', background:'none', color:'#fff', cursor:'pointer'}} onClick={() => abrirEdicao(aula)}>✎</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LISTA COMPLETA */}
        <div style={listaCard}>
          <h2 style={cardTitulo}>Aulas Cadastradas</h2>
          <div style={lista}>
            {aulasFiltradasBase.map(aula => (
              <div key={aula.id} style={itemAula}>
                <div>
                  <h3 style={itemNome}>{aula.alunoNome}</h3>
                  <p style={itemData}>{formatarData(aula.data)} às {aula.hora}</p>
                </div>
                <div style={itemListaAcoes}>
                  <button style={botaoPresente} onClick={() => atualizarStatusAula(aula.id, "presente")}>✔</button>
                  <button style={botaoFalta} onClick={() => atualizarStatusAula(aula.id, "faltou")}>✖</button>
                  <button style={botaoMiniExcluir} onClick={() => excluirAula(aula.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITOR */}
      {editandoId && (
        <div ref={editorRef} style={editorCard}>
          <h2 style={cardTitulo}>Editar Aula</h2>
          <div style={formGrid}>
            <input style={input} value={editAlunoNome} onChange={e => setEditAlunoNome(e.target.value)} />
            <input type="date" style={input} value={editData} onChange={e => setEditData(e.target.value)} />
            <input type="time" style={input} value={editHora} onChange={e => setEditHora(e.target.value)} />
          </div>
          <div style={acoesEdicao}>
            <button style={botaoCancelar} onClick={() => setEditandoId("")}>Cancelar</button>
            <button style={botaoSalvarEdicao} onClick={salvarEdicao}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// UTILITÁRIOS
function getInicioDaSemana(data: Date) {
  const d = new Date(data); const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff); return d.toISOString().split("T")[0];
}
function getFimDaSemanaPorInicio(inicio: string) { return addDiasEmISO(inicio, 6); }
function addDiasEmISO(iso: string, dias: number) {
  const data = new Date(iso + "T12:00:00");
  data.setDate(data.getDate() + dias); return data.toISOString().split("T")[0];
}
function getChaveDiaSemana(iso: string) {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return dias[new Date(iso + "T12:00:00").getDay()];
}
function formatarData(iso?: string) { if (!iso) return ""; const [ano, mes, dia] = iso.split("-"); return `${dia}/${mes}/${ano}`; }
function normalizarHoraParaGrade(hora?: string) { return hora ? hora.split(":")[0].padStart(2, "0") + ":00" : ""; }
function getCorAluno(nome?: string) {
  if (!nome) return coresAluno[0];
  let s = 0; for (let i = 0; i < nome.length; i++) s += nome.charCodeAt(i);
  return coresAluno[s % coresAluno.length];
}
function primeiraMaiuscula(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }

// ESTILOS
const pagina = { display: "flex", flexDirection: "column" as const, gap: "24px", padding: "20px", maxWidth: "1400px", margin: "0 auto", background: "#0f172a", color: "#fff" };
const hero = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const heroPrincipal = { padding: "28px", background: "rgba(255,255,255,0.05)", borderRadius: "28px" };
const eyebrow = { fontSize: "14px", color: "rgba(255,255,255,0.6)" };
const titulo = { fontSize: "48px", fontWeight: 900, margin: "10px 0" };
const descricao = { fontSize: "16px", color: "rgba(255,255,255,0.7)" };
const heroResumoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" };
const heroResumo = { padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", textAlign: "center" as const };
const heroResumoRotulo = { fontSize: "12px", color: "rgba(255,255,255,0.6)" };
const heroResumoValorAzul = { fontSize: "32px", color: "#60a5fa" };
const heroResumoValorVerde = { fontSize: "32px", color: "#4ade80" };
const blocoPrincipal = { display: "flex", flexDirection: "column" as const, gap: "24px" };
const buscaCard = { padding: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "30px" };
const buscaHeader = { marginBottom: "15px" };
const buscaLinha = { display: "flex", gap: "10px", marginBottom: "15px" };
const inputBusca = { flex: 1, height: "50px", borderRadius: "12px", padding: "0 15px", background: "#1e293b", border: "1px solid #334155", color: "#fff" };
const botaoAplicarBusca = { padding: "0 20px", borderRadius: "12px", background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700 };
const filtrosRapidos = { display: "flex", gap: "8px", flexWrap: "wrap" as const };
const botaoFiltroRapido = { padding: "8px 15px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" };
const botaoFiltroRapidoAtivo = { background: "#22c55e" };
const cardTitulo = { fontSize: "24px", fontWeight: 800, marginBottom: "20px" };
const quadroSemanalCard = { padding: "30px", background: "rgba(255,255,255,0.05)", borderRadius: "30px" };
const cardHeaderPlanilha = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const acoesSemana = { display: "flex", gap: "10px" };
const botaoSemanaSecundario = { padding: "8px 15px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" };
const botaoSemanaAtual = { padding: "8px 15px", borderRadius: "10px", background: "#3b82f6", color: "#fff", border: "none" };
const gradeWrapper = { overflowX: "auto" as const, borderRadius: "20px", border: "1px solid #334155" };
const gradeHeader = { display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", background: "#1e293b" };
const celulaHorarioHeader = { padding: "15px", textAlign: "center" as const, fontWeight: 800 };
const celulaDiaHeader = { padding: "15px", textAlign: "center" as const, fontWeight: 800, borderLeft: "1px solid #334155" };
const gradeLinha = { display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", borderTop: "1px solid #334155" };
const celulaHorario = { padding: "15px", textAlign: "center" as const, background: "#1e293b", fontWeight: 700 };
const celulaAgenda = { padding: "10px", borderLeft: "1px solid #334155", minHeight: "80px" };
const blocoAula = { padding: "8px", borderRadius: "10px", marginBottom: "5px", color: "#000", fontWeight: 700, fontSize: "12px" };
const blocoAluno = { marginBottom: "5px" };
const carrosselDias = { display: "flex", gap: "15px", overflowX: "auto" as const };
const cardDiaMobile = { minWidth: "280px", padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "20px" };
const cardDiaTituloMobile = { fontSize: "18px", marginBottom: "10px" };
const blocoAulaMobile = { padding: "12px", borderRadius: "15px", marginBottom: "10px" };
const blocoAcoesStatus = { display: "flex", gap: "5px", marginTop: "10px" };
const botaoPresente = { flex: 1, padding: "8px", borderRadius: "10px", background: "#22c55e", color: "#fff", border: "none" };
const botaoFalta = { flex: 1, padding: "8px", borderRadius: "10px", background: "#ef4444", color: "#fff", border: "none" };
const botaoMiniEditar = { padding: "5px 10px", borderRadius: "8px", background: "#3b82f6", color: "#fff", border: "none" };
const botaoMiniExcluir = { padding: "5px 10px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none" };
const cardMini = { margin: 0, color: "rgba(255,255,255,0.56)", fontSize: "13px", textTransform: "uppercase" as const, letterSpacing: "0.8px" };
const cardHeader = { position: "relative" as const, zIndex: 1, marginBottom: "22px" };
const formCard = { padding: "30px", background: "rgba(255,255,255,0.05)", borderRadius: "30px" };
const modoCadastroWrap = { display: "flex", gap: "10px", marginBottom: "20px" };
const modoCadastroBotao = { padding: "10px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer" };
const modoCadastroBotaoAtivo = { background: "#3b82f6" };
const recorrenciaCard = { padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", marginBottom: "20px" };
const selectSemanas = { width: "100%", height: "45px", borderRadius: "10px", background: "#1e293b", color: "#fff", marginBottom: "15px" };
const diasSemanaCheckboxGrid = { display: "flex", gap: "8px", flexWrap: "wrap" as const };
const diaSemanaChip = { padding: "8px 12px", borderRadius: "15px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: "12px" };
const diaSemanaChipAtivo = { background: "#22c55e" };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" };
const campo = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const label = { fontSize: "14px", fontWeight: 600 };
const input = { height: "50px", borderRadius: "12px", padding: "0 15px", background: "#1e293b", border: "1px solid #334155", color: "#fff" };
const select = { height: "50px", borderRadius: "12px", padding: "0 15px", background: "#1e293b", border: "1px solid #334155", color: "#fff" };
const botaoPrincipal = { width: "100%", height: "55px", borderRadius: "15px", background: "#22c55e", color: "#fff", border: "none", fontWeight: 800, fontSize: "16px", cursor: "pointer" };
const periodoValor = { color: "#ffffff", fontSize: "17px", fontWeight: 800, textAlign: 'center' as const, marginBottom: '15px' };
const listaCard = { padding: "30px", background: "rgba(255,255,255,0.05)", borderRadius: "30px" };
const lista = { display: "flex", flexDirection: "column" as const, gap: "15px" };
const itemAula = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "20px" };
const itemNome = { fontSize: "18px", fontWeight: 700, color: '#fff' };
const itemData = { fontSize: "14px", color: "rgba(255,255,255,0.6)" };
const itemListaAcoes = { display: "flex", gap: "10px" };
const editorCard = { position: "fixed" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "500px", padding: "30px", background: "#1e293b", borderRadius: "30px", boxShadow: "0 0 50px rgba(0,0,0,0.5)", zIndex: 1000 };
const acoesEdicao = { display: "flex", gap: "10px", marginTop: "20px" };
const botaoCancelar = { flex: 1, height: "50px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" };
const botaoSalvarEdicao = { flex: 1, height: "50px", borderRadius: "12px", background: "#22c55e", color: "#fff", border: "none" };