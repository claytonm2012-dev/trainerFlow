import { NextResponse } from "next/server";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "userId não informado.",
      });
    }

    const docSnap = await db.collection("tokens").doc(userId).get();

    if (!docSnap.exists) {
      return NextResponse.json({
        success: false,
        error: "Token não encontrado para este usuário.",
      });
    }

    const dados = docSnap.data();
    const token = dados?.token;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Documento sem token.",
      });
    }

    const response = await admin.messaging().send({
      token,
      notification: {
        title: "🔥 TrainerFlow",
        body: "Sua notificação chegou com sucesso!",
      },
    });

    return NextResponse.json({
      success: true,
      response,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}