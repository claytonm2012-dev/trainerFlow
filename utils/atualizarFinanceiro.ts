import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import db from "../app/firebaseDb";
import { gerarMesAtual, calcularMensalidade } from "./financeiro";

export async function atualizarFinanceiroAutomatico(userId: string) {
  if (!userId) {
    throw new Error("userId não informado.");
  }

  const aulasSnap = await getDocs(
    query(collection(db, "agenda"), where("userId", "==", userId))
  );

  const financeiroSnap = await getDocs(
    query(collection(db, "financeiro"), where("userId", "==", userId))
  );

  const mesAtual = gerarMesAtual();

  const alunosMap: Record<string, number> = {};

  aulasSnap.forEach((docItem) => {
    const aula = docItem.data();

    if (!aula.alunoNome || !aula.data) return;

    const dataAula = new Date(aula.data);
    const mesAula = `${dataAula.getMonth() + 1}/${dataAula.getFullYear()}`;

    if (mesAula !== mesAtual) return;

    if (!alunosMap[aula.alunoNome]) {
      alunosMap[aula.alunoNome] = 0;
    }

    alunosMap[aula.alunoNome]++;
  });

  const jaExiste = new Set<string>();

  financeiroSnap.forEach((docItem) => {
    const f = docItem.data();

    if (f.mes === mesAtual && f.alunoNome) {
      jaExiste.add(f.alunoNome);
    }
  });

  for (const alunoNome in alunosMap) {
    if (jaExiste.has(alunoNome)) continue;

    const totalAulas = alunosMap[alunoNome];
    const valor = calcularMensalidade(totalAulas);

    await addDoc(collection(db, "financeiro"), {
      alunoNome,
      valor,
      mes: mesAtual,
      status: "pendente",
      criadoEm: serverTimestamp(),
      userId,
    });
  }
}