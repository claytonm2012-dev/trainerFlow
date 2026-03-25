"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { getMessaging, getToken } from "firebase/messaging";
import { onAuthStateChanged } from "firebase/auth";

import db from "../firebaseDb";
import app from "../firebase";
import auth from "../firebaseAuth";
import { acessoBloqueado } from "@/utils/acesso";
import { calcularFimTrial, getValorPlano } from "@/utils/plano";
import { processarAutomacaoAssinaturas } from "@/utils/automacaoAssinatura";

async function registrarPush() {
  try {
    if (typeof window === "undefined") return;

    const user = auth.currentUser;

    if (!user) {
      console.log("Usuário não autenticado para registrar push.");
      return;
    }

    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Permissão de notificação negada.");
      return;
    }

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey:
        "BBpzO7VrkvEz9mCd0UORaOAYd1LZIPaqWEUT5pt-hxcM15SoIbx0n-wIGSSuGAFdY67AsQ8ks7Y5B_uMLgxNgTY",
    });

    if (!token) {
      console.log("Nenhum token FCM retornado.");
      return;
    }

    await setDoc(
      doc(db, "tokens", user.uid),
      {
        token,
        criadoEm: new Date().toISOString(),
        userId: user.uid,
      },
      { merge: true }
    );

    console.log("Token salvo no Firestore com sucesso.");
  } catch (error) {
    console.error("Erro ao registrar push:", error);
  }
}

type CardCarouselItem = {
  titulo: string;
  descricao: string;
  rota: string;
  gradiente: string;
  borda: string;
  glow: string;
};

type Aluno = {
  id: string;
  nome?: string;
  status?: string;
  pagamentoStatus?: string;
  diaVencimento?: number;
  valor?: string | number;
  userId?: string;
};

type Aula = {
  id: string;
  data?: string;
  hora?: string;
  status?: string;
  userId?: string;
};

type RegistroFinanceiro = {
  id: string;
  valor?: number | string;
  status?: string;
  mes?: string;
  userId?: string;
};

type PersonalData = {
  userId?: string;
  nome?: string;
  email?: string;
  tipo?: string;
  plano?: string;
  valorPlano?: number;
  statusAcesso?: string;
  trialInicio?: string;
  trialFim?: string;
  pagamentoStatus?: string;
  vencimentoEm?: string | null;
  linkPagamento?: string;
};

