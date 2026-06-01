import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Percent,
  ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, getStaggerDelay } from "@/lib/formatters";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      const [pendingCount, dropsCount, salesData, lastListings, lastDrops] = await Promise.all([
        supabase.from('pieces').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('drops').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('gross_revenue, net_profit, sale_date'),
        supabase.from('listings').select('*, pieces(name, image_url)').order('published_at', { ascending: false }).limit(5),
        supabase.from('drops').select('*, pieces(id, status)').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalRevenue = salesData.data?.reduce((acc, curr) => acc + Number(curr.gross_revenue), 0) || 0;
      const totalProfit = salesData.data?.reduce((acc, curr) => acc + Number(curr.net_profit), 0) || 0;

      // Gerar dados para o gráfico (últimos 7 dias)
      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = d.toISOString().split('T')[0];
        const daySales = salesData.data?.filter(s => s.sale_date === dateStr) || [];
        
        return {
          name: format(d, "dd/MMM", { locale: ptBR }),
          receita: daySales.reduce((acc, curr) => acc + Number(curr.gross_revenue), 0),
          lucro: daySales.reduce((acc, curr) => acc + Number(curr.net_profit), 0)
        };
      });

      return {
        pending: pendingCount.count || 0,
        dropsTotal: dropsCount.count || 0,
        revenue: totalRevenue,
        profit: totalProfit,
        chartData,
        lastListings: lastListings.data || [],
        lastDrops: lastDrops.data || []
      };
    },
    staleTime: 30000,
  });

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        </div>

        {/* Resumo Cards (Reusando lógica do Financeiro) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            title="Receita Total" 
            value={stats?.revenue || 0} 
            icon={TrendingUp} 
            color="text-blue-500" 
            isLoading={isLoading}
            index={0} 
          />
          <SummaryCard 
            title="Lucro Líquido" 
            value={stats?.profit || 0} 
            icon={DollarSign} 
            color="text-success" 
            isLoading={isLoading}
            highlight
            index={1} 
          />
          <SummaryCard 
            title="Peças Pendentes" 
            value={stats?.pending || 0} 
            icon={Package} 
            color="text-orange-500" 
            isLoading={isLoading}
            isCount
            index={2} 
          />
          <SummaryCard 
            title="Total de Drops" 
            value={stats?.dropsTotal || 0} 
            icon={Percent} 
            color="text-slate-500" 
            isLoading={isLoading}
            isCount
            index={3} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico */}
          <Card className="lg:col-span-2 border shadow-sm animate-fade-slide-up" style={getStaggerDelay(4)}>
            <CardHeader>
              <CardTitle className="text-lg font-display">Desempenho (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Bar dataKey="receita" name="Receita Bruta" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" name="Lucro Líquido" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Listas Laterais */}
          <div className="space-y-8">
            {/* Últimas Publicações */}
            <section className="space-y-4 animate-fade-slide-up" style={getStaggerDelay(5)}>
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold font-display">Últimas Publicações</h2>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : stats?.lastListings.length ? (
                  stats.lastListings.map((listing: any) => (
                    <Card key={listing.id} className="p-3 border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {listing.pieces?.image_url ? (
                            <img src={listing.pieces.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2 opacity-20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{listing.pieces?.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] px-1 h-4">ML</Badge>
                            <span className="text-[11px] font-bold text-primary">{formatCurrency(listing.price)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(listing.published_at), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4 italic">Sem publicações recentes</p>
                )}
                <Link to="/historico" className="flex items-center justify-center gap-1 text-xs text-primary font-bold hover:underline py-1">
                  Ver todo o histórico <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </section>

            {/* Últimos Drops */}
            <section className="space-y-4 animate-fade-slide-up" style={getStaggerDelay(6)}>
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold font-display">Últimos Drops</h2>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : stats?.lastDrops.length ? (
                  stats.lastDrops.map((drop: any) => {
                    const totalPieces = drop.pieces?.length || 0;
                    const publishedCount = drop.pieces?.filter((p: any) => p.status === 'publicado').length || 0;
                    
                    let statusLabel = "Novo";
                    let statusColor = "bg-blue-50 text-blue-600 border-blue-100";
                    if (publishedCount === totalPieces && totalPieces > 0) {
                      statusLabel = "Completo";
                      statusColor = "bg-green-50 text-green-600 border-green-100";
                    } else if (publishedCount > 0) {
                      statusLabel = "Parcial";
                      statusColor = "bg-orange-50 text-orange-600 border-orange-100";
                    }

                    return (
                      <Card key={drop.id} className="p-3 border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                            {drop.drop_image_url ? (
                              <img src={drop.drop_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-full h-full p-2 opacity-20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{drop.drop_name}</p>
                            <Badge variant="outline" className={cn("text-[9px] uppercase font-bold h-4 px-1 mt-0.5", statusColor)}>
                              {statusLabel}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(drop.created_at), "dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4 italic">Sem drops recentes</p>
                )}
                <Link to="/drops" className="flex items-center justify-center gap-1 text-xs text-primary font-bold hover:underline py-1">
                  Ver todos os drops <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ title, value, icon: Icon, color, highlight, isLoading, isCount, index }: any) {
  return (
    <Card className={cn(
      "border shadow-sm animate-fade-slide-up hover:shadow-md transition-shadow",
      highlight && "bg-success/10 border-success/20"
    )} style={getStaggerDelay(index)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-sans">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={cn(
            "text-xl sm:text-2xl font-display font-bold",
            highlight ? "text-success" : "text-foreground"
          )}>
            {isCount ? value : formatCurrency(value)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



