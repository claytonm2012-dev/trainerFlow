import {
  doc,
  getDoc,
} from "firebase/firestore";
import db from "@/app/firebaseDb";
import {
  criarNotificacao,
  verificarNotificacaoExistente,
} from "./notificacoes";

type PersonalData = {
  nome?: string;
  email?: string;
  plano?: string;
  valorPlano?: number;
  statusAcesso?: string;
  pagamentoStatus?: string;
  trialFim?: string;
};

/**
 * Gera notificações sobre a assinatura do app:
 * - 3 dias antes do vencimento
 * - No dia do vencimento
 * - Trial prestes a acabar
 */
export async function gerarNotificacoesAssinatura(userId: string): Promise<number> {
  if (!userId) return 0;

  // Buscar dados do personal (usuário logado)
  const personalRef = doc(db, "usuarios", userId);
  const personalSnap = await getDoc(personalRef);

  if (!personalSnap.exists()) return 0;

  const personal = personalSnap.data() as PersonalData;
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split("T")[0];

  let notificacoesCriadas = 0;

  // Verificar trial
  if (personal.statusAcesso === "trial" && personal.trialFim) {
    const trialFim = new Date(personal.trialFim);
    const diffMs = trialFim.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // 3 dias antes do trial acabar
    if (diffDias === 3) {
      const identificador = `trial_3dias_${dataHoje}`;
      const existe = await verificarNotificacaoExistente(userId, "assinatura", identificador);
      
      if (!existe) {
        await criarNotificacao({
          tipo: "assinatura",
          titulo: "Trial acaba em 3 dias",
          mensagem: "Seu período de teste gratuito termina em 3 dias. Escolha um plano para continuar usando o TrainerFlow.",
          data: identificador,
          userId,
          status: "pendente",
          scheduledFor: new Date().toISOString(),
        });
        notificacoesCriadas++;
      }
    }
    // No dia que o trial acaba
    else if (diffDias === 0) {
      const identificador = `trial_hoje_${dataHoje}`;
      const existe = await verificarNotificacaoExistente(userId, "assinatura", identificador);
      
      if (!existe) {
        await criarNotificacao({
          tipo: "assinatura",
          titulo: "Trial termina hoje",
          mensagem: "Seu período de teste gratuito termina hoje! Assine agora para não perder acesso.",
          data: identificador,
          userId,
          status: "pendente",
          scheduledFor: new Date().toISOString(),
        });
        notificacoesCriadas++;
      }
    }
    // Trial expirado
    else if (diffDias < 0) {
      const identificador = `trial_expirado_${dataHoje}`;
      const existe = await verificarNotificacaoExistente(userId, "assinatura", identificador);
      
      if (!existe) {
        await criarNotificacao({
          tipo: "assinatura",
          titulo: "Trial expirado",
          mensagem: "Seu período de teste acabou. Assine um plano para continuar usando o TrainerFlow.",
          data: identificador,
          userId,
          status: "pendente",
          scheduledFor: new Date().toISOString(),
        });
        notificacoesCriadas++;
      }
    }
  }

  // Verificar pagamento pendente da assinatura
  if (personal.pagamentoStatus === "pendente" && personal.statusAcesso !== "trial") {
    const identificador = `pagamento_pendente_${dataHoje}`;
    const existe = await verificarNotificacaoExistente(userId, "assinatura", identificador);
    
    if (!existe) {
      await criarNotificacao({
        tipo: "assinatura",
        titulo: "Pagamento pendente",
        mensagem: `Seu plano ${formatarPlano(personal.plano)} está com pagamento pendente. Regularize para manter seu acesso.`,
        data: identificador,
        userId,
        status: "pendente",
        scheduledFor: new Date().toISOString(),
      });
      notificacoesCriadas++;
    }
  }

  // Verificar acesso bloqueado
  if (personal.statusAcesso === "bloqueado") {
    const identificador = `bloqueado_${dataHoje}`;
    const existe = await verificarNotificacaoExistente(userId, "assinatura", identificador);
    
    if (!existe) {
      await criarNotificacao({
        tipo: "assinatura",
        titulo: "Acesso bloqueado",
        mensagem: "Seu acesso ao TrainerFlow está bloqueado. Entre em contato ou regularize sua assinatura.",
        data: identificador,
        userId,
        status: "pendente",
        scheduledFor: new Date().toISOString(),
      });
      notificacoesCriadas++;
    }
  }

  return notificacoesCriadas;
}

function formatarPlano(plano?: string): string {
  if (!plano) return "";
  const labels: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    anual: "Anual",
  };
  return labels[plano] || plano;
}
