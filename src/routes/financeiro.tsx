import { AppShell } from "@/components/AppShell";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Package, 
  Plus, 
  Loader2, 
  ShoppingCart,
  Calendar as CalendarIcon
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getStaggerDelay } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Financeiro() {

  const [dateFilter, setDateFilter] = useState("month");
  const queryClient = useQueryClient();

  const { data: sales, isLoading, isError, error } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          pieces(name)
        `)
        .order("sale_date", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  if (isError) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
          <DollarSign className="h-10 w-10 text-destructive opacity-50" />
          <h2 className="text-xl font-bold text-destructive">Erro no Financeiro</h2>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || "Erro ao buscar vendas."}</p>
        </div>
      </AppShell>
    );
  }


  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();
    let start: Date;

    if (dateFilter === "week") {
      start = startOfWeek(now, { weekStartsOn: 0 });
    } else if (dateFilter === "month") {
      start = startOfMonth(now);
    } else {
      return sales;
    }

    return sales.filter(sale => {
      const saleDate = sale.sale_date ? new Date(sale.sale_date) : new Date();
      return isWithinInterval(saleDate, { start, end: now });
    });
  }, [sales, dateFilter]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const revenue = Number(sale.gross_revenue) || 0;
      const commission = (revenue * (Number(sale.commission_rate) || 0)) / 100;
      const cost = Number(sale.production_cost) || 0;
      const profit = Number(sale.net_profit) || 0;

      return {
        revenue: acc.revenue + revenue,
        commissions: acc.commissions + commission,
        costs: acc.costs + cost,
        profit: acc.profit + profit
      };
    }, { revenue: 0, commissions: 0, costs: 0, profit: 0 });
  }, [filteredSales]);

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-display">Financeiro</h1>
          </div>
          <RegisterSaleDialog />
        </header>

        {/* Resumo Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            title="Receita Bruta" 
            value={totals.revenue} 
            icon={TrendingUp} 
            color="text-blue-500" 
            index={0} 
          />
          <SummaryCard 
            title="Comissões Pagas" 
            value={totals.commissions} 
            icon={Percent} 
            color="text-slate-500" 
            index={1} 
          />
          <SummaryCard 
            title="Custo Produção" 
            value={totals.costs} 
            icon={Package} 
            color="text-orange-500" 
            index={2} 
          />
          <SummaryCard 
            title="Lucro Líquido" 
            value={totals.profit} 
            icon={DollarSign} 
            color="text-success" 
            highlight 
            index={3} 
          />
        </div>


        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold font-display">Vendas Realizadas</h2>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <CalendarIcon className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="all">Todo o histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filteredSales.length > 0 ? (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.pieces?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-bold",
                          sale.platform === 'Mercado Livre' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
                        )}>
                          {sale.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency(sale.unit_price)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(sale.gross_revenue)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatCurrency((Number(sale.gross_revenue) * Number(sale.commission_rate)) / 100)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatCurrency(sale.production_cost)}</TableCell>
                      <TableCell className="text-success font-bold">{formatCurrency(sale.net_profit)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(sale.sale_date), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card className="border-dashed py-24 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-accent/50">
                <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-30" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">Nenhuma venda registrada ainda</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Registre suas vendas para acompanhar o desempenho financeiro da sua loja.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ title, value, icon: Icon, color, highlight, index }: any) {
  return (
    <Card className={cn(
      "border shadow-sm animate-fade-slide-up hover:shadow-md transition-shadow",
      highlight && "bg-success/10 border-success/20"
    )} style={getStaggerDelay(index)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider opacity-60">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-xl sm:text-2xl font-display font-bold",
          highlight ? "text-success" : "text-foreground"
        )}>
          {formatCurrency(value)}
        </div>
      </CardContent>
    </Card>
  );
}

function RegisterSaleDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    piece_id: "",
    platform: "Mercado Livre",
    quantity: 1,
    unit_price: 0
  });

  const { data: pieces } = useQuery({
    queryKey: ["published_pieces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pieces")
        .select("*")
        .eq("status", "publicado")
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  const { data: settings } = useQuery({
    queryKey: ["cost_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_settings").select("*").single();
      if (error) throw error;
      return data;
    }
  });

  const selectedPiece = useMemo(() => {
    return pieces?.find(p => p.id === formData.piece_id);
  }, [pieces, formData.piece_id]);

  const calculation = useMemo(() => {
    if (!selectedPiece || !settings) return null;

    const revenue = formData.quantity * formData.unit_price;
    const commissionRate = formData.platform === 'Mercado Livre' 
      ? Number(settings.ml_commission_rate) 
      : Number(settings.shopee_commission_rate);
    const commission = (revenue * commissionRate) / 100;
    
    const singleProdCost = (
      (Number(selectedPiece.filament_grams) / 1000 * Number(settings.filament_price_per_kg)) + 
      (Number(selectedPiece.print_hours) * Number(settings.energy_cost_per_hour)) + 
      Number(settings.packaging_cost)
    );
    const totalCost = singleProdCost * formData.quantity;
    const profit = revenue - commission - totalCost;

    return { revenue, commission, totalCost, profit, commissionRate };
  }, [selectedPiece, settings, formData]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!calculation) return;
      
      const { error } = await supabase.from('sales').insert({
        piece_id: formData.piece_id,
        platform: formData.platform,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        commission_rate: calculation.commissionRate,
        production_cost: calculation.totalCost,
        gross_revenue: calculation.revenue,
        net_profit: calculation.profit,
        sale_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast.success("Venda registrada com sucesso!");
      setIsOpen(false);
      setFormData({ piece_id: "", platform: "Mercado Livre", quantity: 1, unit_price: 0 });
    },
    onError: (err: any) => {
      toast.error(`Erro ao registrar venda: ${err.message}`);
    }
  });

  const filteredPieces = useMemo(() => {
    if (!search) return pieces || [];
    return pieces?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];
  }, [pieces, search]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Nova Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Peça Vendida</Label>
            <Select value={formData.piece_id} onValueChange={id => setFormData({...formData, piece_id: id})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma peça..." />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input 
                    placeholder="Buscar peça..." 
                    className="h-8 text-xs" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.stopPropagation()} 
                  />
                </div>
                {filteredPieces.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={formData.platform} onValueChange={val => setFormData({...formData, platform: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input 
                type="number" 
                min={1} 
                value={formData.quantity} 
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preço Unitário Cobrado (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">R$</span>
              <Input 
                className="pl-10 font-display font-semibold text-lg" 
                type="number" 
                step="0.01" 
                value={formData.unit_price} 
                onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})} 
              />
            </div>
          </div>

          {calculation && (
            <div className="bg-muted/50 p-4 rounded-xl border space-y-2 animate-fade-slide-up">
              <div className="flex justify-between text-sm">
                <span>Receita Bruta</span>
                <span className="font-semibold">{formatCurrency(calculation.revenue)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-60">
                <span>Comissão ({calculation.commissionRate}%)</span>
                <span>- {formatCurrency(calculation.commission)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-60">
                <span>Custo de Produção</span>
                <span>- {formatCurrency(calculation.totalCost)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="font-bold">Lucro Líquido</span>
                <span className="text-xl font-display font-bold text-success">{formatCurrency(calculation.profit)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white" 
            disabled={!formData.piece_id || formData.unit_price <= 0 || registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
          >
            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { cn } from "@/lib/utils";
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
