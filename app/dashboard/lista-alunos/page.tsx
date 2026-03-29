"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import db from "../../firebaseDb";
import auth from "../../firebaseAuth";
import { useRouter } from "next/navigation";
import { gerarLinkWhatsApp } from "../../../utils/whatsapp";

type Aluno = {
  id: string;
  nome?: string;
  telefone?: string;
  tipoPlano?: string;
  tipoPagamento?: string;
  formaCobranca?: string;
  valor?: string;
  reposicoes?: number;
  status?: string;
  pagamentoStatus?: string;
  diaVencimento?: number;
  userId?: string;
};

export default function ListaAlunosPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 900);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

useEffect(() => {
  const user = auth.currentUser;

  if (!user) {
    router.push("/login");
  }
}, [router]);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState("");
  const [buscaNome, setBuscaNome] = useState("");

  async function carregarAlunos() {
    try {
      setCarregando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        setAlunos([]);
        return;
      }

      const snapshot = await getDocs(
        query(collection(db, "students"), where("userId", "==", user.uid))
      );

      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aluno[];

      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

      setAlunos(lista);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      alert("Erro ao carregar alunos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
  const user = auth.currentUser;

  if (!user) {
    router.push("/login");
    return;
  }

  carregarAlunos();
}, [router]);

  async function excluirAluno(id: string, nome?: string) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o aluno${nome ? ` ${nome}` : ""}?`
    );

    if (!confirmar) return;

    try {
      setProcessandoId(id);
      await deleteDoc(doc(db, "students", id));
      await carregarAlunos();
      alert("Aluno excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      alert("Erro ao excluir aluno");
    } finally {
      setProcessandoId("");
    }
  }

  function abrirFinanceiroAluno(aluno: Aluno) {
    router.push(
      `/dashboard/financeiro?aluno=${encodeURIComponent(aluno.nome || "")}`
    );
  }

  function cobrarAlunoNoWhatsApp(aluno: Aluno) {
    const link = gerarLinkWhatsApp({
      telefone: aluno.telefone,
      nome: aluno.nome,
      valor: aluno.valor,
      diaVencimento: aluno.diaVencimento,
      status: aluno.pagamentoStatus,
    });

    window.open(link, "_blank");
  }

  const alunosFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase();

    if (!termo) return alunos;

    return alunos.filter((aluno) =>
      (aluno.nome || "").toLowerCase().includes(termo)
    );
  }, [alunos, buscaNome]);

  const totalAtivos = useMemo(() => {
    return alunos.filter((aluno) => aluno.status === "ativo").length;
  }, [alunos]);

  const totalPendentes = useMemo(() => {
    return alunos.filter(
      (aluno) =>
        aluno.pagamentoStatus === "pendente" ||
        aluno.pagamentoStatus === "atrasado"
    ).length;
  }, [alunos]);

  const totalPago = useMemo(() => {
    return alunos.filter((aluno) => aluno.pagamentoStatus === "pago").length;
  }, [alunos]);

  return (
    <div style={pagina}>
      <section style={{
        ...hero,
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
        gap: isMobile ? "16px" : "20px",
      }}>
        <div style={{
          ...heroPrincipal,
          padding: isMobile ? "20px" : "28px",
        }}>
          <p style={subtitulo}>Gestão de alunos cadastrados</p>
          <h1 style={{
            ...titulo,
            fontSize: isMobile ? "32px" : "52px",
          }}>Lista de alunos</h1>
          <p style={{
            ...descricao,
            fontSize: isMobile ? "14px" : "16px",
          }}>
            Visualize, busque, edite, acompanhe o financeiro, cobre por WhatsApp
            e exclua alunos da sua base com segurança.
          </p>
        </div>

        <div style={{
          ...heroResumoGrid,
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
          gap: isMobile ? "10px" : "16px",
        }}>
          <div style={{
            ...heroCard,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroCardTitulo}>Total de alunos</p>
            <h2 style={{
              ...heroCardValorBranco,
              fontSize: isMobile ? "26px" : "34px",
            }}>{alunos.length}</h2>
            <p style={{
              ...heroCardTexto,
              fontSize: isMobile ? "11px" : "13px",
            }}>Todos os cadastros</p>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroCardTitulo}>Ativos</p>
            <h2 style={{
              ...heroCardValorVerde,
              fontSize: isMobile ? "26px" : "34px",
            }}>{totalAtivos}</h2>
            <p style={{
              ...heroCardTexto,
              fontSize: isMobile ? "11px" : "13px",
            }}>Em atividade</p>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroCardTitulo}>Pagos</p>
            <h2 style={{
              ...heroCardValorAzul,
              fontSize: isMobile ? "26px" : "34px",
            }}>{totalPago}</h2>
            <p style={{
              ...heroCardTexto,
              fontSize: isMobile ? "11px" : "13px",
            }}>Confirmados</p>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroCardTitulo}>Pendentes</p>
            <h2 style={{
              ...heroCardValorAmarelo,
              fontSize: isMobile ? "26px" : "34px",
            }}>{totalPendentes}</h2>
            <p style={{
              ...heroCardTexto,
              fontSize: isMobile ? "11px" : "13px",
            }}>Atenção financeira</p>
          </div>
        </div>
      </section>

      <section style={{
        ...buscaCard,
        padding: isMobile ? "16px" : "24px",
      }}>
        <div style={buscaHeader}>
          <div>
            <p style={buscaMini}>Busca rápida</p>
            <h2 style={{
              ...buscaTitulo,
              fontSize: isMobile ? "20px" : "28px",
            }}>Encontrar aluno</h2>
          </div>

          {buscaNome.trim() ? (
            <button onClick={() => setBuscaNome("")} style={{
              ...botaoLimparBusca,
              height: isMobile ? "36px" : "44px",
              fontSize: isMobile ? "12px" : "13px",
            }}>
              Limpar
            </button>
          ) : null}
        </div>

        <div style={buscaLinha}>
          <input
            type="text"
            placeholder="Digite o nome do aluno"
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            style={{
              ...inputBusca,
              height: isMobile ? "48px" : "56px",
              fontSize: isMobile ? "14px" : "15px",
            }}
          />
        </div>

        <p style={buscaTexto}>
          Resultados encontrados: {alunosFiltrados.length}
        </p>
      </section>

      {carregando ? (
        <div style={mensagemBox}>
          <p style={mensagemTexto}>Carregando alunos...</p>
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div style={mensagemBox}>
          <p style={mensagemTexto}>
            {buscaNome.trim()
              ? "Nenhum aluno encontrado para a busca informada."
              : "Nenhum aluno cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div style={{
          ...gridCards,
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(420px, 1fr))",
          gap: isMobile ? "16px" : "22px",
        }}>
          {alunosFiltrados.map((aluno) => {
            const statusVisual = getStatusAluno(aluno.status);
            const pagamentoVisual = getStatusPagamento(aluno.pagamentoStatus);

            return (
              <div key={aluno.id} style={{
                ...cardAluno,
                padding: isMobile ? "16px" : "24px",
              }}>
                <div style={cardHeader}>
                  <div>
                    <h2 style={{
                      ...nomeAluno,
                      fontSize: isMobile ? "18px" : "24px",
                    }}>{aluno.nome || "Sem nome"}</h2>
                    <p style={{
                      ...telefoneAluno,
                      fontSize: isMobile ? "12px" : "14px",
                    }}>{aluno.telefone || "Sem telefone"}</p>
                  </div>

                  <span
                    style={{
                      ...badgeStatusTopo,
                      background: statusVisual.background,
                      color: statusVisual.color,
                      border: statusVisual.border,
                      padding: isMobile ? "6px 10px" : "10px 14px",
                      fontSize: isMobile ? "11px" : "13px",
                    }}
                  >
                    {statusVisual.label}
                  </span>
                </div>

                <div style={{
                  ...blocosInfo,
                  gap: isMobile ? "10px" : "14px",
                }}>
                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Plano</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>
                      {formatarPlano(aluno.tipoPlano || "")}
                    </p>
                  </div>

                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Pagamento</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>
                      {formatarPagamento(aluno.tipoPagamento || "")}
                    </p>
                  </div>

                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Cobrança</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>
                      {formatarCobranca(aluno.formaCobranca || "")}
                    </p>
                  </div>

                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Valor</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>R$ {aluno.valor || "0"}</p>
                  </div>

                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Reposições</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>{aluno.reposicoes ?? 0}</p>
                  </div>

                  <div style={{
                    ...infoBox,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Status pagamento</p>
                    <p
                      style={{
                        ...infoValor,
                        color: pagamentoVisual.color,
                        fontSize: isMobile ? "13px" : "15px",
                      }}
                    >
                      {pagamentoVisual.label}
                    </p>
                  </div>

                  <div style={{
                    ...infoBoxFull,
                    padding: isMobile ? "12px" : "16px",
                  }}>
                    <p style={{
                      ...infoLabel,
                      fontSize: isMobile ? "11px" : "13px",
                    }}>Dia do vencimento</p>
                    <p style={{
                      ...infoValor,
                      fontSize: isMobile ? "13px" : "15px",
                    }}>
                      {aluno.diaVencimento
                        ? `Dia ${aluno.diaVencimento}`
                        : "Não definido"}
                    </p>
                  </div>
                </div>

                <div style={{
                  ...acoes,
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                  gap: isMobile ? "8px" : "12px",
                }}>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/editar-aluno/${aluno.id}`)
                    }
                    style={{
                      ...botaoEditar,
                      padding: isMobile ? "12px" : "16px",
                      fontSize: isMobile ? "13px" : "15px",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => abrirFinanceiroAluno(aluno)}
                    style={{
                      ...botaoFinanceiro,
                      padding: isMobile ? "12px" : "16px",
                      fontSize: isMobile ? "13px" : "15px",
                    }}
                  >
                    Financeiro
                  </button>

                  <button
                    onClick={() => cobrarAlunoNoWhatsApp(aluno)}
                    style={{
                      ...botaoWhatsApp,
                      padding: isMobile ? "12px" : "16px",
                      fontSize: isMobile ? "13px" : "15px",
                    }}
                  >
                    Cobrar
                  </button>

                  <button
                    onClick={() => excluirAluno(aluno.id, aluno.nome)}
                    style={{
                      ...botaoExcluir,
                      padding: isMobile ? "12px" : "16px",
                      fontSize: isMobile ? "13px" : "15px",
                    }}
                    disabled={processandoId === aluno.id}
                  >
                    {processandoId === aluno.id ? "..." : "Excluir"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatarPlano(valor: string) {
  if (valor === "diaria") return "Diária";
  if (valor === "semanal") return "Semanal";
  if (valor === "mensal") return "Mensal";
  return "Não definido";
}

function formatarPagamento(valor: string) {
  if (valor === "por-aula") return "Por aula";
  if (valor === "mensal") return "Mensal";
  return "Não definido";
}

function formatarCobranca(valor: string) {
  if (valor === "antecipado") return "Antecipado";
  if (valor === "posterior") return "Posterior";
  return "Não definido";
}

function getStatusAluno(status?: string) {
  if (status === "ativo") {
    return {
      label: "ativo",
      background: "rgba(34,197,94,0.14)",
      color: "#86efac",
      border: "1px solid rgba(34,197,94,0.18)",
    };
  }

  if (status === "inativo") {
    return {
      label: "inativo",
      background: "rgba(239,68,68,0.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.18)",
    };
  }

  return {
    label: "sem status",
    background: "rgba(236,72,153,0.14)",
    color: "#f9a8d4",
    border: "1px solid rgba(236,72,153,0.18)",
  };
}

function getStatusPagamento(status?: string) {
  if (status === "pago") {
    return {
      label: "Pago",
      color: "#86efac",
    };
  }

  if (status === "atrasado") {
    return {
      label: "Atrasado",
      color: "#fca5a5",
    };
  }

  return {
    label: "Pendente",
    color: "#fde68a",
  };
}

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "24px",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "20px",
};

const heroPrincipal = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "28px",
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const heroResumoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const heroCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "22px",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
};

