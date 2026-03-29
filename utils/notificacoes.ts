import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import db from "@/app/firebaseDb";

// ============================================================================
// TYPES
// ============================================================================

export type TipoNotificacao = "aula" | "mensalidade" | "assinatura";
export type StatusNotificacao = "pendente" | "enviada" | "lida";

export type Notificacao = {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  
  // Dados específicos
  aulaId?: string;
  alunoId?: string;
  alunoNome?: string;
  data?: string;
  hora?: string;
  
  userId: string;
  status: StatusNotificacao;
  scheduledFor: string; // ISO timestamp - quando exibir
  createdAt: string;
  readAt?: string;
};

export type NotificacaoInput = Omit<Notificacao, "id" | "createdAt">;

// ============================================================================
// CORES POR TIPO
// ============================================================================

export const coresNotificacao: Record<TipoNotificacao, {
  background: string;
  border: string;
  color: string;
  glow: string;
  icon: string;
}> = {
  aula: {
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)",
    color: "#60a5fa",
    glow: "0 0 20px rgba(59,130,246,0.2)",
    icon: "calendar",
  },
  mensalidade: {
    background: "rgba(250,204,21,0.15)",
    border: "1px solid rgba(250,204,21,0.3)",
    color: "#fde047",
    glow: "0 0 20px rgba(250,204,21,0.2)",
    icon: "dollar",
  },
  assinatura: {
    background: "rgba(168,85,247,0.15)",
    border: "1px solid rgba(168,85,247,0.3)",
    color: "#c084fc",
    glow: "0 0 20px rgba(168,85,247,0.2)",
    icon: "star",
  },
};

// ============================================================================
// FUNÇÕES DE CRUD
// ============================================================================

/**
 * Busca todas as notificações de um usuário
 */
export async function buscarNotificacoes(userId: string): Promise<Notificacao[]> {
  if (!userId) return [];
  
  const ref = collection(db, "notificacoes");
  const q = query(
    ref,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Notificacao[];
}

/**
 * Busca notificações pendentes que devem ser exibidas agora
 */
export async function buscarNotificacoesPendentes(userId: string): Promise<Notificacao[]> {
  if (!userId) return [];
  
  const agora = new Date().toISOString();
  const ref = collection(db, "notificacoes");
  
  // Buscar pendentes
  const q = query(
    ref,
    where("userId", "==", userId),
    where("status", "==", "pendente")
  );
  
  const snap = await getDocs(q);
  const todas = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Notificacao[];
  
  // Filtrar as que já passaram do scheduledFor
  return todas.filter((n) => n.scheduledFor <= agora);
}

/**
 * Busca notificações não lidas
 */
export async function buscarNotificacoesNaoLidas(userId: string): Promise<Notificacao[]> {
  if (!userId) return [];
  
  const ref = collection(db, "notificacoes");
  const q = query(
    ref,
    where("userId", "==", userId),
    where("status", "in", ["pendente", "enviada"])
  );
  
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Notificacao[];
}

/**
 * Conta notificações não lidas
 */
export async function contarNotificacoesNaoLidas(userId: string): Promise<number> {
  const naoLidas = await buscarNotificacoesNaoLidas(userId);
  return naoLidas.length;
}

/**
 * Cria uma nova notificação
 */
export async function criarNotificacao(input: NotificacaoInput): Promise<string> {
  const ref = collection(db, "notificacoes");
  const docRef = await addDoc(ref, {
    ...input,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Marca uma notificação como enviada (toast exibido)
 */
export async function marcarComoEnviada(notificacaoId: string): Promise<void> {
  const ref = doc(db, "notificacoes", notificacaoId);
  await updateDoc(ref, {
    status: "enviada",
  });
}

/**
 * Marca uma notificação como lida
 */
export async function marcarComoLida(notificacaoId: string): Promise<void> {
  const ref = doc(db, "notificacoes", notificacaoId);
  await updateDoc(ref, {
    status: "lida",
    readAt: new Date().toISOString(),
  });
}

/**
 * Marca todas as notificações como lidas
 */
export async function marcarTodasComoLidas(userId: string): Promise<void> {
  const naoLidas = await buscarNotificacoesNaoLidas(userId);
  const agora = new Date().toISOString();
  
  for (const n of naoLidas) {
    const ref = doc(db, "notificacoes", n.id);
    await updateDoc(ref, {
      status: "lida",
      readAt: agora,
    });
  }
}

/**
 * Exclui uma notificação
 */
export async function excluirNotificacao(notificacaoId: string): Promise<void> {
  const ref = doc(db, "notificacoes", notificacaoId);
  await deleteDoc(ref);
}

/**
 * Verifica se já existe uma notificação para evitar duplicatas
 */
export async function verificarNotificacaoExistente(
  userId: string,
  tipo: TipoNotificacao,
  identificador: string // aulaId, alunoId+mes, etc.
): Promise<boolean> {
  const ref = collection(db, "notificacoes");
  
  if (tipo === "aula") {
    const q = query(
      ref,
      where("userId", "==", userId),
      where("tipo", "==", "aula"),
      where("aulaId", "==", identificador)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }
  
  if (tipo === "mensalidade") {
    // identificador = "alunoId_mesAno"
    const [alunoId, mesAno] = identificador.split("_");
    const q = query(
      ref,
      where("userId", "==", userId),
      where("tipo", "==", "mensalidade"),
      where("alunoId", "==", alunoId)
    );
    const snap = await getDocs(q);
    // Verificar se já existe para este mês
    return snap.docs.some((d) => {
      const data = d.data();
      return data.data?.includes(mesAno);
    });
  }
  
  if (tipo === "assinatura") {
    // identificador = data da verificação
    const q = query(
      ref,
      where("userId", "==", userId),
      where("tipo", "==", "assinatura"),
      where("data", "==", identificador)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }
  
  return false;
}

// ============================================================================
// FORMATADORES
// ============================================================================

export function formatarTipoNotificacao(tipo: TipoNotificacao): string {
  const labels: Record<TipoNotificacao, string> = {
    aula: "Aula",
    mensalidade: "Mensalidade",
    assinatura: "Assinatura",
  };
  return labels[tipo] || tipo;
}

export function formatarDataHora(isoString?: string): string {
  if (!isoString) return "--";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

export function formatarTempoRelativo(isoString?: string): string {
  if (!isoString) return "";
  
  try {
    const date = new Date(isoString);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return "Ontem";
    if (diffDias < 7) return `${diffDias} dias atrás`;
    
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}
