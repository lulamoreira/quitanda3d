import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/historico")({
  component: Historico,
});

function Historico() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Histórico</h1>
        </div>
        <div className="border-dashed border-2 rounded-xl h-64 flex items-center justify-center text-muted-foreground">
          Histórico de anúncios e publicações (Em breve)
        </div>
      </div>
    </AppShell>
  );
}
