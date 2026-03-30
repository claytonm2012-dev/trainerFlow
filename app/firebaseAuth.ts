import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import app from "./firebase";
import db from "./firebaseDb";

// Inicializa o Auth
const auth = getAuth(app);

// Provedor Google
export const googleProvider = new GoogleAuthProvider();

// Configuracao do Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Tipo do provedor social (apenas Google)
export type SocialProvider = 'google';

// Funcao para login social com verificacao/criacao no Firestore
export async function signInWithSocial(providerName: SocialProvider): Promise<UserCredential> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Verifica se o usuário já existe na coleção students
  const studentRef = doc(db, "students", user.uid);
  const studentSnap = await getDoc(studentRef);
  
  if (!studentSnap.exists()) {
    // Usuário novo - criar registro na coleção students
    await setDoc(studentRef, {
      nome: user.displayName || "Usuário",
      email: user.email || "",
      fotoUrl: user.photoURL || "",
      role: "aluno",
      userId: user.uid,
      criadoEm: serverTimestamp(),
      provider: providerName,
    });
  }
  
  return result;
}

// Exporta como DEFAULT (igual você já estava usando)
export default auth;
