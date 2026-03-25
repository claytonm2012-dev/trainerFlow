export type PlanoAssinatura = "mensal" | "trimestral" | "anual";

export function getValorAssinatura(plano: PlanoAssinatura) {
  if (plano === "mensal") return 19.99;
  if (plano === "trimestral") return 45;
  return 120;
}

export function formatarPlanoAssinatura(plano: PlanoAssinatura) {
  if (plano === "mensal") return "Mensal";
  if (plano === "trimestral") return "Trimestral";
  return "Anual";
}

export function gerarLinkWhatsAppAssinatura(params: {
  nome?: string;
  email?: string;
  plano: PlanoAssinatura;
}) {
  const numero = "5535984735176";

  const valor = getValorAssinatura(params.plano);
  const planoFormatado = formatarPlanoAssinatura(params.plano);

  const mensagem =
    `Olá! Quero assinar o TrainerFlow.\n\n` +
    `Plano escolhido: ${planoFormatado}\n` +
    `Valor: R$ ${valor.toFixed(2).replace(".", ",")}\n` +
    `Nome: ${params.nome || ""}\n` +
    `E-mail: ${params.email || ""}\n\n` +
    `Pode me passar as orientações para pagamento?`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}