const heroCardTitulo = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
};

const heroCardValorBranco = {
  margin: "10px 0",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
};

const heroCardValorVerde = {
  margin: "10px 0",
  color: "#4ade80",
  fontSize: "34px",
  fontWeight: 900,
};

const heroCardValorAzul = {
  margin: "10px 0",
  color: "#60a5fa",
  fontSize: "34px",
  fontWeight: 900,
};

const heroCardValorAmarelo = {
  margin: "10px 0",
  color: "#facc15",
  fontSize: "34px",
  fontWeight: 900,
};

const heroCardTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  lineHeight: 1.6,
};

const subtitulo = {
  color: "rgba(255,255,255,0.65)",
  margin: 0,
  fontSize: "14px",
};

const titulo = {
  fontSize: "52px",
  fontWeight: 900,
  margin: "8px 0 10px 0",
  color: "#ffffff",
  lineHeight: 1,
};

const descricao = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "16px",
  lineHeight: 1.8,
};

const buscaCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "24px",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const buscaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const buscaMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const buscaTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 900,
};

const buscaLinha = {
  display: "flex",
  gap: "12px",
};

const inputBusca = {
  width: "100%",
  height: "56px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "15px",
  padding: "0 16px",
  outline: "none",
};

const buscaTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
};

const botaoLimparBusca = {
  height: "44px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid rgba(250,204,21,0.24)",
  background: "rgba(250,204,21,0.12)",
  color: "#fde68a",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
};

