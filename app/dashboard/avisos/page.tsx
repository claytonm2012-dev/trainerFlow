"use client";

import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import auth from "@/app/firebaseAuth";
import {
  type Notificacao,
  type TipoNotificacao,
  buscarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  excluirNotificacao,
  coresNotificacao,
  formatarTipoNotificacao,
  formatarTempoRelativo,
  formatarDataHora,
} from "@/utils/notificacoes";
import { useNotificacoes } from "@/app/components/NotificacaoProvider";

type FiltroTipo = "todas" | TipoNotificacao;
type FiltroStatus = "todas" | "nao-lidas" | "lidas";

export default function AvisosPage() {
  const { atualizarContador } = useNotificacoes();
  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todas");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");

  // Responsividade
  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 900);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Carregar notificações
  async function carregarNotificacoes() {
    if (!userId) return;
    try {
      setCarregando(true);
      const lista = await buscarNotificacoes(userId);
      setNotificacoes(lista);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (userId) {
      carregarNotificacoes();
    }
  }, [userId]);

  // Filtrar notificações
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter((n) => {
      // Filtro por tipo
      if (filtroTipo !== "todas" && n.tipo !== filtroTipo) return false;

      // Filtro por status
      if (filtroStatus === "nao-lidas" && n.status === "lida") return false;
      if (filtroStatus === "lidas" && n.status !== "lida") return false;

      return true;
    });
  }, [notificacoes, filtroTipo, filtroStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = notificacoes.length;
    const naoLidas = notificacoes.filter((n) => n.status !== "lida").length;
    const aulas = notificacoes.filter((n) => n.tipo === "aula").length;
    const mensalidades = notificacoes.filter((n) => n.tipo === "mensalidade").length;
    const assinaturas = notificacoes.filter((n) => n.tipo === "assinatura").length;
    return { total, naoLidas, aulas, mensalidades, assinaturas };
  }, [notificacoes]);

  // Ações
  async function handleMarcarComoLida(id: string) {
    try {
      setProcessandoId(id);
      await marcarComoLida(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "lida", readAt: new Date().toISOString() } : n))
      );
      await atualizarContador();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleMarcarTodasComoLidas() {
    if (!userId) return;
    try {
      setProcessandoId("todas");
      await marcarTodasComoLidas(userId);
      setNotificacoes((prev) =>
        prev.map((n) => ({ ...n, status: "lida", readAt: new Date().toISOString() }))
      );
      await atualizarContador();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleExcluir(id: string) {
    const confirmar = window.confirm("Excluir esta notificação?");
    if (!confirmar) return;

    try {
      setProcessandoId(id);
      await excluirNotificacao(id);
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      await atualizarContador();
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    } finally {
      setProcessandoId(null);
    }
  }

  // Renderizar ícone por tipo
  const getIcone = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case "aula":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "mensalidade":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case "assinatura":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
    }
  };

  return (
    <div style={pagina}>
      {/* Hero Section */}
      <section style={{
        ...hero,
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
        gap: isMobile ? "16px" : "22px",
      }}>
        <div style={{
          ...heroPrincipal,
          padding: isMobile ? "20px" : "28px",
        }}>
          <p style={eyebrow}>Central de notificações</p>
          <h1 style={{
            ...titulo,
            fontSize: isMobile ? "32px" : "48px",
          }}>Avisos</h1>
          <p style={{
            ...descricao,
            fontSize: isMobile ? "14px" : "16px",
          }}>
            Acompanhe avisos de aulas, mensalidades e assinatura do sistema.
          </p>

          <div style={{
            ...acoesTopo,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <button
              onClick={carregarNotificacoes}
              disabled={carregando}
              style={{
                ...botaoAtualizar,
                width: isMobile ? "100%" : "auto",
              }}
            >
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>

            {stats.naoLidas > 0 && (
              <button
                onClick={handleMarcarTodasComoLidas}
                disabled={processandoId === "todas"}
                style={{
                  ...botaoMarcarTodas,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                {processandoId === "todas" ? "Processando..." : "Marcar todas como lidas"}
              </button>
            )}
          </div>
        </div>

        <div style={{
          ...heroResumoGrid,
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
          gap: isMobile ? "10px" : "14px",
        }}>
          <div style={{
            ...heroCard,
            padding: isMobile ? "14px" : "18px",
          }}>
            <p style={heroCardTitulo}>Total</p>
            <h2 style={{
              ...heroCardValor,
              fontSize: isMobile ? "28px" : "36px",
              color: "#ffffff",
            }}>{stats.total}</h2>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "14px" : "18px",
          }}>
            <p style={heroCardTitulo}>Não lidas</p>
            <h2 style={{
              ...heroCardValor,
              fontSize: isMobile ? "28px" : "36px",
              color: stats.naoLidas > 0 ? "#ef4444" : "#86efac",
            }}>{stats.naoLidas}</h2>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "14px" : "18px",
          }}>
            <p style={heroCardTitulo}>Aulas</p>
            <h2 style={{
              ...heroCardValor,
              fontSize: isMobile ? "28px" : "36px",
              color: coresNotificacao.aula.color,
            }}>{stats.aulas}</h2>
          </div>

          <div style={{
            ...heroCard,
            padding: isMobile ? "14px" : "18px",
          }}>
            <p style={heroCardTitulo}>Financeiro</p>
            <h2 style={{
              ...heroCardValor,
              fontSize: isMobile ? "28px" : "36px",
              color: coresNotificacao.mensalidade.color,
            }}>{stats.mensalidades}</h2>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section style={{
        ...filtrosSection,
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "12px" : "16px",
      }}>
        <div style={filtroGrupo}>
          <span style={filtroLabel}>Tipo:</span>
          <div style={filtroBotoes}>
            {(["todas", "aula", "mensalidade", "assinatura"] as FiltroTipo[]).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                style={{
                  ...filtroBotao,
                  ...(filtroTipo === tipo ? filtroBotaoAtivo : {}),
                }}
              >
                {tipo === "todas" ? "Todas" : formatarTipoNotificacao(tipo as TipoNotificacao)}
              </button>
            ))}
          </div>
        </div>

        <div style={filtroGrupo}>
          <span style={filtroLabel}>Status:</span>
          <div style={filtroBotoes}>
            {(["todas", "nao-lidas", "lidas"] as FiltroStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                style={{
                  ...filtroBotao,
                  ...(filtroStatus === status ? filtroBotaoAtivo : {}),
                }}
              >
                {status === "todas" ? "Todas" : status === "nao-lidas" ? "Não lidas" : "Lidas"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de notificações */}
      <section style={listaSection}>
        {carregando ? (
          <div style={vazioBox}>
            <p style={vazioTexto}>Carregando notificações...</p>
          </div>
        ) : notificacoesFiltradas.length === 0 ? (
          <div style={vazioBox}>
            <p style={vazioTexto}>
              {filtroTipo !== "todas" || filtroStatus !== "todas"
                ? "Nenhuma notificação encontrada com os filtros selecionados."
                : "Nenhuma notificação por enquanto. Elas aparecerão aqui quando houver avisos de aulas, mensalidades ou assinatura."}
            </p>
          </div>
        ) : (
          <div style={lista}>
            {notificacoesFiltradas.map((notif) => {
              const cores = coresNotificacao[notif.tipo];
              const naoLida = notif.status !== "lida";

              return (
                <div
                  key={notif.id}
                  style={{
                    ...card,
                    background: naoLida ? cores.background : "rgba(255,255,255,0.03)",
                    border: naoLida ? cores.border : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: naoLida ? cores.glow : "none",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? "12px" : "16px",
                  }}
                >
                  <div style={{
                    ...cardIcone,
                    background: naoLida ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    color: cores.color,
                  }}>
                    {getIcone(notif.tipo)}
                  </div>

                  <div style={cardConteudo}>
                    <div style={cardCabecalho}>
                      <div>
                        <div style={cardTipoRow}>
                          <span style={{
                            ...cardTipo,
                            background: cores.background,
                            color: cores.color,
                            border: cores.border,
                          }}>
                            {formatarTipoNotificacao(notif.tipo)}
                          </span>
                          {naoLida && <span style={cardBadgeNovo}>Novo</span>}
                        </div>
                        <h3 style={{
                          ...cardTitulo,
                          fontSize: isMobile ? "16px" : "18px",
                        }}>{notif.titulo}</h3>
                      </div>
                      <span style={cardTempo}>{formatarTempoRelativo(notif.createdAt)}</span>
                    </div>

                    <p style={cardMensagem}>{notif.mensagem}</p>

                    {(notif.data || notif.hora) && (
                      <p style={cardMeta}>
                        {notif.data && `Data: ${notif.data}`}
                        {notif.data && notif.hora && " - "}
                        {notif.hora && `Horário: ${notif.hora}`}
                      </p>
                    )}

                    {notif.alunoNome && (
                      <p style={cardMeta}>Aluno: {notif.alunoNome}</p>
                    )}
                  </div>

                  <div style={{
                    ...cardAcoes,
                    flexDirection: isMobile ? "row" : "column",
                    width: isMobile ? "100%" : "auto",
                  }}>
                    {naoLida && (
                      <button
                        onClick={() => handleMarcarComoLida(notif.id)}
                        disabled={processandoId === notif.id}
                        style={{
                          ...botaoLida,
                          flex: isMobile ? 1 : "none",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {!isMobile && "Lida"}
                      </button>
                    )}

                    <button
                      onClick={() => handleExcluir(notif.id)}
                      disabled={processandoId === notif.id}
                      style={{
                        ...botaoExcluir,
                        flex: isMobile ? 1 : "none",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {!isMobile && "Excluir"}
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

// ============================================================================
// ESTILOS
// ============================================================================

const pagina: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const hero: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: "22px",
};

const heroPrincipal: React.CSSProperties = {
  padding: "28px",
  borderRadius: "24px",
  background: "linear-gradient(135deg, rgba(16,28,78,0.85), rgba(8,18,58,0.85))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const titulo: React.CSSProperties = {
  margin: "12px 0 0 0",
  color: "#ffffff",
  fontSize: "48px",
  fontWeight: 900,
  letterSpacing: "-0.02em",
};

const descricao: React.CSSProperties = {
  margin: "12px 0 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: "16px",
  lineHeight: 1.6,
};

const acoesTopo: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "20px",
};

const botaoAtualizar: React.CSSProperties = {
  height: "48px",
  padding: "0 20px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};

const botaoMarcarTodas: React.CSSProperties = {
  height: "48px",
  padding: "0 20px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};

const heroResumoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const heroCard: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const heroCardTitulo: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const heroCardValor: React.CSSProperties = {
  margin: "8px 0 0 0",
  fontSize: "36px",
  fontWeight: 900,
  letterSpacing: "-0.02em",
};

const filtrosSection: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const filtroGrupo: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const filtroLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  fontWeight: 600,
};

const filtroBotoes: React.CSSProperties = {
  display: "flex",
  gap: "6px",
};

const filtroBotao: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const filtroBotaoAtivo: React.CSSProperties = {
  background: "rgba(59,130,246,0.2)",
  border: "1px solid rgba(59,130,246,0.3)",
  color: "#60a5fa",
};

const listaSection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const vazioBox: React.CSSProperties = {
  padding: "40px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
};

const vazioTexto: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "15px",
};

const lista: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const card: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  padding: "20px",
  borderRadius: "18px",
  transition: "all 0.2s",
};

const cardIcone: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  flexShrink: 0,
};

const cardConteudo: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const cardCabecalho: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const cardTipoRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "6px",
};

const cardTipo: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const cardBadgeNovo: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: "6px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
};

const cardTitulo: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 800,
};

const cardTempo: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const cardMensagem: React.CSSProperties = {
  margin: "10px 0 0 0",
  color: "rgba(255,255,255,0.78)",
  fontSize: "14px",
  lineHeight: 1.6,
};

const cardMeta: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.5)",
  fontSize: "13px",
};

const cardAcoes: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const botaoLida: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(34,197,94,0.18)",
  color: "#86efac",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};

const botaoExcluir: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(239,68,68,0.12)",
  color: "#fca5a5",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};
