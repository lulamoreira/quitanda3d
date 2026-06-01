import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getStaggerDelay } from "@/lib/formatters";

export default function Configuracoes() {

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    filament_price_per_kg: 80,
    energy_cost_per_hour: 0.8,
    packaging_cost: 2,
    ml_commission_rate: 14,
    shopee_commission_rate: 18,
    desired_margin: 40,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cost_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        filament_price_per_kg: Number(settings.filament_price_per_kg),
        energy_cost_per_hour: Number(settings.energy_cost_per_hour),
        packaging_cost: Number(settings.packaging_cost),
        ml_commission_rate: Number(settings.ml_commission_rate),
        shopee_commission_rate: Number(settings.shopee_commission_rate),
        desired_margin: Number(settings.desired_margin),
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (newData: typeof formData) => {
      const { error } = await supabase
        .from("cost_settings")
        .upsert({ 
          id: settings?.id, 
          ...newData, 
          updated_at: new Date().toISOString() 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar configurações.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="animate-fade-slide-up" style={getStaggerDelay(0)}>
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros de Custo e Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filament_price_per_kg">Preço do filamento por kg (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="filament_price_per_kg"
                        name="filament_price_per_kg"
                        type="number"
                        step="0.01"
                        className="pl-10"
                        value={formData.filament_price_per_kg}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="energy_cost_per_hour">Custo de energia por hora (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="energy_cost_per_hour"
                        name="energy_cost_per_hour"
                        type="number"
                        step="0.01"
                        className="pl-10"
                        value={formData.energy_cost_per_hour}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packaging_cost">Custo médio de embalagem (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="packaging_cost"
                        name="packaging_cost"
                        type="number"
                        step="0.01"
                        className="pl-10"
                        value={formData.packaging_cost}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desired_margin">Margem de lucro desejada (%)</Label>
                    <div className="relative">
                      <Input
                        id="desired_margin"
                        name="desired_margin"
                        type="number"
                        step="1"
                        className="pr-10"
                        value={formData.desired_margin}
                        onChange={handleChange}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ml_commission_rate">Comissão Mercado Livre (%)</Label>
                    <div className="relative">
                      <Input
                        id="ml_commission_rate"
                        name="ml_commission_rate"
                        type="number"
                        step="0.1"
                        className="pr-10"
                        value={formData.ml_commission_rate}
                        onChange={handleChange}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopee_commission_rate">Comissão Shopee (%)</Label>
                    <div className="relative">
                      <Input
                        id="shopee_commission_rate"
                        name="shopee_commission_rate"
                        type="number"
                        step="0.1"
                        className="pr-10"
                        value={formData.shopee_commission_rate}
                        onChange={handleChange}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar configurações
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
