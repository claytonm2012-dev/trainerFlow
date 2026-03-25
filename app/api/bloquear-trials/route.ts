import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import serviceAccount from "@/firebase-admin.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");

    if (secret !== "trainerflow_secret_2026") {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const snapshot = await db.collection("students").get();

    let bloqueados = 0;
    const detalhes: string[] = [];

    for (const docItem of snapshot.docs) {
      const aluno = docItem.data();

      if (aluno.statusAcesso !== "trial") continue;
      if (aluno.pagamentoStatus === "pago") continue;
      if (!aluno.trialFim) continue;

      const agora = new Date();
      const trialFim = new Date(aluno.trialFim);

      if (agora > trialFim) {
        await db.collection("students").doc(docItem.id).update({
          statusAcesso: "bloqueado",
        });

        bloqueados += 1;
        detalhes.push(`Bloqueado: ${aluno.nome || docItem.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      bloqueados,
      detalhes,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno",
      },
      { status: 500 }
    );
  }
}