const atalhosCarousel: CardCarouselItem[] = [
  {
    titulo: "Assinatura",
    descricao:
      "Escolha seu plano, acompanhe o trial e fale no WhatsApp para continuar usando o aplicativo.",
    rota: "/dashboard/assinatura",
    gradiente:
      "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.10))",
    borda: "1px solid rgba(52,211,153,0.24)",
    glow: "0 18px 38px rgba(16,185,129,0.16)",
  },
  {
    titulo: "Lista de alunos",
    descricao:
      "Visualize cadastros, edite informações, acompanhe o financeiro e acesse os alunos com rapidez.",
    rota: "/dashboard/lista-alunos",
    gradiente:
      "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.10))",
    borda: "1px solid rgba(96,165,250,0.24)",
    glow: "0 18px 38px rgba(59,130,246,0.16)",
  },
  {
    titulo: "Agenda",
    descricao:
      "Cadastre aulas, veja presença, faltas, reposições e acompanhe a semana por horário.",
    rota: "/dashboard/agenda",
    gradiente:
      "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(22,163,74,0.10))",
    borda: "1px solid rgba(74,222,128,0.24)",
    glow: "0 18px 38px rgba(34,197,94,0.16)",
  },
  {
    titulo: "Financeiro",
    descricao:
      "Controle cobranças, pagamentos, pendências e tenha visão clara do caixa do personal.",
    rota: "/dashboard/financeiro",
    gradiente:
      "linear-gradient(135deg, rgba(250,204,21,0.22), rgba(234,179,8,0.10))",
    borda: "1px solid rgba(250,204,21,0.24)",
    glow: "0 18px 38px rgba(250,204,21,0.16)",
  },
  {
    titulo: "Cadastrar aluno",
    descricao:
      "Adicione novos alunos, organize plano, cobrança, vencimento e deixe tudo pronto para o sistema.",
    rota: "/dashboard/cadastro",
    gradiente:
      "linear-gradient(135deg, rgba(236,72,153,0.22), rgba(190,24,93,0.10))",
    borda: "1px solid rgba(244,114,182,0.24)",
    glow: "0 18px 38px rgba(236,72,153,0.16)",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [financeiro, setFinanceiro] = useState<RegistroFinanceiro[]>([]);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [dadosUsuario, setDadosUsuario] = useState<PersonalData | null>(null);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024);
      setIsCompact(width <= 480);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const currentUser = user;

      async function carregarDashboard() {
        try {
          setCarregandoMetricas(true);

          console.log("1 - lendo users");
          const personalRef = doc(db, "users", currentUser.uid);
          const personalSnap = await getDoc(personalRef);

          console.log("UID logado:", currentUser.uid);
          console.log("Documento existe?", personalSnap.exists());

          if (!personalSnap.exists()) {
            console.log("Documento do usuário não encontrado em /users/{uid}");
            router.push("/bloqueado");
            return;
          }

          const personal = personalSnap.data() as PersonalData;
          const isAdminAtual = personal?.tipo === "admin";

          console.log("Dados do usuário:", personal);
          console.log("Tipo:", personal?.tipo);
          console.log("isAdmin:", isAdminAtual);

          console.log("2 - atualizando campos assinatura, se necessário");
          const precisaAtualizarCamposDeAssinatura =
            !personal.plano ||
            personal.valorPlano === undefined ||
            !personal.statusAcesso ||
            !personal.trialInicio ||
            !personal.trialFim ||
            !personal.pagamentoStatus ||
            !("vencimentoEm" in personal) ||
            !("linkPagamento" in personal);

          if (precisaAtualizarCamposDeAssinatura) {
            const agora = new Date();
            const trialFim = calcularFimTrial();

            await updateDoc(personalRef, {
              plano: personal.plano || (isAdminAtual ? "anual" : "mensal"),
              valorPlano:
                personal.valorPlano !== undefined
                  ? personal.valorPlano
                  : isAdminAtual
                  ? 0
                  : getValorPlano("mensal"),
              statusAcesso: isAdminAtual
                ? personal.statusAcesso || "ativo"
                : personal.statusAcesso || "trial",
              trialInicio: personal.trialInicio || agora.toISOString(),
              trialFim: personal.trialFim || trialFim.toISOString(),
              pagamentoStatus: isAdminAtual
                ? personal.pagamentoStatus || "pago"
                : personal.pagamentoStatus || "pendente",
              vencimentoEm:
                "vencimentoEm" in personal ? personal.vencimentoEm ?? null : null,
              linkPagamento: personal.linkPagamento || "",
            });
          }

          console.log("3 - relendo user atualizado");
          const personalAtualizadoSnap = await getDoc(personalRef);

          if (!personalAtualizadoSnap.exists()) {
            console.log("Documento sumiu após atualização");
            router.push("/bloqueado");
            return;
          }

          const personalAtualizado =
            personalAtualizadoSnap.data() as PersonalData;

          console.log("Dados atualizados:", personalAtualizado);
          setDadosUsuario(personalAtualizado);

          const bloqueado = acessoBloqueado({
            statusAcesso: personalAtualizado?.statusAcesso,
            pagamentoStatus: personalAtualizado?.pagamentoStatus,
            trialFim: personalAtualizado?.trialFim,
            vencimentoEm: personalAtualizado?.vencimentoEm,
            tipo: personalAtualizado?.tipo,
          });

          console.log("bloqueado:", bloqueado);

          if (bloqueado) {
            router.push("/bloqueado");
            return;
          }

          console.log("4 - processando automação");
          await processarAutomacaoAssinaturas();

          console.log("5 - registrando push");
          await registrarPush();

          console.log("6 - lendo students");
          const alunosSnapshot = await getDocs(
            query(collection(db, "students"), where("userId", "==", currentUser.uid))
          );

          console.log("7 - lendo agenda");
          const agendaSnapshot = await getDocs(
            query(collection(db, "agenda"), where("userId", "==", currentUser.uid))
          );

          console.log("8 - lendo financeiro");
          const financeiroSnapshot = await getDocs(
            query(collection(db, "financeiro"), where("userId", "==", currentUser.uid))
          );

          const listaAlunos = alunosSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as Aluno[];

          const listaAulas = agendaSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as Aula[];

          const listaFinanceiro = financeiroSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as RegistroFinanceiro[];

          setAlunos(listaAlunos);
          setAulas(listaAulas);
          setFinanceiro(listaFinanceiro);
        } catch (error) {
          console.error("ERRO REAL DO DASHBOARD =>", error);
        } finally {
          setCarregandoMetricas(false);
        }
      }

      await carregarDashboard();
    });

    return () => unsubscribe();
  }, [router]);

  function irParaRota(rota: string) {
    router.push(rota);
  }

  function proximoCard() {
    const proximoIndice = (indiceAtual + 1) % atalhosCarousel.length;
    setIndiceAtual(proximoIndice);
    scrollParaIndice(proximoIndice);
  }

  function cardAnterior() {
    const anteriorIndice =
      (indiceAtual - 1 + atalhosCarousel.length) % atalhosCarousel.length;
    setIndiceAtual(anteriorIndice);
    scrollParaIndice(anteriorIndice);
  }

  function scrollParaIndice(indice: number) {
    if (!carouselRef.current) return;

    const container = carouselRef.current;
    const card = container.children[indice] as HTMLElement | undefined;
    if (!card) return;

    container.scrollTo({
      left: card.offsetLeft - 8,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceAtual((valorAtual) => {
        const proximo = (valorAtual + 1) % atalhosCarousel.length;
        scrollParaIndice(proximo);
        return proximo;
      });
    }, 4500);

    return () => clearInterval(intervalo);
  }, []);

  const hoje = new Date();
  const hojeISO = hoje.toISOString().split("T")[0];

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  const diaHoje = hoje.getDate();
  const diaAmanha = amanha.getDate();

  const mesAtualTexto = hoje.toLocaleDateString("pt-BR", {
    month: "2-digit",
    year: "numeric",
  });

  const totalAreas = atalhosCarousel.length;

  const isAdmin = useMemo(() => {
    return dadosUsuario?.tipo === "admin";
  }, [dadosUsuario]);

  const alunosAtivos = useMemo(() => {
    return alunos.filter((aluno) => aluno.status === "ativo").length;
  }, [alunos]);

  const pagamentosPendentes = useMemo(() => {
    return alunos.filter(
      (aluno) =>
        aluno.pagamentoStatus === "pendente" ||
        aluno.pagamentoStatus === "atrasado"
    ).length;
  }, [alunos]);

  const pagamentosPagos = useMemo(() => {
    return alunos.filter((aluno) => aluno.pagamentoStatus === "pago").length;
  }, [alunos]);

  const aulasDoDia = useMemo(() => {
    return aulas.filter((aula) => aula.data === hojeISO).length;
  }, [aulas, hojeISO]);

  const faturamentoMensal = useMemo(() => {
    const registrosDoMes = financeiro.filter((item) => {
      return item.mes === mesAtualTexto && item.status === "pago";
    });

    return registrosDoMes.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );
  }, [financeiro, mesAtualTexto]);

  const vencemHoje = useMemo(() => {
    return alunos.filter(
      (aluno) => Number(aluno.diaVencimento || 0) === diaHoje
    ).length;
  }, [alunos, diaHoje]);

  const vencemAmanha = useMemo(() => {
    return alunos.filter(
      (aluno) => Number(aluno.diaVencimento || 0) === diaAmanha
    ).length;
  }, [alunos, diaAmanha]);

  const textoStatusMetricas = useMemo(() => {
    if (carregandoMetricas) return "Carregando métricas...";

    if (isAdmin) {
      return `Modo administrador ativo em ${primeiraMaiuscula(
        hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      )}.`;
    }

    return `Base integrada com alunos, agenda e financeiro em ${primeiraMaiuscula(
      hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    )}.`;
  }, [carregandoMetricas, hoje, isAdmin]);

  const heroResponsivo = {
    ...hero,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "1fr"
      : "1.15fr 0.85fr",
    gap: isMobile ? "14px" : isTablet ? "16px" : "20px",
  };

  const heroPrincipalResponsivo = {
    ...heroPrincipal,
    padding: isCompact ? "16px" : isMobile ? "18px" : isTablet ? "24px" : "32px",
    borderRadius: isMobile ? "20px" : "30px",
  };

  const tituloResponsivo = {
    ...titulo,
    fontSize: isCompact ? "30px" : isMobile ? "34px" : isTablet ? "44px" : "56px",
    lineHeight: isMobile ? 1.06 : 1.02,
    wordBreak: "break-word" as const,
  };

  const descricaoResponsiva = {
    ...descricao,
    maxWidth: "100%",
    fontSize: isMobile ? "15px" : "16px",
    lineHeight: isMobile ? 1.7 : 1.8,
  };

  const acoesHeroResponsiva = {
    ...acoesHero,
    flexDirection: isMobile ? ("column" as const) : ("row" as const),
    gap: isMobile ? "10px" : "12px",
    marginTop: isMobile ? "20px" : "26px",
  };

  const heroLateralResponsiva = {
    ...heroLateral,
    gridTemplateRows: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? "14px" : "18px",
  };

  const heroResumoCardResponsivo = {
    ...heroResumoCard,
    padding: isCompact ? "16px" : isMobile ? "18px" : "24px",
    borderRadius: isMobile ? "20px" : "26px",
  };

  const blocoMetricasResponsivo = {
    ...blocoMetricas,
    padding: isCompact ? "14px" : isMobile ? "16px" : isTablet ? "22px" : "28px",
    borderRadius: isMobile ? "20px" : "30px",
  };

  const metricasHeaderResponsivo = {
    ...metricasHeader,
    gap: isMobile ? "12px" : "16px",
    marginBottom: isMobile ? "16px" : "20px",
  };

  const metricasTituloResponsivo = {
    ...metricasTitulo,
    fontSize: isCompact ? "24px" : isMobile ? "26px" : isTablet ? "30px" : "36px",
  };

  const metricasStatusBoxResponsivo = {
    ...metricasStatusBox,
    width: isMobile ? "100%" : "auto",
  };

  const gridMetricasResponsivo = {
    ...gridMetricas,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))",
    gap: isMobile ? "12px" : "16px",
  };

  const blocoCarouselResponsivo = {
    ...blocoCarousel,
    padding: isCompact ? "14px" : isMobile ? "16px" : isTablet ? "22px" : "28px",
    borderRadius: isMobile ? "20px" : "30px",
  };

  const blocoHeaderResponsivo = {
    ...blocoHeader,
    gap: isMobile ? "12px" : "16px",
    marginBottom: isMobile ? "16px" : "20px",
  };

  const blocoTituloResponsivo = {
    ...blocoTitulo,
    fontSize: isCompact ? "24px" : isMobile ? "26px" : isTablet ? "30px" : "36px",
  };

  const carouselTrackResponsivo = {
    ...carouselTrack,
    gridAutoColumns: isCompact
      ? "88%"
      : isMobile
      ? "84%"
      : isTablet
      ? "minmax(280px, 320px)"
      : "minmax(320px, 360px)",
    gap: isMobile ? "12px" : "18px",
  };

  const blocoPremiumInfoResponsivo = {
    ...premiumInfoCard,
    padding: isCompact ? "14px" : isMobile ? "16px" : isTablet ? "22px" : "28px",
    borderRadius: isMobile ? "20px" : "30px",
  };

  const premiumTituloResponsivo = {
    ...premiumTitulo,
    fontSize: isCompact ? "24px" : isMobile ? "26px" : isTablet ? "30px" : "34px",
  };

  return (
    <div
      style={{
        ...pagina,
        gap: isMobile ? "16px" : "26px",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <div style={fundoGlowUm}></div>
      <div style={fundoGlowDois}></div>
      <div style={fundoGlowTres}></div>

      <section style={heroResponsivo}>
        <div style={heroPrincipalResponsivo}>
          <p style={eyebrow}>
            {isAdmin
              ? "Painel premium do TrainerFlow • Administrador"
              : "Painel premium do TrainerFlow"}
          </p>

          <h1 style={tituloResponsivo}>{saudacao}, bem-vindo ao seu dashboard</h1>

          <p style={descricaoResponsiva}>
            Centralize sua gestão profissional em um só lugar. Acesse alunos,
            agenda, financeiro e cadastros com visual premium, navegação mais
            elegante e fluxo mais organizado.
          </p>

          <div style={acoesHeroResponsiva}>
            <button
              onClick={() => irParaRota("/dashboard/lista-alunos")}
              style={{
                ...botaoPrincipal,
                width: isMobile ? "100%" : "auto",
              }}
            >
              Abrir lista de alunos
            </button>

            <button
              onClick={() => irParaRota("/dashboard/agenda")}
              style={{
                ...botaoSecundario,
                width: isMobile ? "100%" : "auto",
              }}
            >
              Ir para agenda
            </button>
          </div>
        </div>

        <div style={heroLateralResponsiva}>
          <div style={heroResumoCardResponsivo}>
            <p style={heroResumoRotulo}>Acesso rápido</p>
            <h2
              style={{
                ...heroResumoValorAzul,
                fontSize: isMobile ? "32px" : "40px",
              }}
            >
              {totalAreas}
            </h2>
            <p style={heroResumoTexto}>
              Áreas principais para controlar seu sistema com rapidez.
            </p>
          </div>

          <div style={heroResumoCardResponsivo}>
            <p style={heroResumoRotulo}>Organização</p>
            <h2
              style={{
                ...heroResumoValorVerde,
                fontSize: isMobile ? "32px" : "40px",
              }}
            >
              {isAdmin ? "Admin" : "Premium"}
            </h2>
            <p style={heroResumoTexto}>
              Estrutura profissional separada para alunos, agenda, financeiro e
              cadastro.
            </p>
          </div>
        </div>
      </section>

      <section style={blocoMetricasResponsivo}>
        <div style={metricasHeaderResponsivo}>
          <div>
            <p style={metricasMini}>Visão geral da plataforma</p>
            <h2 style={metricasTituloResponsivo}>Indicadores principais</h2>
          </div>

          <div style={metricasStatusBoxResponsivo}>
            <span style={metricasStatusDot}></span>
            <span style={metricasStatusTexto}>{textoStatusMetricas}</span>
          </div>
        </div>

        <div style={gridMetricasResponsivo}>
          <div style={cardMetricaVerde}>
            <p style={metricaRotulo}>Alunos ativos</p>
            <h3
              style={{
                ...metricaValorVerde,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : alunosAtivos}
            </h3>
            <p style={metricaTexto}>Total de alunos com status ativo.</p>
          </div>

          <div style={cardMetricaAmarelo}>
            <p style={metricaRotulo}>Pagamentos pendentes</p>
            <h3
              style={{
                ...metricaValorAmarelo,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : pagamentosPendentes}
            </h3>
            <p style={metricaTexto}>Pendentes e atrasados na base atual.</p>
          </div>

          <div style={cardMetricaAzul}>
            <p style={metricaRotulo}>Pagamentos pagos</p>
            <h3
              style={{
                ...metricaValorAzul,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : pagamentosPagos}
            </h3>
            <p style={metricaTexto}>Alunos marcados com pagamento em dia.</p>
          </div>

          <div style={cardMetricaCiano}>
            <p style={metricaRotulo}>Aulas do dia</p>
            <h3
              style={{
                ...metricaValorCiano,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : aulasDoDia}
            </h3>
            <p style={metricaTexto}>Aulas registradas para hoje na agenda.</p>
          </div>

          <div style={cardMetricaVerdeForte}>
            <p style={metricaRotulo}>Faturamento mensal</p>
            <h3
              style={{
                ...metricaValorVerdeForte,
                fontSize: isMobile ? "28px" : "34px",
              }}
            >
              {carregandoMetricas ? "R$ --" : formatarMoeda(faturamentoMensal)}
            </h3>
            <p style={metricaTexto}>
              Valores marcados como pagos no mês atual.
            </p>
          </div>

          <div style={cardMetricaRoxo}>
            <p style={metricaRotulo}>Vencem hoje</p>
            <h3
              style={{
                ...metricaValorRoxo,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : vencemHoje}
            </h3>
            <p style={metricaTexto}>Cobranças com vencimento no dia atual.</p>
          </div>

          <div style={cardMetricaRosa}>
            <p style={metricaRotulo}>Vencem amanhã</p>
            <h3
              style={{
                ...metricaValorRosa,
                fontSize: isMobile ? "30px" : "38px",
              }}
            >
              {carregandoMetricas ? "--" : vencemAmanha}
            </h3>
            <p style={metricaTexto}>
              Antecipação visual das cobranças do próximo dia.
            </p>
          </div>
        </div>
      </section>

      <section style={blocoCarouselResponsivo}>
        <div style={blocoHeaderResponsivo}>
          <div>
            <p style={blocoMini}>Navegação principal</p>
            <h2 style={blocoTituloResponsivo}>Acesso em carrossel</h2>
          </div>

          <div style={controlesCarousel}>
            <button onClick={cardAnterior} style={botaoControleCarousel}>
              ←
            </button>
            <button onClick={proximoCard} style={botaoControleCarousel}>
              →
            </button>
          </div>
        </div>

        <div ref={carouselRef} style={carouselTrackResponsivo}>
          {atalhosCarousel.map((item, indice) => (
            <div
              key={item.titulo}
              style={{
                ...cardCarousel,
                minHeight: isMobile ? "220px" : "250px",
                padding: isCompact ? "16px" : isMobile ? "18px" : "24px",
                borderRadius: isMobile ? "20px" : "28px",
                background: item.gradiente,
                border: item.borda,
                boxShadow:
                  indice === indiceAtual
                    ? `${item.glow}, 0 0 0 1px rgba(255,255,255,0.08) inset`
                    : item.glow,
                transform:
                  indice === indiceAtual ? "scale(1.01)" : "scale(0.985)",
              }}
            >
              <div style={cardCarouselTopo}>
                <div style={cardIndice}>
                  {String(indice + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    ...statusAtivoCarousel,
                    ...(indice === indiceAtual
                      ? statusAtivoOn
                      : statusAtivoOff),
                  }}
                >
                  {indice === indiceAtual ? "Em destaque" : "Atalho"}
                </div>
              </div>

              <div style={cardCarouselConteudo}>
                <h3
                  style={{
                    ...cardCarouselTitulo,
                    fontSize: isCompact ? "22px" : isMobile ? "24px" : "30px",
                  }}
                >
                  {item.titulo}
                </h3>
                <p
                  style={{
                    ...cardCarouselDescricao,
                    lineHeight: isMobile ? 1.6 : 1.8,
                  }}
                >
                  {item.descricao}
                </p>
              </div>

              <button
                onClick={() => irParaRota(item.rota)}
                style={botaoAcessarCarousel}
              >
                Acessar
              </button>
            </div>
          ))}
        </div>

        <div style={indicadoresCarousel}>
          {atalhosCarousel.map((_, indice) => (
            <button
              key={indice}
              onClick={() => {
                setIndiceAtual(indice);
                scrollParaIndice(indice);
              }}
              style={{
                ...indicadorDot,
                ...(indice === indiceAtual ? indicadorDotAtivo : {}),
              }}
            />
          ))}
        </div>
      </section>

      <section style={blocoPremiumInfo}>
        <div style={blocoPremiumInfoResponsivo}>
          <p style={premiumMini}>Fluxo recomendado</p>
          <h2 style={premiumTituloResponsivo}>Como usar o TrainerFlow</h2>

          <div style={premiumGrid}>
            <div
              style={{
                ...premiumItem,
                gap: isMobile ? "12px" : "16px",
                padding: isCompact ? "12px" : isMobile ? "14px" : "18px",
                borderRadius: isMobile ? "18px" : "22px",
              }}
            >
              <span style={premiumNumero}>1</span>
              <div>
                <h3
                  style={{
                    ...premiumItemTitulo,
                    fontSize: isMobile ? "18px" : "20px",
                  }}
                >
                  Cadastre ou atualize alunos
                </h3>
                <p style={premiumItemTexto}>
                  Organize dados, plano, cobrança, vencimento e situação de cada
                  aluno.
                </p>
              </div>
            </div>

            <div
              style={{
                ...premiumItem,
                gap: isMobile ? "12px" : "16px",
                padding: isCompact ? "12px" : isMobile ? "14px" : "18px",
                borderRadius: isMobile ? "18px" : "22px",
              }}
            >
              <span style={premiumNumero}>2</span>
              <div>
                <h3
                  style={{
                    ...premiumItemTitulo,
                    fontSize: isMobile ? "18px" : "20px",
                  }}
                >
                  Monte sua agenda semanal
                </h3>
                <p style={premiumItemTexto}>
                  Distribua aulas, horários, presença, faltas e reposições com
                  controle visual.
                </p>
              </div>
            </div>

            <div
              style={{
                ...premiumItem,
                gap: isMobile ? "12px" : "16px",
                padding: isCompact ? "12px" : isMobile ? "14px" : "18px",
                borderRadius: isMobile ? "18px" : "22px",
              }}
            >
              <span style={premiumNumero}>3</span>
              <div>
                <h3
                  style={{
                    ...premiumItemTitulo,
                    fontSize: isMobile ? "18px" : "20px",
                  }}
                >
                  Feche com o financeiro
                </h3>
                <p style={premiumItemTexto}>
                  Controle pagamentos, pendências e cobranças com mais precisão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function primeiraMaiuscula(texto: string) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const pagina = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "26px",
  overflow: "hidden" as const,
};

const fundoGlowUm = {
  position: "fixed" as const,
  top: "-140px",
  left: "-120px",
  width: "340px",
  height: "340px",
  borderRadius: "999px",
  background: "rgba(59,130,246,0.18)",
  filter: "blur(90px)",
  pointerEvents: "none" as const,
  zIndex: 0,
};

const fundoGlowDois = {
  position: "fixed" as const,
  top: "180px",
  right: "-100px",
  width: "320px",
  height: "320px",
  borderRadius: "999px",
  background: "rgba(236,72,153,0.14)",
  filter: "blur(95px)",
  pointerEvents: "none" as const,
  zIndex: 0,
};

const fundoGlowTres = {
  position: "fixed" as const,
  bottom: "-100px",
  left: "20%",
  width: "340px",
  height: "340px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  filter: "blur(95px)",
  pointerEvents: "none" as const,
  zIndex: 0,
};

const hero = {
  position: "relative" as const,
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "20px",
};

const heroPrincipal = {
  background:
    "linear-gradient(135deg, rgba(12,24,72,0.92), rgba(20,34,96,0.72))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "30px",
  padding: "32px",
  boxShadow: "0 24px 48px rgba(0,0,0,0.26)",
  backdropFilter: "blur(18px)",
};

const eyebrow = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
};

const titulo = {
  margin: "10px 0 14px 0",
  fontSize: "56px",
  lineHeight: 1.02,
  fontWeight: 900,
  color: "#ffffff",
  textShadow: "0 3px 18px rgba(0,0,0,0.18)",
};

const descricao = {
  margin: 0,
  color: "rgba(255,255,255,0.80)",
  fontSize: "16px",
  lineHeight: 1.8,
  maxWidth: "90%",
};

const acoesHero = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "26px",
};

const botaoPrincipal = {
  height: "54px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #64f58d, #22c55e)",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 16px 32px rgba(34,197,94,0.30)",
};

const botaoSecundario = {
  height: "54px",
  padding: "0 20px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const heroLateral = {
  display: "grid",
  gridTemplateRows: "1fr 1fr",
  gap: "18px",
};

const heroResumoCard = {
  background:
    "linear-gradient(135deg, rgba(18,34,98,0.86), rgba(35,52,128,0.58))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "26px",
  padding: "24px",
  boxShadow: "0 20px 42px rgba(0,0,0,0.22)",
  backdropFilter: "blur(18px)",
};

const heroResumoRotulo = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
};

const heroResumoValorAzul = {
  margin: "10px 0",
  color: "#60a5fa",
  fontSize: "40px",
  fontWeight: 900,
};

const heroResumoValorVerde = {
  margin: "10px 0",
  color: "#4ade80",
  fontSize: "40px",
  fontWeight: 900,
};

const heroResumoTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.76)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const blocoMetricas = {
  position: "relative" as const,
  zIndex: 1,
  background:
    "linear-gradient(135deg, rgba(14,26,84,0.84), rgba(20,36,112,0.52))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "30px",
  padding: "28px",
  boxShadow: "0 22px 46px rgba(0,0,0,0.24)",
  backdropFilter: "blur(18px)",
};

const metricasHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "20px",
};

const metricasMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const metricasTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: 900,
};

const metricasStatusBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const metricasStatusDot = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  background: "#4ade80",
  boxShadow: "0 0 12px rgba(74,222,128,0.45)",
};

