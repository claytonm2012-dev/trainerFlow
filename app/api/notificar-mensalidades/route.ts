import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import serviceAccount from "@/firebase-admin.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

function agoraBrasil() {
  const agora = new Date();

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(agora);

  const ano = Number(partes.find((p) => p.type === "year")?.value ?? 0);
  const mes = Number(partes.find((p) => p.type === "month")?.value ?? 0);
  const dia = Number(partes.find((p) => p.type === "day")?.value ?? 0);

  return { ano, mes, dia };
}

function formatarDataISO(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");

    if (secret !== "trainerflow_secret_2026") {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const { ano, mes, dia } = agoraBrasil();

    const hojeISO = formatarDataISO(ano, mes, dia);

    const amanha = new Date(`${hojeISO}T12:00:00`);
    amanha.setDate(amanha.getDate() + 1);
    const diaAmanha = amanha.getDate();

    const studentsSnapshot = await db.collection("students").get();

    if (studentsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "Nenhum aluno encontrado.",
        enviadas: 0,
      });
    }

    let enviadas = 0;
    const detalhes: string[] = [];

    for (const docItem of studentsSnapshot.docs) {
      const aluno = docItem.data();

      const nome = aluno.nome ?? "Aluno";
      const userId = aluno.userId ?? "";
      const diaVencimento = Number(aluno.diaVencimento ?? 0);
      const pagamentoStatus = String(aluno.pagamentoStatus ?? "pendente");
      const statusAluno = String(aluno.status ?? "ativo");

      if (!userId || !diaVencimento) continue;
      if (statusAluno === "inativo") continue;

      let titulo = "";
      let mensagem = "";
      let tipoAviso = "";

      if (diaVencimento === dia && pagamentoStatus !== "pago") {
        titulo = "Mensalidade vence hoje";
        mensagem = `${nome} vence hoje.`;
        tipoAviso = "vence_hoje";
      } else if (diaVencimento === diaAmanha && pagamentoStatus !== "pago") {
        titulo = "Mensalidade vence amanhã";
        mensagem = `${nome} vence amanhã.`;
        tipoAviso = "vence_amanha";
      } else if (diaVencimento < dia && pagamentoStatus !== "pago") {
        titulo = "Mensalidade atrasada";
        mensagem = `${nome} está com mensalidade atrasada.`;
        tipoAviso = "atrasado";
      } else {
        continue;
      }

      const tokenDoc = await db.collection("tokens").doc(userId).get();

      if (!tokenDoc.exists) {
        detalhes.push(`Sem token para userId ${userId}`);
        continue;
      }

      const tokenData = tokenDoc.data();
      const token = tokenData?.token;

      if (!token) {
        detalhes.push(`Documento tokens/${userId} sem campo token`);
        continue;
      }

      const chaveControle = `${tipoAviso}_${hojeISO}`;

      const controleRef = db
        .collection("students")
        .doc(docItem.id)
        .collection("controle_notificacoes")
        .doc(chaveControle);

      const controleExiste = await controleRef.get();

      if (controleExiste.exists) {
        continue;
      }

      await admin.messaging().send({
        token,
        notification: {
          title: titulo,
          body: mensagem,
        },
        data: {
          tipo: "lembrete_mensalidade",
          alunoNome: String(nome),
          tipoAviso,
          dataReferencia: hojeISO,
        },
      });

      await controleRef.set({
        enviadoEm: new Date().toISOString(),
        tipoAviso,
        dataReferencia: hojeISO,
        userId,
        alunoNome: nome,
      });

      enviadas += 1;
      detalhes.push(`Enviado: ${titulo} - ${nome}`);
    }

    return NextResponse.json({
      success: true,
      message: "Verificação de mensalidades concluída.",
      dataReferencia: hojeISO,
      enviadas,
      detalhes,
    });
  } catch (error: any) {
    console.error("Erro ao notificar mensalidades:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ?? "Erro interno.",
      },
      { status: 500 }
    );
  }
}