export function limparTelefoneWhatsApp(telefone?: string) {
  if (!telefone) return "";

  const numeros = telefone.replace(/\D/g, "");

  if (!numeros) return "";

  if (numeros.startsWith("55")) {
    return numeros;
  }

  return `55${numeros}`;
}

type MensagemCobrancaParams = {
  nome?: string;
  valor?: string | number;
  diaVencimento?: number;
  status?: string;
};

function formatarValorMensagem(valor?: string | number) {
  if (valor === undefined || valor === null || `${valor}`.trim() === "") {
    return "valor não informado";
  }

  return `R$ ${valor}`;
}

function getSituacaoMensagem(diaVencimento?: number, status?: string) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();

  if (status === "atrasado") return "atrasado";

  if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
    return "geral";
  }

  if (diaVencimento < diaHoje && status !== "pago") {
    return "atrasado";
  }

  if (diaVencimento === diaHoje && status !== "pago") {
    return "vence_hoje";
  }

  if (diaVencimento === diaHoje + 1 && status !== "pago") {
    return "vence_amanha";
  }

  if (status === "pendente") {
    return "pendente";
  }

  return "geral";
}

export function gerarMensagemCobranca({
  nome,
  valor,
  diaVencimento,
  status,
}: MensagemCobrancaParams) {
  const nomeAluno = nome || "aluno";
  const valorFormatado = formatarValorMensagem(valor);
  const vencimentoTexto = diaVencimento
    ? `dia ${diaVencimento}`
    : "data não informada";

  const situacao = getSituacaoMensagem(diaVencimento, status);

  if (situacao === "atrasado") {
    return `Olá, ${nomeAluno}! Tudo bem?

Passando para te avisar que a mensalidade referente às suas aulas está em aberto e o vencimento já passou.

📅 Vencimento: ${vencimentoTexto}
💰 Valor: ${valorFormatado}

Quando puder, peço por gentileza que verifique esse pagamento.

Agradeço pela preferência, pela confiança e por acreditar no meu trabalho 🙏

Qualquer dúvida, estou à disposição!`;
  }

  if (situacao === "vence_hoje") {
    return `Olá, ${nomeAluno}! Tudo bem?

Passando para te lembrar que a mensalidade das suas aulas vence hoje.

📅 Vencimento: ${vencimentoTexto}
💰 Valor: ${valorFormatado}

Agradeço muito pela preferência e por confiar no meu trabalho 🙏

Qualquer dúvida, estou à disposição!`;
  }

  if (situacao === "vence_amanha") {
    return `Olá, ${nomeAluno}! Tudo bem?

Passando para te lembrar que a mensalidade das suas aulas vence amanhã.

📅 Vencimento: ${vencimentoTexto}
💰 Valor: ${valorFormatado}

Agradeço pela preferência e por acreditar no meu trabalho 🙏

Qualquer dúvida, estou à disposição!`;
  }

  if (situacao === "pendente") {
    return `Olá, ${nomeAluno}! Tudo bem?

Este é um lembrete referente à mensalidade das suas aulas.

📅 Vencimento: ${vencimentoTexto}
💰 Valor: ${valorFormatado}

Muito obrigado pela preferência e por confiar no meu trabalho 🙏

Qualquer dúvida, estou à disposição!`;
  }

  return `Olá, ${nomeAluno}! Tudo bem?

Estou entrando em contato referente à sua mensalidade das aulas.

📅 Vencimento: ${vencimentoTexto}
💰 Valor: ${valorFormatado}

Agradeço muito pela preferência e por acreditar no meu trabalho 🙏

Qualquer dúvida, estou à disposição!`;
}

type GerarLinkWhatsAppParams = {
  telefone?: string;
  nome?: string;
  valor?: string | number;
  diaVencimento?: number;
  status?: string;
};

export function gerarLinkWhatsApp({
  telefone,
  nome,
  valor,
  diaVencimento,
  status,
}: GerarLinkWhatsAppParams) {
  const telefoneLimpo = limparTelefoneWhatsApp(telefone);

  const mensagem = gerarMensagemCobranca({
    nome,
    valor,
    diaVencimento,
    status,
  });

  const texto = encodeURIComponent(mensagem);

  if (!telefoneLimpo) {
    return `https://wa.me/?text=${texto}`;
  }

  return `https://wa.me/${telefoneLimpo}?text=${texto}`;
}