const metricasStatusTexto = {
  color: "rgba(255,255,255,0.76)",
  fontSize: "13px",
  lineHeight: 1.5,
};

const gridMetricas = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
};

const cardMetricaBase = {
  minHeight: "165px",
  borderRadius: "24px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 18px 38px rgba(0,0,0,0.20)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "12px",
};

const cardMetricaVerde = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(22,163,74,0.08))",
};

const cardMetricaAmarelo = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(250,204,21,0.18), rgba(234,179,8,0.08))",
};

const cardMetricaAzul = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(37,99,235,0.08))",
};

const cardMetricaCiano = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(14,165,233,0.08))",
};

const cardMetricaVerdeForte = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(74,222,128,0.20), rgba(21,128,61,0.08))",
};

const cardMetricaRoxo = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(126,34,206,0.08))",
};

const cardMetricaRosa = {
  ...cardMetricaBase,
  background:
    "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(190,24,93,0.08))",
};

const metricaRotulo = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
  fontWeight: 700,
};

const metricaValorVerde = {
  margin: "6px 0",
  color: "#86efac",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaValorAmarelo = {
  margin: "6px 0",
  color: "#fde68a",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaValorAzul = {
  margin: "6px 0",
  color: "#93c5fd",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaValorCiano = {
  margin: "6px 0",
  color: "#7dd3fc",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaValorVerdeForte = {
  margin: "6px 0",
  color: "#4ade80",
  fontSize: "34px",
  fontWeight: 900,
};

const metricaValorRoxo = {
  margin: "6px 0",
  color: "#d8b4fe",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaValorRosa = {
  margin: "6px 0",
  color: "#f9a8d4",
  fontSize: "38px",
  fontWeight: 900,
};

const metricaTexto = {
  margin: 0,
  color: "rgba(255,255,255,0.74)",
  fontSize: "13px",
  lineHeight: 1.6,
};

const blocoCarousel = {
  position: "relative" as const,
  zIndex: 1,
  background:
    "linear-gradient(135deg, rgba(14,26,84,0.84), rgba(20,36,112,0.52))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "30px",
  padding: "28px",
  boxShadow: "0 22px 46px rgba(0,0,0,0.24)",
  backdropFilter: "blur(18px)",
};

const blocoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "20px",
};

const blocoMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const blocoTitulo = {
  margin: "8px 0 0 0",
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: 900,
};

const controlesCarousel = {
  display: "flex",
  gap: "10px",
};

const botaoControleCarousel = {
  width: "46px",
  height: "46px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
};

const carouselTrack = {
  display: "grid",
  gridAutoFlow: "column" as const,
  gridAutoColumns: "minmax(320px, 360px)",
  gap: "18px",
  overflowX: "auto" as const,
  paddingBottom: "10px",
  scrollSnapType: "x mandatory" as const,
};

const cardCarousel = {
  minHeight: "250px",
  borderRadius: "28px",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "18px",
  transition: "all 0.25s ease",
  scrollSnapAlign: "start" as const,
  backdropFilter: "blur(14px)",
};

const cardCarouselTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const cardIndice = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.10)",
};

const statusAtivoCarousel = {
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const statusAtivoOn = {
  background: "rgba(255,255,255,0.14)",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.14)",
};

const statusAtivoOff = {
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.76)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const cardCarouselConteudo = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const cardCarouselTitulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: 900,
};

const cardCarouselDescricao = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "14px",
  lineHeight: 1.8,
};

