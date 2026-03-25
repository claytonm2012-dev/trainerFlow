type AcessoInput = {
  statusAcesso?: string;
  pagamentoStatus?: string;
  trialFim?: string;
  vencimentoEm?: string | null;
  tipo?: string;
};

export function acessoBloqueado({
  statusAcesso,
  pagamentoStatus,
  trialFim,
  vencimentoEm,
  tipo,
}: AcessoInput): boolean {
  if (tipo === "admin") return false;

  const agora = new Date();

  if (statusAcesso === "bloqueado") {
    return true;
  }

  if (statusAcesso === "trial") {
    if (!trialFim) return false;

    const fimTrial = new Date(trialFim);

    if (!Number.isNaN(fimTrial.getTime()) && agora > fimTrial) {
      return true;
    }
  }

  if (statusAcesso === "ativo") {
    if (pagamentoStatus === "atrasado") {
      return true;
    }

    if (vencimentoEm) {
      const vencimento = new Date(vencimentoEm);

      if (!Number.isNaN(vencimento.getTime()) && agora > vencimento) {
        return true;
      }
    }
  }

  return false;
}