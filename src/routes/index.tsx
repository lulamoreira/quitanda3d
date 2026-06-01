import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Quitanda3dSHOP" },
      { name: "description", content: "Resumo de vendas e drops da Quitanda 3D" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [pendingCount, dropsCount, salesData] = await Promise.all([
        supabase.from('pieces').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('drops').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('gross_revenue, net_profit')
      ]);

      const totalRevenue = salesData.data?.reduce((acc, curr) => acc + Number(curr.gross_revenue), 0) || 0;
      const totalProfit = salesData.data?.reduce((acc, curr) => acc + Number(curr.net_profit), 0) || 0;

      return {
        pending: pendingCount.count || 0,
        drops: dropsCount.count || 0,
        revenue: totalRevenue,
        profit: totalProfit
      };
    }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="h-24 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {stats?.revenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Volume histórico de vendas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">R$ {stats?.profit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Após comissões e custos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pending} peças</div>
                <p className="text-xs text-muted-foreground">Aguardando publicação</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Drops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.drops}</div>
                <p className="text-xs text-muted-foreground">Coleções cadastradas</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="h-64 flex flex-col items-center justify-center text-muted-foreground border-dashed bg-muted/20">
          <Loader2 className="h-8 w-8 mb-2 opacity-20" />
          <p>Gráficos e estatísticas (Parte 2)</p>
        </Card>
      </div>
    </AppShell>
  );
}


