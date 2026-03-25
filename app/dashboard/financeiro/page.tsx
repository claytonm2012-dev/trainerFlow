import { Suspense } from "react";
import FinanceiroClient from "./FinanceiroClient";

export default function FinanceiroPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "#fff" }}>Carregando financeiro...</div>}>
      <FinanceiroClient />
    </Suspense>
  );
}