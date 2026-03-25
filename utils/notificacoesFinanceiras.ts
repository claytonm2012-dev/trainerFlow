type AlunoFinanceiro = {
  id?: string;
  nome?: string;
  valor?: string | number;
  pagamentoStatus?: string;
  diaVencimento?: number;
};

export function getAvisosFinanceiros(alunos: AlunoFinanceiro[]) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();

  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);
  const diaAmanha = amanha.getDate();

  const vencemHoje = alunos.filter((aluno) => {
    return (
      Number(aluno.diaVencimento) === diaHoje &&
      aluno.pagamentoStatus !== "pago"
    );
  });

  const vencemAmanha = alunos.filter((aluno) => {
    return (
      Number(aluno.diaVencimento) === diaAmanha &&
      aluno.pagamentoStatus !== "pago"
    );
  });

  const atrasados = alunos.filter((aluno) => {
    const diaVencimento = Number(aluno.diaVencimento || 0);

    return (
      diaVencimento > 0 &&
      diaHoje > diaVencimento &&
      aluno.pagamentoStatus !== "pago"
    );
  });

  return {
    vencemHoje,
    vencemAmanha,
    atrasados,
  };
}