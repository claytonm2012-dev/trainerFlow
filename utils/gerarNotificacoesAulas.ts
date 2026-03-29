import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import db from "@/app/firebaseDb";
import {
  criarNotificacao,
  verificarNotificacaoExistente,
} from "./notificacoes";

type Aula = {
  id: string;
  alunoId?: string;
  alunoNome?: string;
  data?: string;
  hora?: string;
  status?: string;
  userId?: string;
};

/**
 * Gera notificações para aulas que estão prestes a acontecer (30 min antes)
 * Deve ser chamada periodicamente (a cada 1-5 minutos)
 */
export async function gerarNotificacoesAulas(userId: string): Promise<number> {
  if (!userId) return 0;

  const agora = new Date();
  const em30Min = new Date(agora.getTime() + 30 * 60 * 1000);
  const em2Horas = new Date(agora.getTime() + 2 * 60 * 60 * 1000);

  // Buscar aulas do dia atual
  const hoje = agora.toISOString().split("T")[0];

  const ref = collection(db, "aulas");
  const q = query(
    ref,
    where("userId", "==", userId),
    where("data", "==", hoje),
    where("status", "==", "pendente")
  );

  const snap = await getDocs(q);
  const aulas = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Aula[];

  let notificacoesCriadas = 0;

  for (const aula of aulas) {
    if (!aula.hora || !aula.data) continue;

    // Converter hora da aula para Date
    const [horas, minutos] = aula.hora.split(":").map(Number);
    const dataAula = new Date(`${aula.data}T${aula.hora}:00`);

    // Verificar se a aula está entre agora e 2 horas no futuro
    if (dataAula < agora || dataAula > em2Horas) continue;

    // Calcular quando deve aparecer a notificação (30 min antes)
    const scheduledFor = new Date(dataAula.getTime() - 30 * 60 * 1000);

    // Se já passou o horário de agendar mas ainda não passou a aula,
    // agendar para agora
    const agendar = scheduledFor < agora ? agora : scheduledFor;

    // Verificar se já existe notificação para esta aula
    const existe = await verificarNotificacaoExistente(userId, "aula", aula.id);
    if (existe) continue;

    // Criar notificação
    await criarNotificacao({
      tipo: "aula",
      titulo: "Aula em breve",
      mensagem: `Aula com ${aula.alunoNome || "aluno"} às ${aula.hora}`,
      aulaId: aula.id,
      alunoId: aula.alunoId,
      alunoNome: aula.alunoNome,
      data: aula.data,
      hora: aula.hora,
      userId,
      status: "pendente",
      scheduledFor: agendar.toISOString(),
    });

    notificacoesCriadas++;
  }

  return notificacoesCriadas;
}

/**
 * Verifica e gera notificações para aulas do dia seguinte (resumo matinal)
 */
export async function gerarResumoAulasDiaSeguinte(userId: string): Promise<number> {
  if (!userId) return 0;

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dataAmanha = amanha.toISOString().split("T")[0];

  const ref = collection(db, "aulas");
  const q = query(
    ref,
    where("userId", "==", userId),
    where("data", "==", dataAmanha),
    where("status", "==", "pendente")
  );

  const snap = await getDocs(q);
  const aulas = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Aula[];

  if (aulas.length === 0) return 0;

  // Verificar se já existe notificação de resumo para amanhã
  const identificador = `resumo_${dataAmanha}`;
  const existe = await verificarNotificacaoExistente(userId, "aula", identificador);
  if (existe) return 0;

  // Criar notificação de resumo
  const primeiraAula = aulas.sort((a, b) => 
    (a.hora || "").localeCompare(b.hora || "")
  )[0];

  await criarNotificacao({
    tipo: "aula",
    titulo: "Aulas amanhã",
    mensagem: `Você tem ${aulas.length} aula${aulas.length > 1 ? "s" : ""} amanhã. Primeira às ${primeiraAula.hora || "--"}`,
    aulaId: identificador,
    userId,
    status: "pendente",
    scheduledFor: new Date().toISOString(), // Exibir agora
  });

  return 1;
}
