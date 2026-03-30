import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import app from "./firebase";
import db from "./firebaseDb";

// Inicializa o Auth
const auth = getAuth(app);

// Provedores de autenticação social
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Configurações adicionais dos provedores
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

facebookProvider.setCustomParameters({
  display: 'popup'
});

appleProvider.setCustomParameters({
  locale: 'pt_BR'
});
appleProvider.addScope('email');
appleProvider.addScope('name');

// Tipo do provedor social
export type SocialProvider = 'google' | 'facebook' | 'apple';

// Função para login social com verificação/criação no Firestore
export async function signInWithSocial(providerName: SocialProvider): Promise<UserCredential> {
  let provider;
  
  switch (providerName) {
    case 'google':
      provider = googleProvider;
      break;
    case 'facebook':
      provider = facebookProvider;
      break;
    case 'apple':
      provider = appleProvider;
      break;
    default:
      throw new Error('Provedor não suportado');
  }
  
  const result = await signInWithPopup(auth, provider);
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
