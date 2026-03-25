import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import app from "../firebase";
import db from "../firebaseDb";
import auth from "../firebaseAuth";

export async function registrarPush() {
  try {
    if (typeof window === "undefined") return;

    const user = auth.currentUser;

    if (!user) {
      console.log("Usuário não autenticado.");
      return;
    }

    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Permissão negada.");
      return;
    }

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey:
        "BBpzO7VrkvEz9mCd0UORaOAYd1LZIPaqWEUT5pt-hxcM15SoIbx0n-wIGSSuGAFdY67AsQ8ks7Y5B_uMLgxNgTY",
    });

    if (!token) {
      console.log("Nenhum token gerado.");
      return;
    }

    console.log("🔥 TOKEN:", token);

    // ✅ SALVA POR USER (MULTI PERSONAL)
    await setDoc(
      doc(db, "tokens", user.uid),
      {
        token,
        userId: user.uid,
        criadoEm: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("✅ Token salvo corretamente.");
  } catch (error) {
    console.error("❌ Erro ao registrar push:", error);
  }
}