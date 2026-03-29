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

type Aluno = {
  id: string;
  nome?: string;
  telefone?: string;
  valor?: string;
  diaVencimento?: number;
  pagamentoStatus?: string;
  userId?: string;
};

/**
 * Gera notificações para mensalidades:
 * - 1 dia antes do vencimento
 * - No dia do vencimento
 * - Quando atrasada
 */
export async function gerarNotificacoesMensalidades(userId: string): Promise<number> {
  if (!userId) return 0;

  const ref = collection(db, "alunos");
  const q = query(ref, where("userId", "==", userId));

  const snap = await getDocs(q);
  const alunos = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Aluno[];

  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const mesAno = `${String(mesAtual + 1).padStart(2, "0")}/${anoAtual}`;

  let notificacoesCriadas = 0;

  for (const aluno of alunos) {
    if (!aluno.diaVencimento) continue;

    const diaVenc = aluno.diaVencimento;
    const identificador = `${aluno.id}_${mesAno}`;

    // Verificar se já existe notificação para este aluno/mês
    const existe = await verificarNotificacaoExistente(userId, "mensalidade", identificador);
    if (existe) continue;

    // Verificar status do pagamento
    const statusPagamento = aluno.pagamentoStatus?.toLowerCase() || "pendente";
    
    // Se já está pago, não criar notificação
    if (statusPagamento === "pago") continue;

    // Calcular diferença de dias
    const diffDias = diaVenc - diaHoje;

    // 1 dia antes do vencimento
    if (diffDias === 1) {
      await criarNotificacao({
        tipo: "mensalidade",
        titulo: "Mensalidade vence amanhã",
        mensagem: `A mensalidade de ${aluno.nome || "aluno"} vence amanhã (dia ${diaVenc}). Valor: R$ ${aluno.valor || "0"}`,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        data: mesAno,
        userId,
        status: "pendente",
        scheduledFor: new Date().toISOString(),
      });
      notificacoesCriadas++;
    }
    // No dia do vencimento
    else if (diffDias === 0) {
      await criarNotificacao({
        tipo: "mensalidade",
        titulo: "Mensalidade vence hoje",
        mensagem: `A mensalidade de ${aluno.nome || "aluno"} vence hoje! Valor: R$ ${aluno.valor || "0"}`,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        data: mesAno,
        userId,
        status: "pendente",
        scheduledFor: new Date().toISOString(),
      });
      notificacoesCriadas++;
    }
    // Atrasada (pagamentoStatus = "atrasado" ou passou do dia)
    else if (statusPagamento === "atrasado" || diffDias < 0) {
      const diasAtrasados = Math.abs(diffDias);
      await criarNotificacao({
        tipo: "mensalidade",
        titulo: "Mensalidade atrasada",
        mensagem: `A mensalidade de ${aluno.nome || "aluno"} está atrasada há ${diasAtrasados} dia${diasAtrasados > 1 ? "s" : ""}. Valor: R$ ${aluno.valor || "0"}`,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        data: mesAno,
        userId,
        status: "pendente",
        scheduledFor: new Date().toISOString(),
      });
      notificacoesCriadas++;
    }
  }

  return notificacoesCriadas;
}

/**
 * Gera um resumo financeiro do mês
 */
export async function gerarResumoFinanceiroMensal(userId: string): Promise<number> {
  if (!userId) return 0;

  const ref = collection(db, "alunos");
  const q = query(ref, where("userId", "==", userId));

  const snap = await getDocs(q);
  const alunos = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Aluno[];

  const hoje = new Date();
  const mesAno = `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
  const identificador = `resumo_${mesAno}`;

  // Verificar se já existe resumo para este mês
  const existe = await verificarNotificacaoExistente(userId, "mensalidade", identificador);
  if (existe) return 0;

  // Contar pagamentos pendentes e atrasados
  const pendentes = alunos.filter(
    (a) => a.pagamentoStatus?.toLowerCase() === "pendente"
  ).length;
  const atrasados = alunos.filter(
    (a) => a.pagamentoStatus?.toLowerCase() === "atrasado"
  ).length;

  if (pendentes === 0 && atrasados === 0) return 0;

  await criarNotificacao({
    tipo: "mensalidade",
    titulo: "Resumo financeiro",
    mensagem: `${pendentes} mensalidade${pendentes !== 1 ? "s" : ""} pendente${pendentes !== 1 ? "s" : ""}, ${atrasados} atrasada${atrasados !== 1 ? "s" : ""}`,
    alunoId: identificador,
    data: mesAno,
    userId,
    status: "pendente",
    scheduledFor: new Date().toISOString(),
  });

  return 1;
}
