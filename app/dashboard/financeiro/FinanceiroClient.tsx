"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import db from "../../firebaseDb";
import auth from "../../firebaseAuth";
import { atualizarFinanceiroAutomatico } from "../../../utils/atualizarFinanceiro";
import {
  formatarMoeda,
  ordenarMesAno,
  type StatusFinanceiro,
} from "../../../utils/financeiro";
import { gerarLinkWhatsApp } from "../../../utils/whatsapp";
import { useRouter, useSearchParams } from "next/navigation";

type Aluno = {
  id: string;
  nome?: string;
  telefone?: string;
  valor?: string;
  pagamentoStatus?: string;
  formaCobranca?: string;
  diaVencimento?: number;
  userId?: string;
};

type RegistroFinanceiro = {
  id: string;
  alunoNome?: string;
  valor?: number;
  mes?: string;
  status?: StatusFinanceiro;
  criadoEm?: any;
  pagoEm?: any;
  userId?: string;
};

export default function FinanceiroClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const alunoFiltro = searchParams.get("aluno") || "";

  const [buscaNome, setBuscaNome] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([]);

  const [recebido, setRecebido] = useState(0);
  const [pendente, setPendente] = useState(0);
  const [atrasado, setAtrasado] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [processandoId, setProcessandoId] = useState("");

  async function gerarFinanceiro() {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        return;
      }

      setGerando(true);
      await atualizarFinanceiroAutomatico(user.uid);
      await carregarFinanceiro();
      alert("Financeiro atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar financeiro:", error);
      alert("Erro ao atualizar financeiro");
    } finally {
      setGerando(false);
    }
  }

  async function carregarFinanceiro() {
    try {
      setCarregando(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Usuário não autenticado.");
        setAlunos([]);
        setRegistros([]);
        setRecebido(0);
        setPendente(0);
        setAtrasado(0);
        return;
      }

      const alunosSnapshot = await getDocs(
        query(collection(db, "students"), where("userId", "==", user.uid))
      );

      const financeiroSnapshot = await getDocs(
  query(
    collection(db, "financeiro"),
    where("userId", "==", user.uid)
  )
);

      const listaAlunos = alunosSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Aluno[];

      const listaFinanceiro = financeiroSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as RegistroFinanceiro[];

      listaFinanceiro.sort((a, b) => {
        const ordemMes =
          ordenarMesAno(b.mes || "00/0000") -
          ordenarMesAno(a.mes || "00/0000");

        if (ordemMes !== 0) return ordemMes;

        return (a.alunoNome || "").localeCompare(b.alunoNome || "");
      });

      const totalRecebido = listaFinanceiro
        .filter((item) => item.status === "pago")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0);

      const totalPendente = listaFinanceiro
        .filter((item) => item.status === "pendente")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0);

      const totalAtrasado = listaAlunos
        .filter((aluno) => aluno.pagamentoStatus === "atrasado")
        .reduce((acc, aluno) => acc + Number(aluno.valor || 0), 0);

      setAlunos(listaAlunos);
      setRegistros(listaFinanceiro);
      setRecebido(totalRecebido);
      setPendente(totalPendente);
      setAtrasado(totalAtrasado);
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
      alert("Erro ao carregar financeiro");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  async function marcarComoPago(id: string) {
    try {
      setProcessandoId(id);

      await updateDoc(doc(db, "financeiro", id), {
        status: "pago",
        pagoEm: new Date().toISOString(),
      });

      await carregarFinanceiro();
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago");
    } finally {
      setProcessandoId("");
    }
  }

  async function marcarComoPendente(id: string) {
    try {
      setProcessandoId(id);

      await updateDoc(doc(db, "financeiro", id), {
        status: "pendente",
        pagoEm: null,
      });

      await carregarFinanceiro();
    } catch (error) {
      console.error("Erro ao voltar para pendente:", error);
      alert("Erro ao atualizar status");
    } finally {
      setProcessandoId("");
    }
  }

  async function excluirRegistro(id: string) {
    const confirmar = window.confirm("Deseja excluir este registro financeiro?");
    if (!confirmar) return;

    try {
      setProcessandoId(id);

      await deleteDoc(doc(db, "financeiro", id));
      await carregarFinanceiro();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Erro ao excluir registro");
    } finally {
      setProcessandoId("");
    }
  }

  function buscarAlunoPorNome(nome?: string) {
    if (!nome) return null;

    return (
      alunos.find(
        (aluno) => (aluno.nome || "").toLowerCase() === nome.toLowerCase()
      ) || null
    );
  }

  function cobrarNoWhatsApp(item: RegistroFinanceiro) {
    const aluno = buscarAlunoPorNome(item.alunoNome);

    const link = gerarLinkWhatsApp({
      telefone: aluno?.telefone,
      nome: item.alunoNome,
      valor: item.valor,
      diaVencimento: aluno?.diaVencimento,
      status: item.status,
    });

    window.open(link, "_blank");
  }

  const alunoSelecionado = useMemo(() => {
    if (!alunoFiltro) return null;

    return (
      alunos.find(
        (aluno) =>
          (aluno.nome || "").toLowerCase() === alunoFiltro.toLowerCase()
      ) || null
    );
  }, [alunos, alunoFiltro]);

  const registrosPorFiltroLista = useMemo(() => {
    if (!alunoFiltro) return registros;

    return registros.filter(
      (item) =>
        (item.alunoNome || "").toLowerCase() === alunoFiltro.toLowerCase()
    );
  }, [registros, alunoFiltro]);

  const registrosFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase();

    if (!termo) return registrosPorFiltroLista;

    return registrosPorFiltroLista.filter((item) =>
      (item.alunoNome || "").toLowerCase().includes(termo)
    );
  }, [registrosPorFiltroLista, buscaNome]);

  const totalRecebidoFiltrado = useMemo(() => {
    return registrosFiltrados
      .filter((item) => item.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }, [registrosFiltrados]);

  const totalPendenteFiltrado = useMemo(() => {
    return registrosFiltrados
      .filter((item) => item.status === "pendente")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }, [registrosFiltrados]);

  const mesesUnicosFiltrados = useMemo(() => {
    return Array.from(
      new Set(registrosFiltrados.map((item) => item.mes || ""))
    ).filter(Boolean);
  }, [registrosFiltrados]);

  const existeBuscaAtiva = buscaNome.trim().length > 0;

  return (
    <div style={pagina}>
      <section style={{
        ...hero,
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
        gap: isMobile ? "16px" : "22px",
      }}>
        <div style={{
          ...heroPrincipal,
          padding: isMobile ? "20px" : "30px",
        }}>
          <p style={eyebrow}>Financeiro e cobrança automática</p>
          <h1 style={{
            ...titulo,
            fontSize: isMobile ? "32px" : "52px",
          }}>Financeiro</h1>
          <p style={{
            ...descricao,
            fontSize: isMobile ? "14px" : "16px",
          }}>
            Gere cobranças, acompanhe registros pendentes e pagos e controle o fluxo financeiro.
          </p>

          <div style={{
            ...acoesTopo,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <button
              onClick={gerarFinanceiro}
              disabled={gerando}
              style={{
                ...botaoGerar,
                width: isMobile ? "100%" : "auto",
                height: isMobile ? "48px" : "52px",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              {gerando ? "Gerando..." : "Gerar financeiro"}
            </button>

            <button
              onClick={async () => {
                try {
                  setAtualizando(true);
                  await carregarFinanceiro();
                } finally {
                  setAtualizando(false);
                }
              }}
              disabled={atualizando}
              style={{
                ...botaoAtualizar,
                width: isMobile ? "100%" : "auto",
                height: isMobile ? "48px" : "52px",
                fontSize: isMobile ? "14px" : "15px",
              }}
            >
              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>

            {alunoFiltro ? (
              <button
                onClick={() => router.push("/dashboard/financeiro")}
                style={{
                  ...botaoLimparFiltro,
                  width: isMobile ? "100%" : "auto",
                  height: isMobile ? "48px" : "52px",
                  fontSize: isMobile ? "14px" : "15px",
                }}
              >
                Limpar filtro
              </button>
            ) : null}

            {existeBuscaAtiva ? (
              <button
                onClick={() => setBuscaNome("")}
                style={{
                  ...botaoLimparBusca,
                  width: isMobile ? "100%" : "auto",
                  height: isMobile ? "48px" : "52px",
                  fontSize: isMobile ? "14px" : "15px",
                }}
              >
                Limpar busca
              </button>
            ) : null}
          </div>
        </div>

        <div style={{
          ...heroResumoGrid,
          gap: isMobile ? "10px" : "18px",
        }}>
          <div style={{
            ...heroResumo,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroResumoRotulo}>Recebido</p>
            <h2 style={{
              ...heroResumoValorVerde,
              fontSize: isMobile ? "24px" : "34px",
            }}>{formatarMoeda(recebido)}</h2>
            <p style={{
              ...heroResumoTexto,
              fontSize: isMobile ? "11px" : "14px",
            }}>Confirmado</p>
          </div>

          <div style={{
            ...heroResumo,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroResumoRotulo}>Pendente</p>
            <h2 style={{
              ...heroResumoValorAmarelo,
              fontSize: isMobile ? "24px" : "34px",
            }}>{formatarMoeda(pendente)}</h2>
            <p style={{
              ...heroResumoTexto,
              fontSize: isMobile ? "11px" : "14px",
            }}>Em aberto</p>
          </div>

          <div style={{
            ...heroResumo,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroResumoRotulo}>Atrasado</p>
            <h2 style={{
              ...heroResumoValorVermelho,
              fontSize: isMobile ? "24px" : "34px",
            }}>{formatarMoeda(atrasado)}</h2>
            <p style={{
              ...heroResumoTexto,
              fontSize: isMobile ? "11px" : "14px",
            }}>Status alunos</p>
          </div>

          <div style={{
            ...heroResumo,
            padding: isMobile ? "16px" : "22px",
          }}>
            <p style={heroResumoRotulo}>Registros</p>
            <h2 style={{
              ...heroResumoValorAzul,
              fontSize: isMobile ? "24px" : "34px",
            }}>{registros.length}</h2>
            <p style={{
              ...heroResumoTexto,
              fontSize: isMobile ? "11px" : "14px",
            }}>Total</p>
          </div>
        </div>
      </section>

      <section style={{
        ...buscaCard,
        padding: isMobile ? "16px" : "24px",
      }}>
        <div style={buscaHeader}>
          <div>
            <p style={buscaMini}>Busca interna</p>
            <h2 style={{
              ...buscaTitulo,
              fontSize: isMobile ? "20px" : "28px",
            }}>Buscar aluno</h2>
          </div>
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

        {!isMobile && (
          <p style={buscaTexto}>
            A busca funciona junto com o filtro vindo da lista de alunos.
          </p>
        )}
      </section>

      {alunoFiltro ? (
        <section style={{
          ...filtroCard,
          padding: isMobile ? "16px" : "28px",
        }}>
          <div style={filtroHeader}>
            <div>
              <p style={filtroMini}>Filtro ativo</p>
              <h2 style={{
                ...filtroTitulo,
                fontSize: isMobile ? "20px" : "30px",
              }}>
                {alunoSelecionado?.nome || alunoFiltro}
              </h2>
            </div>

            <div style={{
              ...filtroBadge,
              padding: isMobile ? "6px 10px" : "10px 14px",
              fontSize: isMobile ? "11px" : "13px",
            }}>
              {registrosFiltrados.length} registro{registrosFiltrados.length === 1 ? "" : "s"}
            </div>
          </div>

          <div style={{
            ...filtroGrid,
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))",
            gap: isMobile ? "10px" : "14px",
          }}>
            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Aluno</p>
              <p style={{
                ...filtroInfoValor,
                fontSize: isMobile ? "13px" : "16px",
              }}>
                {alunoSelecionado?.nome || alunoFiltro}
              </p>
            </div>

            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Telefone</p>
              <p style={{
                ...filtroInfoValor,
                fontSize: isMobile ? "13px" : "16px",
              }}>
                {alunoSelecionado?.telefone || "Não informado"}
              </p>
            </div>

            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Valor</p>
              <p style={{
                ...filtroInfoValor,
                fontSize: isMobile ? "13px" : "16px",
              }}>
                R$ {alunoSelecionado?.valor || "0"}
              </p>
            </div>

            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Cobrança</p>
              <p style={{
                ...filtroInfoValor,
                fontSize: isMobile ? "13px" : "16px",
              }}>
                {formatarCobranca(alunoSelecionado?.formaCobranca || "")}
              </p>
            </div>

            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Vencimento</p>
              <p style={{
                ...filtroInfoValor,
                fontSize: isMobile ? "13px" : "16px",
              }}>
                {alunoSelecionado?.diaVencimento
                  ? `Dia ${alunoSelecionado.diaVencimento}`
                  : "N/D"}
              </p>
            </div>

            <div style={{
              ...filtroInfoBox,
              padding: isMobile ? "12px" : "16px",
            }}>
              <p style={filtroInfoLabel}>Status</p>
              <p
                style={{
                  ...filtroInfoValor,
                  color: getCorPagamento(alunoSelecionado?.pagamentoStatus),
                  fontSize: isMobile ? "13px" : "16px",
                }}
              >
                {formatarStatusPagamento(alunoSelecionado?.pagamentoStatus)}
              </p>
            </div>
          </div>

          <div style={{
            ...faixaResumoFiltrado,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: isMobile ? "10px" : "14px",
          }}>
            <div style={{
              ...resumoFiltradoCard,
              padding: isMobile ? "12px" : "16px",
            }}>
              <span style={resumoFiltradoRotulo}>Recebido</span>
              <strong style={{
                ...resumoFiltradoValorVerde,
                fontSize: isMobile ? "22px" : "28px",
              }}>
                {formatarMoeda(totalRecebidoFiltrado)}
              </strong>
            </div>

            <div style={{
              ...resumoFiltradoCard,
              padding: isMobile ? "12px" : "16px",
            }}>
              <span style={resumoFiltradoRotulo}>Pendente</span>
              <strong style={{
                ...resumoFiltradoValorAmarelo,
                fontSize: isMobile ? "22px" : "28px",
              }}>
                {formatarMoeda(totalPendenteFiltrado)}
              </strong>
            </div>

            <div style={{
              ...resumoFiltradoCard,
              padding: isMobile ? "12px" : "16px",
            }}>
              <span style={resumoFiltradoRotulo}>Meses</span>
              <strong style={{
                ...resumoFiltradoValorAzul,
                fontSize: isMobile ? "22px" : "28px",
              }}>
                {mesesUnicosFiltrados.length}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      <section style={{
        ...listaCard,
        padding: isMobile ? "16px" : "28px",
      }}>
        <div style={cardHeader}>
          <div>
            <p style={cardMini}>Cobranças registradas</p>
            <h2 style={{
              ...cardTitulo,
              fontSize: isMobile ? "24px" : "36px",
            }}>
              {alunoFiltro || existeBuscaAtiva
                ? "Filtrados"
                : "Lançamentos"}
            </h2>
          </div>
        </div>

        {carregando ? (
          <div style={vazioBox}>
            <p style={vazioTexto}>Carregando financeiro...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={vazioBox}>
            <p style={vazioTexto}>
              {alunoFiltro || existeBuscaAtiva
                ? "Nenhum registro encontrado."
                : "Nenhum registro. Clique em Gerar financeiro."}
            </p>
          </div>
        ) : (
          <div style={lista}>
            {registrosFiltrados.map((item) => {
              const statusVisual = getStatusVisual(item.status || "pendente");
              const alunoDoRegistro = buscarAlunoPorNome(item.alunoNome);

              return (
                <div
                  key={item.id}
                  style={{
                    ...itemFinanceiro,
                    border: statusVisual.border,
                    boxShadow: statusVisual.glow,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                    padding: isMobile ? "14px" : "18px",
                  }}
                >
                  <div style={itemEsquerda}>
                    <div style={itemTopo}>
                      <h3 style={{
                        ...itemNome,
                        fontSize: isMobile ? "18px" : "24px",
                      }}>{item.alunoNome || "Aluno"}</h3>

                      <div
                        style={{
                          ...badgeStatus,
                          background: statusVisual.background,
                          color: statusVisual.color,
                          border: statusVisual.border,
                          padding: isMobile ? "6px 10px" : "8px 12px",
                          fontSize: isMobile ? "10px" : "12px",
                        }}
                      >
                        {statusVisual.label}
                      </div>
                    </div>

                    <div style={itemMetaLinha}>
                      <span style={{
                        ...itemMeta,
                        fontSize: isMobile ? "12px" : "14px",
                      }}>
                        {item.mes || "--/----"}
                      </span>
                      <span style={{
                        ...itemMeta,
                        fontSize: isMobile ? "12px" : "14px",
                      }}>
                        {formatarMoeda(Number(item.valor || 0))}
                      </span>
                    </div>

                    {!isMobile && (
                      <>
                        <div style={itemMetaLinha}>
                          <span style={itemMeta}>
                            Criado: {formatarDataHora(item.criadoEm)}
                          </span>
                          <span style={itemMeta}>
                            Pago: {formatarDataHora(item.pagoEm)}
                          </span>
                        </div>

                        <div style={itemMetaLinha}>
                          <span style={itemMeta}>
                            Tel: {alunoDoRegistro?.telefone || "N/I"}
                          </span>
                          <span style={itemMeta}>
                            Venc: {alunoDoRegistro?.diaVencimento ? `Dia ${alunoDoRegistro.diaVencimento}` : "N/D"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{
                    ...itemDireita,
                    marginTop: isMobile ? "12px" : "0",
                    justifyContent: isMobile ? "space-between" : "flex-end",
                  }}>
                    <button
                      onClick={() => cobrarNoWhatsApp(item)}
                      style={{
                        ...botaoWhatsApp,
                        height: isMobile ? "38px" : "42px",
                        padding: isMobile ? "0 10px" : "0 14px",
                        fontSize: isMobile ? "12px" : "13px",
                      }}
                    >
                      Cobrar
                    </button>

                    <button
                      onClick={() => marcarComoPago(item.id)}
                      disabled={processandoId === item.id || item.status === "pago"}
                      style={{
                        ...botaoPago,
                        height: isMobile ? "38px" : "42px",
                        padding: isMobile ? "0 10px" : "0 14px",
                        fontSize: isMobile ? "12px" : "13px",
                      }}
                    >
                      {isMobile ? "Pago" : "Marcar pago"}
                    </button>

                    <button
                      onClick={() => marcarComoPendente(item.id)}
                      disabled={processandoId === item.id || item.status === "pendente"}
                      style={{
                        ...botaoPendente,
                        height: isMobile ? "38px" : "42px",
                        padding: isMobile ? "0 10px" : "0 14px",
                        fontSize: isMobile ? "12px" : "13px",
                      }}
                    >
                      {isMobile ? "Pend." : "Pendente"}
                    </button>

                    <button
                      onClick={() => excluirRegistro(item.id)}
                      disabled={processandoId === item.id}
                      style={{
                        ...botaoExcluir,
                        height: isMobile ? "38px" : "42px",
                        padding: isMobile ? "0 10px" : "0 14px",
                        fontSize: isMobile ? "12px" : "13px",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function getStatusVisual(status: StatusFinanceiro) {
  if (status === "pago") {
    return {
      label: "Pago",
      color: "#86efac",
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.18)",
      glow: "0 0 24px rgba(34,197,94,0.10)",
    };
  }

  return {
    label: "Pendente",
    color: "#fde68a",
    background: "rgba(250,204,21,0.12)",
    border: "1px solid rgba(250,204,21,0.18)",
    glow: "0 0 24px rgba(250,204,21,0.08)",
  };
}

function formatarDataHora(valor: any) {
  if (!valor) return "--";

  try {
    if (typeof valor === "string") {
      const data = new Date(valor);

      if (Number.isNaN(data.getTime())) return "--";

      return data.toLocaleString("pt-BR");
    }

    if (valor?.seconds) {
      const data = new Date(valor.seconds * 1000);
      return data.toLocaleString("pt-BR");
    }

    return "--";
  } catch {
    return "--";
  }
}

function formatarCobranca(valor: string) {
  if (valor === "antecipado") return "Antecipado";
  if (valor === "posterior") return "Posterior";
  return "Não definido";
}

function formatarStatusPagamento(status?: string) {
  if (status === "pago") return "Pago";
  if (status === "atrasado") return "Atrasado";
  return "Pendente";
}

function getCorPagamento(status?: string) {
  if (status === "pago") return "#86efac";
  if (status === "atrasado") return "#fca5a5";
  return "#fde68a";
}

const pagina = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "24px",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "20px",
};

const heroPrincipal = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "30px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.20)",
};

const heroResumoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
};

const heroResumo = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
};

const eyebrow = {
  margin: 0,
  color: "rgba(255,255,255,0.60)",
  fontSize: "14px",
};

const titulo = {
  margin: "10px 0 14px 0",
  fontSize: "52px",
  lineHeight: 1,
  fontWeight: 900,
  color: "#ffffff",
};

const descricao = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "16px",
  lineHeight: 1.8,
};

const acoesTopo = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "24px",
};

const botaoGerar = {
  height: "52px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(34,197,94,0.30)",
};

const botaoAtualizar = {
  height: "52px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const botaoLimparFiltro = {
  height: "52px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "1px solid rgba(96,165,250,0.24)",
  background: "rgba(96,165,250,0.12)",
  color: "#93c5fd",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const botaoLimparBusca = {
  height: "52px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "1px solid rgba(250,204,21,0.24)",
  background: "rgba(250,204,21,0.12)",
  color: "#fde68a",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const heroResumoRotulo = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
};

const heroResumoValorVerde = {
  margin: "10px 0",
  color: "#86efac",
  fontSize: "34px",
  fontWeight: 900,
};

const heroResumoValorAmarelo = {
  margin: "10px 0",
  color: "#fde68a",
  fontSize: "34px",
  fontWeight: 900,
};

const heroResumoValorVermelho = {
  margin: "10px 0",
  color: "#fca5a5",
  fontSize: "34px",
  fontWeight: 900,
};

const heroResumoValorAzul = {
  margin: "10px 0",
  color: "#93c5fd",
  fontSize: "34px",
  fontWeight: 900,
};

const heroResumoTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const buscaCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "24px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
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
  flexWrap: "wrap" as const,
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
  lineHeight: 1.7,
};

const filtroCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const filtroHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const filtroMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const filtroTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: 900,
};

const filtroBadge = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(96,165,250,0.12)",
  border: "1px solid rgba(96,165,250,0.20)",
  color: "#93c5fd",
  fontSize: "13px",
  fontWeight: 800,
};

const filtroGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const filtroInfoBox = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "16px",
};

const filtroInfoLabel = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
};

const filtroInfoValor = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 800,
};

const faixaResumoFiltrado = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const resumoFiltradoCard = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const resumoFiltradoRotulo = {
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
};

const resumoFiltradoValorVerde = {
  color: "#86efac",
  fontSize: "28px",
  fontWeight: 900,
};

const resumoFiltradoValorAmarelo = {
  color: "#fde68a",
  fontSize: "28px",
  fontWeight: 900,
};

const resumoFiltradoValorAzul = {
  color: "#93c5fd",
  fontSize: "28px",
  fontWeight: 900,
};

const listaCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "30px",
  padding: "28px",
  boxShadow: "0 20px 44px rgba(0,0,0,0.20)",
};

const cardHeader = {
  marginBottom: "20px",
};

const cardMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const cardTitulo = {
  margin: "8px 0 0 0",
  fontSize: "36px",
  fontWeight: 900,
  color: "#ffffff",
};

const vazioBox = {
  padding: "22px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const vazioTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.74)",
  fontSize: "15px",
};

const lista = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const itemFinanceiro = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.045)",
};

const itemEsquerda = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const itemTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const itemNome = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 900,
  color: "#ffffff",
};

const badgeStatus = {
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 900,
};

const itemMetaLinha = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const itemMeta = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
};

const itemDireita = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end" as const,
};

const botaoBase = {
  height: "42px",
  padding: "0 14px",
  borderRadius: "12px",
  border: "none",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
};

const botaoWhatsApp = {
  ...botaoBase,
  background: "linear-gradient(135deg, #25d366, #128c7e)",
};

const botaoPago = {
  ...botaoBase,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
};

const botaoPendente = {
  ...botaoBase,
  background: "linear-gradient(135deg, #facc15, #eab308)",
  color: "#111827",
};

const botaoExcluir = {
  ...botaoBase,
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
};
