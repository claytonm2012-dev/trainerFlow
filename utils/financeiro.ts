export type StatusFinanceiro = "pendente" | "pago";

export function gerarMesAtual() {
  const data = new Date();
  return `${data.getMonth() + 1}/${data.getFullYear()}`;
}

export function calcularMensalidade(qtdAulas: number) {
  const valorAula = 50;
  return qtdAulas * valorAula;
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ordenarMesAno(mes: string) {
  if (!mes) return 0;

  const [m, ano] = mes.split("/");

  return Number(ano) * 100 + Number(m);
}