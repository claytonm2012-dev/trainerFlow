import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function pad(valor: number) {
  return String(valor).padStart(2, "0");
}

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

  const ano = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  const dia = partes.find((p) => p.type === "day")?.value ?? "";
  const hora = partes.find((p) => p.type === "hour")?.value ?? "";
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "";

  return {
    data: `${ano}-${mes}-${dia}`,
    hora: `${hora}:${minuto}`,
  };
}

function horaMenos20Minutos(horaAula: string) {
  const [h, m] = horaAula.split(":").map(Number);
  const totalMin = h * 60 + m;
  const alvo = totalMin - 20;

  if (alvo < 0) return null;

  const novaHora = Math.floor(alvo / 60);
  const novoMin = alvo % 60;

  return `${pad(novaHora)}:${pad(novoMin)}`;
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

    const { data: hoje, hora: horaAtual } = agoraBrasil();

    const agendaSnapshot = await db
      .collection("agenda")
      .where("data", "==", hoje)
      .get();

    if (agendaSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma aula para hoje.",
        enviadas: 0,
      });
    }

    let enviadas = 0;
    const detalhes: string[] = [];

    for (const docItem of agendaSnapshot.docs) {
      const aula = docItem.data();

      const alunoNome = aula.alunoNome ?? aula.nomeAluno ?? aula.aluno ?? "";
      const horaAula = aula.hora ?? "";
      const userId = aula.userId ?? "";
      const status = aula.status ?? "pendente";

      if (!alunoNome || !horaAula || !userId) continue;

      if (status === "cancelado") continue;

      const horarioDoAviso = horaMenos20Minutos(horaAula);

      if (!horarioDoAviso) continue;
      if (horaAtual !== horarioDoAviso) continue;

      const chaveNotificacao = `lembrete_20min_${hoje}_${horaAula}`;

      const notificacaoRef = db
        .collection("agenda")
        .doc(docItem.id)
        .collection("controle_notificacoes")
        .doc(chaveNotificacao);

      const notificacaoJaEnviada = await notificacaoRef.get();

      if (notificacaoJaEnviada.exists) {
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

      await admin.messaging().send({
        token,
        notification: {
          title: "Lembrete de aula",
          body: `Às ${horaAula} você tem aula com ${alunoNome}`,
        },
        data: {
          tipo: "lembrete_aula",
          alunoNome: String(alunoNome),
          horaAula: String(horaAula),
          dataAula: String(hoje),
        },
      });

      await notificacaoRef.set({
        enviadoEm: new Date().toISOString(),
        tipo: "lembrete_20_min",
        horaAula,
        alunoNome,
        userId,
      });

      enviadas += 1;
      detalhes.push(`Enviado: ${alunoNome} às ${horaAula}`);
    }

    return NextResponse.json({
      success: true,
      message: "Verificação concluída.",
      data: hoje,
      horaAtual,
      enviadas,
      detalhes,
    });
  } catch (error: any) {
    console.error("Erro ao notificar aulas:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ?? "Erro interno.",
      },
      { status: 500 }
    );
  }
}