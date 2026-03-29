"use client";

import { useEffect, useState } from "react";
import {
  type Notificacao,
  coresNotificacao,
  formatarTempoRelativo,
  marcarComoLida,
} from "@/utils/notificacoes";

type Props = {
  notificacao: Notificacao;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
};

export default function NotificacaoToast({ notificacao, onClose, onMarkAsRead }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const cores = coresNotificacao[notificacao.tipo];

  useEffect(() => {
    // Animar entrada
    requestAnimationFrame(() => {
      setVisible(true);
    });

    // Auto-fechar após 8 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleMarkAsRead = async () => {
    try {
      await marcarComoLida(notificacao.id);
      onMarkAsRead(notificacao.id);
      handleClose();
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const getIcon = () => {
    switch (notificacao.tipo) {
      case "aula":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "mensalidade":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case "assinatura":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        ...container,
        background: cores.background,
        border: cores.border,
        boxShadow: cores.glow,
        transform: visible && !exiting ? "translateX(0)" : "translateX(120%)",
        opacity: visible && !exiting ? 1 : 0,
      }}
    >
      <div style={iconWrapper}>
        <span style={{ color: cores.color }}>{getIcon()}</span>
      </div>

      <div style={content}>
        <div style={header}>
          <h4 style={{ ...titulo, color: cores.color }}>{notificacao.titulo}</h4>
          <span style={tempo}>{formatarTempoRelativo(notificacao.createdAt)}</span>
        </div>
        <p style={mensagem}>{notificacao.mensagem}</p>
        
        {notificacao.hora && (
          <p style={meta}>
            {notificacao.data} às {notificacao.hora}
          </p>
        )}
      </div>

      <div style={actions}>
        <button onClick={handleMarkAsRead} style={btnLida}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button onClick={handleClose} style={btnClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={progressBar}>
        <div style={progressFill} />
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const container: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "16px",
  borderRadius: "12px",
  width: "360px",
  maxWidth: "calc(100vw - 32px)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
};

const iconWrapper: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const content: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "4px",
};

const titulo: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const tempo: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(255,255,255,0.5)",
  whiteSpace: "nowrap",
};

const mensagem: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "rgba(255,255,255,0.8)",
  lineHeight: 1.4,
};

const meta: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "12px",
  color: "rgba(255,255,255,0.5)",
};

const actions: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const btnLida: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "6px",
  background: "rgba(34,197,94,0.2)",
  color: "#86efac",
  cursor: "pointer",
  transition: "background 0.2s",
};

const btnClose: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  transition: "background 0.2s",
};

const progressBar: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "3px",
  background: "rgba(255,255,255,0.1)",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  background: "rgba(255,255,255,0.3)",
  animation: "shrink 8s linear forwards",
};

// CSS global para animação (será injetado no provider)
export const toastKeyframes = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
