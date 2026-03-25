import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  addDoc,
} from "firebase/firestore";
import db from "@/app/firebaseDb";

type UsuarioSistema = {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
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

export async function processarAutomacaoAssinaturas() {
  const snapshot = await getDocs(collection(db, "users"));
  const agora = new Date();

  for (const docItem of snapshot.docs) {
    const usuario = {
      id: docItem.id,
      ...docItem.data(),
    } as UsuarioSistema;

    if (usuario.tipo === "admin") {
      continue;
    }

    const ref = doc(db, "users", usuario.id);

    // 1) Trial vencido
    if (usuario.statusAcesso === "trial" && usuario.trialFim) {
      const trialFim = new Date(usuario.trialFim);

      if (!Number.isNaN(trialFim.getTime()) && agora > trialFim) {
        await updateDoc(ref, {
          statusAcesso: "bloqueado",
          pagamentoStatus: usuario.pagamentoStatus || "pendente",
        });

        await registrarAvisoInterno({
          userId: usuario.id,
          titulo: "Trial encerrado",
          mensagem: "O período de 3 dias grátis foi encerrado e o acesso foi bloqueado automaticamente.",
          tipo: "trial_encerrado",
        });

        continue;
      }
    }

    // 2) Assinatura vencida
    if (usuario.statusAcesso === "ativo" && usuario.vencimentoEm) {
      const vencimento = new Date(usuario.vencimentoEm);

      if (!Number.isNaN(vencimento.getTime()) && agora > vencimento) {
        await updateDoc(ref, {
          statusAcesso: "bloqueado",
          pagamentoStatus: "atrasado",
        });

        await registrarAvisoInterno({
          userId: usuario.id,
          titulo: "Assinatura vencida",
          mensagem: "A assinatura venceu e o acesso foi bloqueado automaticamente.",
          tipo: "assinatura_vencida",
        });

        continue;
      }
    }
  }
}

async function registrarAvisoInterno({
  userId,
  titulo,
  mensagem,
  tipo,
}: {
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
}) {
  const avisosRef = collection(db, "avisos");

  const existente = await getDocs(
    query(
      avisosRef,
      where("userId", "==", userId),
      where("tipo", "==", tipo),
      where("lido", "==", false)
    )
  );

  if (!existente.empty) {
    return;
  }

  await addDoc(avisosRef, {
    userId,
    titulo,
    mensagem,
    tipo,
    lido: false,
    criadoEm: new Date().toISOString(),
  });
}