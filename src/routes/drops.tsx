import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  Calculator,
  Upload,
  Eye,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/drops")({
  head: () => ({
    meta: [
      { title: "Drops | Quitanda3dSHOP" },
    ],
  }),
  component: DropsPage,
});

function DropsPage() {
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: drops, isLoading: isLoadingDrops } = useQuery({
    queryKey: ["drops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drops")
        .select(`
          *,
          pieces(id, status)
        `)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: pieces, isLoading: isLoadingPieces } = useQuery({
    queryKey: ["pieces", selectedDropId],
    enabled: !!selectedDropId,
    queryFn: async () => {
      if (!selectedDropId) return [];
      const { data, error } = await supabase
        .from("pieces")
        .select("*")
        .eq("drop_id", selectedDropId)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });


  return (
    <AppShell>
      <div className="flex flex-col h-full space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Drops</h1>
          </div>
          <CreateDropDialog 
            isOpen={isCreateDialogOpen} 
            onOpenChange={setIsCreateDialogOpen} 
          />
        </header>

        {/* Mobile Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="drops" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="drops">Drops</TabsTrigger>
              <TabsTrigger value="pieces" disabled={!selectedDropId}>
                Peças {selectedDropId ? "" : "(Selecione um drop)"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="drops" className="mt-4">
              <DropsList 
                drops={drops} 
                isLoading={isLoadingDrops} 
                selectedId={selectedDropId} 
                onSelect={setSelectedDropId} 
              />
            </TabsContent>
            <TabsContent value="pieces" className="mt-4">
              <PiecesList 
                pieces={pieces} 
                isLoading={isLoadingPieces} 
                dropId={selectedDropId} 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop 2-column layout */}
        <div className="hidden lg:grid grid-cols-2 gap-8 items-start">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold px-1">Lista de Drops</h2>
            <DropsList 
              drops={drops} 
              isLoading={isLoadingDrops} 
              selectedId={selectedDropId} 
              onSelect={setSelectedDropId} 
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold px-1">Peças do Drop</h2>
            <PiecesList 
              pieces={pieces} 
              isLoading={isLoadingPieces} 
              dropId={selectedDropId} 
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function DropsList({ drops, isLoading, selectedId, onSelect }: any) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!drops || drops.length === 0) {
    return (
      <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center space-y-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        <div className="space-y-1">
          <p className="font-medium">Nenhum drop encontrado</p>
          <p className="text-sm text-muted-foreground px-4">Comece criando o seu primeiro lançamento clicando no botão acima.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {drops.map((drop: any) => {
        const isSelected = selectedId === drop.id;
        const totalPieces = drop.pieces?.length || 0;
        const publishedCount = drop.pieces?.filter((p: any) => p.status === 'publicado').length || 0;
        
        let statusLabel = "Novo";
        let statusColor = "bg-blue-500/10 text-blue-600 border-blue-200";
        
        if (publishedCount === totalPieces && totalPieces > 0) {
          statusLabel = "Completo";
          statusColor = "bg-green-500/10 text-green-600 border-green-200";
        } else if (publishedCount > 0) {
          statusLabel = "Parcial";
          statusColor = "bg-orange-500/10 text-orange-600 border-orange-200";
        }

        return (
          <Card 
            key={drop.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              isSelected ? "border-primary ring-1 ring-primary/20" : "border-transparent"
            )}
            onClick={() => onSelect(drop.id)}
          >
            <CardContent className="p-0 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 h-32 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                {drop.drop_image_url ? (
                  <img 
                    src={drop.drop_image_url} 
                    alt={drop.drop_name} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold text-lg truncate">{drop.drop_name}</h3>
                    <Badge variant="outline" className={cn("shrink-0", statusColor)}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(drop.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium">{totalPieces} {totalPieces === 1 ? 'peça' : 'peças'}</span>
                  <ChevronRight className={cn("h-5 w-5 transition-transform", isSelected ? "text-primary translate-x-1" : "text-muted-foreground")} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PiecesList({ pieces, isLoading, dropId }: any) {
  if (!dropId) {
    return (
      <Card className="border-dashed py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-accent">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Selecione um drop</p>
          <p className="text-sm text-muted-foreground px-12">Escolha um drop na lista ao lado para gerenciar as peças disponíveis.</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pieces?.map((piece: any) => (
        <PieceCard key={piece.id} piece={piece} />
      ))}
    </div>
  );
}

function PieceCard({ piece }: any) {
  const [isSelling, setIsSelling] = useState(piece.active || false);
  const [availableAs, setAvailableAs] = useState(piece.available_as || 'ambos');
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const { error } = await supabase
        .from('pieces')
        .update({ active })
        .eq('id', piece.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pieces", piece.drop_id] });
    }
  });

  const handleToggle = (checked: boolean) => {
    setIsSelling(checked);
    toggleMutation.mutate(checked);
  };

  const statusColors: any = {
    'pendente': 'bg-gray-100 text-gray-600',
    'publicado': 'bg-green-100 text-green-700',
    'pausado': 'bg-yellow-100 text-yellow-700'
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 relative overflow-hidden rounded-lg">
            {piece.image_url ? (
              <img src={piece.image_url} alt={piece.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold truncate">{piece.name}</h4>
              <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold", statusColors[piece.status] || 'bg-muted')}>
                {piece.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id={`sell-${piece.id}`} 
                  checked={isSelling}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor={`sell-${piece.id}`} className="text-sm font-medium cursor-pointer">
                  Vender esta peça
                </Label>
              </div>
              {piece.piece_url && (
                <a href={piece.piece_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Panel */}
        <div className={cn(
          "grid transition-all duration-300 ease-in-out overflow-hidden",
          isSelling ? "grid-rows-[1fr] mt-6 opacity-100 pt-6 border-t" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="min-h-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-bold">Configuração de Venda</Label>
              <Select value={availableAs} onValueChange={setAvailableAs}>
                <SelectTrigger>
                  <SelectValue placeholder="Disponível como..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="figura">Apenas Figura</SelectItem>
                  <SelectItem value="chaveiro">Apenas Chaveiro</SelectItem>
                  <SelectItem value="ambos">Figura e Chaveiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(availableAs === 'figura' || availableAs === 'ambos') && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Preço Figura (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">R$</span>
                    <Input 
                      className="pl-8 h-8 text-xs" 
                      placeholder="0,00" 
                      type="number"
                      defaultValue={piece.price_figura}
                    />
                  </div>
                </div>
              )}
              {(availableAs === 'chaveiro' || availableAs === 'ambos') && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Preço Chaveiro (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">R$</span>
                    <Input 
                      className="pl-8 h-8 text-xs" 
                      placeholder="0,00" 
                      type="number"
                      defaultValue={piece.price_chaveiro}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-8">
                <Calculator className="mr-2 h-3 w-3" />
                Calcular preço
              </Button>
              <Button size="sm" className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90" disabled>
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDropDialog({ isOpen, onOpenChange }: any) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [dropData, setDropData] = useState({
    name: "",
    description: "",
    image_url: "",
    link: ""
  });
  const [pieces, setPieces] = useState<any[]>([
    { name: "", image_url: "", piece_url: "", available_as: "ambos" }
  ]);

  const addPiece = () => {
    setPieces([...pieces, { name: "", image_url: "", piece_url: "", available_as: "ambos" }]);
  };

  const removePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const updatePiece = (index: number, field: string, value: string) => {
    const newPieces = [...pieces];
    newPieces[index][field] = value;
    setPieces(newPieces);
  };

  const handleSave = async () => {
    if (!dropData.name) {
      toast.error("O nome do drop é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Inserir Drop
      const { data: drop, error: dropError } = await supabase
        .from('drops')
        .insert({
          drop_name: dropData.name,
          description: dropData.description,
          drop_image_url: dropData.image_url,
          drop_link: dropData.link
        })
        .select()
        .single();

      if (dropError) throw dropError;

      // 2. Inserir Peças
      const validPieces = pieces
        .filter(p => p.name.trim() !== "")
        .map(p => ({
          ...p,
          drop_id: drop.id
        }));

      if (validPieces.length > 0) {
        const { error: piecesError } = await supabase
          .from('pieces')
          .insert(validPieces);
        if (piecesError) throw piecesError;
      }

      toast.success("Drop criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      onOpenChange(false);
      // Reset form
      setDropData({ name: "", description: "", image_url: "", link: "" });
      setPieces([{ name: "", image_url: "", piece_url: "", available_as: "ambos" }]);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar drop: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Drop
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Dados do Drop */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="drop-name">Nome do drop *</Label>
              <Input 
                id="drop-name" 
                placeholder="Ex: Coleção Cyberpunk 2026" 
                value={dropData.name}
                onChange={e => setDropData({...dropData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drop-desc">Descrição</Label>
              <Textarea 
                id="drop-desc" 
                placeholder="Uma breve descrição sobre este lançamento..." 
                value={dropData.description}
                onChange={e => setDropData({...dropData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drop-img">URL da imagem</Label>
                <Input 
                  id="drop-img" 
                  placeholder="https://..." 
                  value={dropData.image_url}
                  onChange={e => setDropData({...dropData, image_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drop-link">Link STLFLIX</Label>
                <Input 
                  id="drop-link" 
                  placeholder="https://..." 
                  value={dropData.link}
                  onChange={e => setDropData({...dropData, link: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-t pt-4">
              <h3 className="font-semibold text-lg">Peças deste drop</h3>
              <Button type="button" variant="outline" size="sm" onClick={addPiece}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar peça
              </Button>
            </div>

            <div className="space-y-4">
              {pieces.map((piece, index) => (
                <Card key={index} className="p-4 bg-accent/30 border-dashed relative">
                  {pieces.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removePiece(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Nome da peça</Label>
                      <Input 
                        placeholder="Nome da miniatura/objeto" 
                        value={piece.name}
                        onChange={e => updatePiece(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">URL Imagem</Label>
                        <Input 
                          placeholder="https://..." 
                          value={piece.image_url}
                          onChange={e => updatePiece(index, 'image_url', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Link STLFLIX</Label>
                        <Input 
                          placeholder="https://..." 
                          value={piece.piece_url}
                          onChange={e => updatePiece(index, 'piece_url', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Disponível como</Label>
                      <Select 
                        value={piece.available_as} 
                        onValueChange={val => updatePiece(index, 'available_as', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="figura">Figura</SelectItem>
                          <SelectItem value="chaveiro">Chaveiro</SelectItem>
                          <SelectItem value="ambos">Figura e Chaveiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Drop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