const botaoAcessarCarousel = {
  height: "50px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.12)",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "14px",
  cursor: "pointer",
};

const indicadoresCarousel = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "center",
  gap: "10px",
};

const indicadorDot = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(255,255,255,0.18)",
  cursor: "pointer",
};

const indicadorDotAtivo = {
  background: "#ffffff",
  boxShadow: "0 0 14px rgba(255,255,255,0.26)",
};

const blocoPremiumInfo = {
  position: "relative" as const,
  zIndex: 1,
  display: "flex",
};

const premiumInfoCard = {
  width: "100%",
  background:
    "linear-gradient(135deg, rgba(14,26,84,0.84), rgba(20,36,112,0.50))",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "30px",
  padding: "28px",
  boxShadow: "0 22px 46px rgba(0,0,0,0.24)",
  backdropFilter: "blur(18px)",
};

const premiumMini = {
  margin: 0,
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};

const premiumTitulo = {
  margin: "8px 0 20px 0",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
};

const premiumGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
};

const premiumItem = {
  display: "flex",
  gap: "16px",
  alignItems: "flex-start",
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const premiumNumero = {
  minWidth: "44px",
  height: "44px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(96,165,250,0.16)",
  border: "1px solid rgba(96,165,250,0.20)",
  color: "#93c5fd",
  fontSize: "18px",
  fontWeight: 900,
};

const premiumItemTitulo = {
  margin: 0,
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 800,
};

const premiumItemTexto = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.76)",
  fontSize: "14px",
  lineHeight: 1.75,
};