const mensagemBox = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "22px",
  padding: "24px",
  backdropFilter: "blur(12px)",
};

const mensagemTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.80)",
  fontSize: "16px",
};

const gridCards = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: "22px",
};

const cardAluno = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))",
  padding: "24px",
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "18px",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const nomeAluno = {
  margin: 0,
  fontSize: "24px",
  color: "#ffffff",
  fontWeight: 800,
};

const telefoneAluno = {
  margin: "6px 0 0 0",
  fontSize: "14px",
  color: "rgba(255,255,255,0.74)",
  fontWeight: 600,
};

const badgeStatusTopo = {
  padding: "10px 14px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "lowercase" as const,
};

const blocosInfo = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const infoBox = {
  background: "rgba(255,255,255,0.05)",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoBoxFull = {
  gridColumn: "1 / -1",
  background: "rgba(255,255,255,0.05)",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoLabel = {
  margin: 0,
  fontSize: "13px",
  color: "rgba(255,255,255,0.62)",
};

const infoValor = {
  margin: "8px 0 0 0",
  fontSize: "15px",
  color: "#ffffff",
  fontWeight: 800,
};

const acoes = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: "12px",
};

const botaoEditar = {
  padding: "16px",
  background: "linear-gradient(135deg, #4ade80, #22c55e)",
  border: "none",
  borderRadius: "14px",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 12px 24px rgba(34,197,94,0.22)",
};

const botaoFinanceiro = {
  padding: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "14px",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "15px",
};

const botaoWhatsApp = {
  padding: "16px",
  background: "linear-gradient(135deg, #25d366, #128c7e)",
  border: "none",
  borderRadius: "14px",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 12px 24px rgba(37,211,102,0.22)",
};

const botaoExcluir = {
  padding: "16px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  border: "none",
  borderRadius: "14px",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 12px 24px rgba(239,68,68,0.22)",
};
