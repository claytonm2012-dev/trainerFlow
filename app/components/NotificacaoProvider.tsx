"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import auth from "@/app/firebaseAuth";
import {
  type Notificacao,
  buscarNotificacoesPendentes,
  buscarNotificacoesNaoLidas,
  marcarComoEnviada,
  marcarComoLida,
  contarNotificacoesNaoLidas,
} from "@/utils/notificacoes";
import { gerarNotificacoesAulas } from "@/utils/gerarNotificacoesAulas";
import { gerarNotificacoesMensalidades } from "@/utils/gerarNotificacoesMensalidades";
import { gerarNotificacoesAssinatura } from "@/utils/gerarNotificacoesAssinatura";
import NotificacaoToast, { toastKeyframes } from "./NotificacaoToast";

// ============================================================================
// CONTEXT
// ============================================================================

type NotificacaoContextType = {
  notificacoesNaoLidas: number;
  toasts: Notificacao[];
  atualizarContador: () => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
};

const NotificacaoContext = createContext<NotificacaoContextType>({
  notificacoesNaoLidas: 0,
  toasts: [],
  atualizarContador: async () => {},
  marcarTodasComoLidas: async () => {},
});

export const useNotificacoes = () => useContext(NotificacaoContext);

// ============================================================================
// PROVIDER
// ============================================================================

type Props = {
  children: ReactNode;
};

export default function NotificacaoProvider({ children }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [toasts, setToasts] = useState<Notificacao[]>([]);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<number>(0);

  // Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Atualizar contador
  const atualizarContador = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await contarNotificacoesNaoLidas(userId);
      setNotificacoesNaoLidas(count);
    } catch (err) {
      console.error("Erro ao contar notificações:", err);
    }
  }, [userId]);

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    if (!userId) return;
    try {
      const { marcarTodasComoLidas: marcarTodas } = await import("@/utils/notificacoes");
      await marcarTodas(userId);
      setNotificacoesNaoLidas(0);
      setToasts([]);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, [userId]);

  // Gerar notificações automaticamente
  const gerarNotificacoes = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Gerar notificações de aulas
      await gerarNotificacoesAulas(userId);
      
      // Gerar notificações de mensalidades (apenas uma vez por dia)
      const hoje = new Date().toDateString();
      const ultimoDia = localStorage.getItem("ultimaDiaNotificacoesMensalidades");
      if (ultimoDia !== hoje) {
        await gerarNotificacoesMensalidades(userId);
        localStorage.setItem("ultimaDiaNotificacoesMensalidades", hoje);
      }
      
      // Gerar notificações de assinatura (apenas uma vez por dia)
      const ultimoDiaAssinatura = localStorage.getItem("ultimaDiaNotificacoesAssinatura");
      if (ultimoDiaAssinatura !== hoje) {
        await gerarNotificacoesAssinatura(userId);
        localStorage.setItem("ultimaDiaNotificacoesAssinatura", hoje);
      }
    } catch (err) {
      console.error("Erro ao gerar notificações:", err);
    }
  }, [userId]);

  // Verificar e exibir toasts
  const verificarToasts = useCallback(async () => {
    if (!userId) return;
    
    try {
      const pendentes = await buscarNotificacoesPendentes(userId);
      
      for (const notif of pendentes) {
        // Verificar se já está nos toasts ativos
        if (toasts.some((t) => t.id === notif.id)) continue;
        
        // Marcar como enviada
        await marcarComoEnviada(notif.id);
        
        // Adicionar aos toasts
        setToasts((prev) => [...prev, { ...notif, status: "enviada" }]);
      }
      
      // Atualizar contador
      await atualizarContador();
    } catch (err) {
      console.error("Erro ao verificar toasts:", err);
    }
  }, [userId, toasts, atualizarContador]);

  // Remover toast
  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Marcar toast como lido e remover
  const marcarToastComoLido = useCallback(async (id: string) => {
    removerToast(id);
    await atualizarContador();
  }, [removerToast, atualizarContador]);

  // Verificação inicial e periódica
  useEffect(() => {
    if (!userId) return;

    // Verificação inicial
    gerarNotificacoes();
    verificarToasts();

    // Verificação periódica a cada 60 segundos
    const interval = setInterval(() => {
      gerarNotificacoes();
      verificarToasts();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, gerarNotificacoes, verificarToasts]);

  // Atualizar contador quando userId mudar
  useEffect(() => {
    if (userId) {
      atualizarContador();
    }
  }, [userId, atualizarContador]);

  return (
    <NotificacaoContext.Provider
      value={{
        notificacoesNaoLidas,
        toasts,
        atualizarContador,
        marcarTodasComoLidas,
      }}
    >
      {/* Injetar CSS de animação */}
      <style dangerouslySetInnerHTML={{ __html: toastKeyframes }} />
      
      {children}

      {/* Container de toasts */}
      <div style={toastContainer}>
        {toasts.map((toast) => (
          <NotificacaoToast
            key={toast.id}
            notificacao={toast}
            onClose={() => removerToast(toast.id)}
            onMarkAsRead={marcarToastComoLido}
          />
        ))}
      </div>
    </NotificacaoContext.Provider>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const toastContainer: React.CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 9999,
  pointerEvents: "none",
};
