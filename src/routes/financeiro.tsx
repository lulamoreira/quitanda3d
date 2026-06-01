import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DollarSign } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  component: Financeiro,
});

function Financeiro() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Financeiro</h1>
        </div>
        <div className="border-dashed border-2 rounded-xl h-64 flex items-center justify-center text-muted-foreground">
          Gestão de faturamento e lucro (Em breve)
        </div>
      </div>
    </AppShell>
  );
}
