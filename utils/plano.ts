export type PlanoAssinatura = "mensal" | "trimestral" | "anual";

export function getValorPlano(plano: PlanoAssinatura): number {
  if (plano === "trimestral") return 45;
  if (plano === "anual") return 120;
  return 19.99;
}

export function calcularFimTrial(): Date {
  const data = new Date();
  data.setDate(data.getDate() + 3);
  return data;
}

export function calcularVencimentoPorPlano(plano: PlanoAssinatura): Date {
  const data = new Date();

  if (plano === "trimestral") {
    data.setMonth(data.getMonth() + 3);
    return data;
  }

  if (plano === "anual") {
    data.setFullYear(data.getFullYear() + 1);
    return data;
  }

  data.setMonth(data.getMonth() + 1);
  return data;
}