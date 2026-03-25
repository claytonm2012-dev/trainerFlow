import { getAuth } from "firebase/auth";
import app from "./firebase";

// Inicializa o Auth
const auth = getAuth(app);

// Exporta como DEFAULT (igual você já estava usando)
export default auth;