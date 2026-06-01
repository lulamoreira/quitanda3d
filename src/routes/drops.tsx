import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { 
  Package, 
  Plus, 
  ExternalLink, 
  ChevronRight, 
  Loader2,
  Trash2,
  Calculator,
  Check,
  AlertCircle,
  Zap,
  Download,
  Copy,
  Clock,
  History,
  FileText,
  MoreVertical,
  Pencil,
  HardDrive,
  ChevronDown,
} from "lucide-react";
import { formatCurrency, formatDate, getStaggerDelay } from "@/lib/formatters";


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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { generateCopyFn } from "@/lib/ai-service";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function DropsPage() {
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<any>(null);
  const [dropToDelete, setDropToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: drops, isLoading: isLoadingDrops, isError: isErrorDrops, error: errorDrops } = useQuery({
    queryKey: ["drops"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drops")
        .select(`
          *,
          pieces(id, status)
        `)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) {
        console.error("Supabase error fetching drops:", error);
        throw error;
      }
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drops',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['drops'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  const { data: pieces, isLoading: isLoadingPieces, isError: isErrorPieces, error: errorPieces } = useQuery({
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
      if (error) {
        console.error("Supabase error fetching pieces:", error);
        throw error;
      }
      return data;
    },
  });

  const handleDeleteDrop = async () => {
    if (!dropToDelete) return;
    
    try {
      const { error } = await supabase
        .from('drops')
        .delete()
        .eq('id', dropToDelete.id);

      if (error) throw error;

      toast.success("✓ Drop apagado com sucesso");
      if (selectedDropId === dropToDelete.id) {
        setSelectedDropId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao apagar drop: ${error.message}`);
    } finally {
      setDropToDelete(null);
    }
  };

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
            onOpenChange={(open: boolean) => {
              setIsCreateDialogOpen(open);
              if (!open) setEditingDrop(null);
            }} 
            editingDrop={editingDrop}
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
                isError={isErrorDrops}
                error={errorDrops}
                selectedId={selectedDropId} 
                onSelect={setSelectedDropId} 
                onEdit={(drop: any) => {
                  setEditingDrop(drop);
                  setIsCreateDialogOpen(true);
                }}
                onDelete={(drop: any) => setDropToDelete(drop)}
              />
            </TabsContent>
            <TabsContent value="pieces" className="mt-4">
              <PiecesList 
                pieces={pieces} 
                isLoading={isLoadingPieces} 
                isError={isErrorPieces}
                error={errorPieces}
                dropId={selectedDropId} 
              />

            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop 2-column layout */}
        <div className="hidden lg:grid grid-cols-2 gap-8 items-start">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-semibold">Lista de Drops</h2>
            </div>
            <DropsList 
              drops={drops} 
              isLoading={isLoadingDrops} 
              isError={isErrorDrops}
              error={errorDrops}
              selectedId={selectedDropId} 
              onSelect={setSelectedDropId} 
              onEdit={(drop: any) => {
                setEditingDrop(drop);
                setIsCreateDialogOpen(true);
              }}
              onDelete={(drop: any) => setDropToDelete(drop)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold px-1">Peças do Drop</h2>
            <PiecesList 
              pieces={pieces} 
              isLoading={isLoadingPieces} 
              isError={isErrorPieces}
              error={errorPieces}
              dropId={selectedDropId} 
            />

          </section>
        </div>
      </div>

      <AlertDialog open={!!dropToDelete} onOpenChange={(open) => !open && setDropToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja apagar este drop?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as peças e listagens vinculadas a este drop também serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDrop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar drop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function DropsList({ drops, isLoading, isError, error, selectedId, onSelect, onEdit, onDelete }: any) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-xl text-center flex flex-col items-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="text-sm text-destructive font-bold">Erro ao carregar drops</p>
          <p className="text-xs text-destructive/70 mt-1 max-w-xs">{error?.message || "Ocorreu um erro ao buscar os dados do Supabase."}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="h-8">
          Tentar novamente
        </Button>
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
      {drops.map((drop: any, index: number) => {
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
              "cursor-pointer transition-all hover:shadow-md border-2 animate-fade-slide-up",
              isSelected ? "border-primary ring-1 ring-primary/20" : "border-transparent"
            )}
            style={getStaggerDelay(index)}
            onClick={() => onSelect(drop.id)}
          >
            <CardContent className="p-0 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 h-32 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                {drop.drop_image_url ? (
                  <img 
                    src={drop.drop_image_url} 
                    alt={drop.drop_name} 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class=\"w-full h-full bg-muted flex items-center justify-center\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-package h-8 w-8 text-muted-foreground opacity-20\"><path d=\"m7.5 4.27 9 5.15\"/><path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/></svg></div>';
                    }}
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
                    <div className="flex items-center gap-2 truncate">
                      <h3 className="font-display font-semibold text-lg truncate">{drop.drop_name}</h3>
                      {drop.source === 'discord' && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 gap-1 px-1.5 h-5 text-[10px]">
                          <Zap className="h-3 w-3 fill-current" />
                          Discord
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("shrink-0", statusColor)}>
                        {statusLabel}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => onEdit(drop)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar drop
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(drop)} 
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Apagar drop
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(drop.created_at)}
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

function PiecesList({ pieces, isLoading, isError, error, dropId }: any) {
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

  if (isError) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-xl text-center flex flex-col items-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="text-sm text-destructive font-bold">Erro ao carregar peças</p>
          <p className="text-xs text-destructive/70 mt-1">{error?.message || "Erro ao buscar peças."}</p>
        </div>
      </div>
    );
  }

  if (!pieces || pieces.length === 0) {
    return (
      <Card className="border-dashed py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-accent/50">
          <Package className="h-10 w-10 text-muted-foreground opacity-30" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-lg">Nenhuma peça neste drop</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Este lançamento ainda não possui peças cadastradas.</p>
        </div>
      </Card>
    );
  }


  return (
    <div className="space-y-4">
      {pieces?.map((piece: any, index: number) => (
        <PieceCard key={piece.id} piece={piece} index={index} />
      ))}
    </div>

  );
}

function PieceCard({ piece, index }: any) {
  const [isSelling, setIsSelling] = useState(piece.active || false);
  const [availableAs, setAvailableAs] = useState(piece.available_as || 'ambos');
  const [priceFigura, setPriceFigura] = useState(piece.price_figura || "");
  const [priceChaveiro, setPriceChaveiro] = useState(piece.price_chaveiro || "");
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isPubOpen, setIsPubOpen] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const statusColors: any = {
    'pendente': 'bg-gray-100 text-gray-600',
    'publicado': 'bg-green-100 text-green-700',
    'pausado': 'bg-yellow-100 text-yellow-700'
  };

  return (
    <Card className="overflow-hidden animate-fade-slide-up hover:shadow-md transition-shadow" style={getStaggerDelay(index)}>
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
              <div className="space-y-1 min-w-0">
                <h4 className="font-semibold truncate">{piece.name}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {piece.stlflix_code && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 h-5 px-1.5 text-[10px] gap-1 cursor-pointer" onClick={() => copyToClipboard(piece.stlflix_code)}>
                      {piece.stlflix_code}
                      <Copy className="h-2.5 w-2.5" />
                    </Badge>
                  )}
                  {piece.stlflix_url && (
                    <a href={piece.stlflix_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary h-5 transition-colors" title="Abrir na STLFLIX">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {piece.drive_url && (
                    <a href={piece.drive_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary h-5 flex items-center gap-1 transition-colors" title="Abrir no Google Drive">
                      <HardDrive className="h-3 w-3" />
                      <span className="text-[10px]">Abrir arquivo</span>
                    </a>
                  )}
                  {piece.material && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground h-5 px-1.5 text-[10px]">
                      {piece.material}
                    </Badge>
                  )}
                  {piece.print_time_mono && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Mono: {piece.print_time_mono}
                    </span>
                  )}
                  {piece.print_time_estimated && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      ~{piece.print_time_estimated}
                    </span>
                  )}
                </div>
                {piece.print_notes && (
                  <div className="mt-1">
                    <button 
                      onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                      className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                    >
                      <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", isNotesExpanded && "rotate-180")} />
                      {isNotesExpanded ? "Ocultar obs." : "Ver obs."}
                    </button>
                    {isNotesExpanded && (
                      <p className="text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1.5 rounded border border-dashed">
                        {piece.print_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold shrink-0", statusColors[piece.status] || 'bg-muted')}>
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
              {piece.piece_url && !piece.stlflix_url && (
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
                      value={priceFigura}
                      onChange={(e) => setPriceFigura(e.target.value)}
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
                      value={priceChaveiro}
                      onChange={(e) => setPriceChaveiro(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <PriceCalculatorDialog 
                piece={piece} 
                onUsePrice={(p, type, grams, hours) => {
                  if (type === 'ml') {
                    if (availableAs === 'figura' || availableAs === 'ambos') setPriceFigura(p.toFixed(2));
                    if (availableAs === 'chaveiro' || availableAs === 'ambos') setPriceChaveiro(p.toFixed(2));
                  } else {
                    if (availableAs === 'figura' || availableAs === 'ambos') setPriceFigura(p.toFixed(2));
                    if (availableAs === 'chaveiro' || availableAs === 'ambos') setPriceChaveiro(p.toFixed(2));
                  }
                }}
              />
              <PublicationDialog 
                piece={{ ...piece, price_figura: priceFigura, price_chaveiro: priceChaveiro, available_as: availableAs }} 
                disabled={!priceFigura && !priceChaveiro}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function CreateDropDialog({ isOpen, onOpenChange, editingDrop = null }: any) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [stlflixUrl, setStlflixUrl] = useState("");
  
  const [dropData, setDropData] = useState({
    name: "",
    description: "",
    image_url: "",
    link: ""
  });
  const [pieces, setPieces] = useState<any[]>([
    { 
      name: "", 
      image_url: "", 
      piece_url: "", 
      available_as: "ambos",
      full_description: "",
      stlflix_code: "",
      stlflix_slug: "",
      print_time_mono: "",
      print_time_multi: "",
      height_cm: "",
      source: "",
      drive_url: "",
      material: "",
      print_notes: "",
      print_time_estimated: ""
    }
  ]);

  useEffect(() => {
    if (editingDrop) {
      setDropData({
        name: editingDrop.drop_name || "",
        description: editingDrop.description || "",
        image_url: editingDrop.drop_image_url || "",
        link: editingDrop.drop_link || ""
      });
      // For editing, we don't show the pieces section in the same way or we keep it empty for new additions
      // The requirement says "pré-preenchido com os dados do drop selecionado"
    } else {
      setDropData({ name: "", description: "", image_url: "", link: "" });
    }
  }, [editingDrop, isOpen]);

  const addPiece = () => {
    setPieces([...pieces, { 
      name: "", 
      image_url: "", 
      piece_url: "", 
      available_as: "ambos",
      full_description: "",
      stlflix_code: "",
      stlflix_slug: "",
      print_time_mono: "",
      print_time_multi: "",
      height_cm: "",
      source: "",
      drive_url: "",
      material: "",
      print_notes: "",
      print_time_estimated: ""
    }]);
  };

  const removePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const updatePiece = (index: number, field: string, value: string) => {
    const newPieces = [...pieces];
    newPieces[index][field] = value;
    setPieces(newPieces);
  };

  const handleScrape = async () => {
    if (!stlflixUrl) {
      toast.error("Cole o link da peça na STLFLIX");
      return;
    }

    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-stlflix', {
        body: { url: stlflixUrl }
      });

      if (error) throw error;

      if (data.success) {
        setDropData(prev => ({
          ...prev,
          name: data.title,
          image_url: data.image_url,
          link: data.stlflix_url
        }));

        setPieces([{
          name: data.title,
          image_url: data.image_url,
          piece_url: data.stlflix_url,
          available_as: "ambos",
          full_description: data.description,
          stlflix_code: data.stl_code,
          stlflix_slug: data.slug,
          print_time_mono: data.print_time_mono,
          print_time_multi: data.print_time_multi,
          height_cm: data.height_cm,
          source: 'stlflix_import'
        }]);
        
        toast.success("✓ Dados importados com sucesso");
      } else if (data.requires_login) {
        toast.warning("A STLFLIX requer login para acessar esta página. Preencha os dados abaixo manualmente.");
        setDropData(prev => ({ ...prev, link: data.stlflix_url }));
        setPieces([{
          ...pieces[0],
          piece_url: data.stlflix_url,
          stlflix_slug: data.slug,
          source: 'stlflix_import'
        }]);
      } else {
        toast.error(data.error || "Erro ao importar dados");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async () => {
    if (!dropData.name) {
      toast.error("O nome do drop é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      if (editingDrop) {
        // UPDATE
        const { error } = await supabase
          .from('drops')
          .update({
            drop_name: dropData.name,
            description: dropData.description,
            drop_image_url: dropData.image_url,
            drop_link: dropData.link
          })
          .eq('id', editingDrop.id);

        if (error) throw error;
        toast.success("✓ Drop atualizado com sucesso");
      } else {
        // INSERT
        // 1. Inserir Drop
        const { data: drop, error: dropError } = await supabase
          .from('drops')
          .insert({
            drop_name: dropData.name,
            description: dropData.description,
            drop_image_url: dropData.image_url,
            drop_link: dropData.link,
            source: pieces[0]?.source || 'manual'
          })
          .select()
          .single();

        if (dropError) throw dropError;

        // 2. Inserir Peças
        const validPieces = pieces
          .filter(p => p.name.trim() !== "")
          .map(p => ({
            name: p.name,
            image_url: p.image_url,
            piece_url: p.piece_url,
            available_as: p.available_as,
            drop_id: drop.id,
            full_description: p.full_description,
            stlflix_code: p.stlflix_code,
            stlflix_slug: p.stlflix_slug,
          stlflix_url: p.piece_url,
          print_time_mono: p.print_time_mono,
          print_time_multi: p.print_time_multi,
          height_cm: p.height_cm,
          source: p.source || 'manual',
          drive_url: p.drive_url,
          material: p.material,
          print_notes: p.print_notes,
          print_time_estimated: p.print_time_estimated
        }));

        if (validPieces.length > 0) {
          const { error: piecesError } = await supabase
            .from('pieces')
            .insert(validPieces);
          if (piecesError) throw piecesError;
        }

        toast.success("Drop criado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["drops"] });
      onOpenChange(false);
      // Reset form
      setDropData({ name: "", description: "", image_url: "", link: "" });
      setPieces([{ 
        name: "", 
        image_url: "", 
        piece_url: "", 
        available_as: "ambos",
        full_description: "",
        stlflix_code: "",
        stlflix_slug: "",
        print_time_mono: "",
        print_time_multi: "",
        height_cm: "",
        source: "",
        drive_url: "",
        material: "",
        print_notes: "",
        print_time_estimated: ""
      }]);
      setStlflixUrl("");
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lançamento</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" className="gap-2">
              <FileText className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <History className="h-4 w-4" />
              Importar por link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-dashed">
              <div className="space-y-2">
                <Label>Link da peça na STLFLIX</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Cole o link da peça na STLFLIX (ex: platform.stlflix.com/product/popsi-kill)" 
                    value={stlflixUrl}
                    onChange={e => setStlflixUrl(e.target.value)}
                  />
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0" 
                    onClick={handleScrape}
                    disabled={isScraping}
                  >
                    {isScraping ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar
                  </Button>
                </div>
              </div>
            </div>

            {pieces[0]?.source === 'stlflix_import' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Nome da peça *</Label>
                    <Input 
                      value={dropData.name}
                      onChange={e => {
                        setDropData({...dropData, name: e.target.value});
                        updatePiece(0, 'name', e.target.value);
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Código STL</Label>
                      <div className="relative">
                        <Input 
                          value={pieces[0].stlflix_code}
                          readOnly
                          className="pr-10 bg-muted/50"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(pieces[0].stlflix_code);
                            toast.success("Copiado!");
                          }}
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>URL da imagem</Label>
                      <Input 
                        value={dropData.image_url}
                        onChange={e => {
                          setDropData({...dropData, image_url: e.target.value});
                          updatePiece(0, 'image_url', e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição completa</Label>
                    <Textarea 
                      className="min-h-[120px]"
                      value={pieces[0].full_description}
                      onChange={e => updatePiece(0, 'full_description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tempo Mono</Label>
                      <Input 
                        placeholder="Ex: 5h 30m" 
                        value={pieces[0].print_time_mono}
                        onChange={e => updatePiece(0, 'print_time_mono', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tempo Multi</Label>
                      <Input 
                        placeholder="Ex: 12h 15m" 
                        value={pieces[0].print_time_multi}
                        onChange={e => updatePiece(0, 'print_time_multi', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Altura (cm)</Label>
                      <Input 
                        placeholder="Ex: 15cm" 
                        value={pieces[0].height_cm}
                        onChange={e => updatePiece(0, 'height_cm', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Link STLFLIX</Label>
                      <Input 
                        value={dropData.link}
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disponível como</Label>
                      <Select 
                        value={pieces[0].available_as} 
                        onValueChange={val => updatePiece(0, 'available_as', val)}
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
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading} 
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Criar Drop com esta peça"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingDrop ? "Salvar alterações" : "Salvar Drop"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PriceCalculatorDialog({ piece, onUsePrice }: { piece: any, onUsePrice: (price: number, platform: 'ml' | 'shopee', grams: number, hours: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [grams, setGrams] = useState(piece.filament_grams || 0);
  const [hours, setHours] = useState(piece.print_hours || 0);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["cost_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_settings").select("*").single();
      if (error) throw error;
      return data;
    }
  });

  const costs = useMemo(() => {
    if (!settings) return null;
    const filamentCost = (grams / 1000) * Number(settings.filament_price_per_kg);
    const energyCost = hours * Number(settings.energy_cost_per_hour);
    const packagingCost = Number(settings.packaging_cost);
    const totalProduction = filamentCost + energyCost + packagingCost;

    const priceML = totalProduction / (1 - Number(settings.ml_commission_rate) / 100) / (1 - Number(settings.desired_margin) / 100);
    const priceShopee = totalProduction / (1 - Number(settings.shopee_commission_rate) / 100) / (1 - Number(settings.desired_margin) / 100);

    return { filamentCost, energyCost, packagingCost, totalProduction, priceML, priceShopee };
  }, [grams, hours, settings]);

  const updatePieceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pieces').update({
        filament_grams: grams,
        print_hours: hours
      }).eq('id', piece.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pieces", piece.drop_id] });
    }
  });

  const handleUsePrice = (price: number, platform: 'ml' | 'shopee') => {
    onUsePrice(price, platform, grams, hours);
    updatePieceMutation.mutate();
    setIsOpen(false);
    toast.success("Preço aplicado e dados salvos!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex-1 text-xs h-8">
          <Calculator className="mr-2 h-3 w-3" />
          Calcular preço
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Calculadora de Preço — {piece.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gramas de filamento</Label>
              <Input type="number" value={grams} onChange={e => setGrams(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Horas de impressão</Label>
              <Input type="number" step="0.1" value={hours} onChange={e => setHours(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2 bg-muted/50 p-3 rounded-lg text-xs">
            <h4 className="font-bold uppercase opacity-60">Valores de Referência (Configurações)</h4>
            <div className="grid grid-cols-2 gap-2 opacity-80">
              <p>Filamento: R$ {settings?.filament_price_per_kg}/kg</p>
              <p>Energia: R$ {settings?.energy_cost_per_hour}/h</p>
              <p>Embalagem: R$ {settings?.packaging_cost}</p>
              <p>Margem: {settings?.desired_margin}%</p>
            </div>
          </div>

          {costs && (
            <div className="space-y-4">
              <div className="p-3 border rounded-lg space-y-1 text-sm bg-accent/20">
                <div className="flex justify-between"><span>Custo Filamento</span> <span>R$ {costs.filamentCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Custo Energia</span> <span>R$ {costs.energyCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Custo Embalagem</span> <span>R$ {costs.packagingCost.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Custo Total</span> <span>R$ {costs.totalProduction.toFixed(2)}</span></div>
              </div>


              <div className="grid gap-3">
                <Card className="bg-primary/5 border-primary/20 p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold opacity-60">Sugestão Mercado Livre</p>
                    <p className="text-lg font-bold text-primary">R$ {costs.priceML.toFixed(2)}</p>
                  </div>
                  <Button size="sm" onClick={() => handleUsePrice(costs.priceML, 'ml')}>Usar este preço</Button>
                </Card>

                <Card className="bg-primary/5 border-primary/20 p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold opacity-60">Sugestão Shopee</p>
                    <p className="text-lg font-bold text-primary">R$ {costs.priceShopee.toFixed(2)}</p>
                  </div>
                  <Button size="sm" onClick={() => handleUsePrice(costs.priceShopee, 'shopee')}>Usar este preço</Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublicationDialog({ piece, disabled }: { piece: any, disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'loading' | 'review'>('loading');
  const [aiData, setAiData] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleStartPublish = async () => {
    setIsOpen(true);
    setStep('loading');
    
    try {
      const { data: pieceData } = await supabase.from('pieces').select('full_description, print_notes').eq('id', piece.id).single();
      const { data: drop } = await supabase.from('drops').select('description').eq('id', piece.drop_id).single();
      
      const result = await generateCopyFn({
        piece_name: piece.name,
        drop_description: pieceData?.full_description || (pieceData as any)?.description || pieceData?.print_notes || drop?.description || "",
        price_figura: piece.price_figura ? Number(piece.price_figura) : null,
        price_chaveiro: piece.price_chaveiro ? Number(piece.price_chaveiro) : null,
        available_as: piece.available_as
      });

      
      setAiData(result);
      setStep('review');
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao gerar textos: ${error.message}`);
      setIsOpen(false);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      // Salvar listing
      const { error: listError } = await supabase.from('listings').insert({
        piece_id: piece.id,
        platform: 'ml_shopee',
        title: aiData.titulo_ml,
        description_ml: aiData.descricao_ml,
        description_shopee: aiData.descricao_shopee,
        caption_instagram: aiData.caption_instagram,
        caption_tiktok: aiData.caption_tiktok,
        hashtags: aiData.hashtags,
        price: Number(piece.price_figura || piece.price_chaveiro),
        published_at: new Date().toISOString(),
        status: 'ativo'
      });
      
      if (listError) throw listError;
      
      // Atualizar peça
      const { error: pieceError } = await supabase.from('pieces').update({
        status: 'publicado'
      }).eq('id', piece.id);
      
      if (pieceError) throw pieceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pieces", piece.drop_id] });
      toast.success("✓ Publicado com sucesso!", { className: "bg-success text-white" });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao publicar: ${error.message}`);
    }
  });

  return (
    <>
      <Button 
        size="sm" 
        className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90" 
        disabled={disabled}
        onClick={handleStartPublish}
      >
        Publicar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn(
          "transition-all duration-300",
          step === 'review' ? "sm:max-w-[700px]" : "sm:max-w-[400px]"
        )}>
          {step === 'loading' ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium animate-pulse">Gerando textos com IA...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Revisão de Anúncios — {piece.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Tabs defaultValue="ml" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="ml">ML</TabsTrigger>
                    <TabsTrigger value="shopee">Shopee</TabsTrigger>
                    <TabsTrigger value="instagram">Instagram</TabsTrigger>
                    <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ml" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Título (ML)</Label>
                      <Input value={aiData.titulo_ml} onChange={e => setAiData({...aiData, titulo_ml: e.target.value})} maxLength={60} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={aiData.descricao_ml} onChange={e => setAiData({...aiData, descricao_ml: e.target.value})} className="h-48" />
                    </div>
                  </TabsContent>

                  <TabsContent value="shopee" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Título (Shopee)</Label>
                      <Input value={aiData.titulo_shopee} onChange={e => setAiData({...aiData, titulo_shopee: e.target.value})} maxLength={60} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={aiData.descricao_shopee} onChange={e => setAiData({...aiData, descricao_shopee: e.target.value})} className="h-48" />
                    </div>
                  </TabsContent>

                  <TabsContent value="instagram" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Legenda (Instagram)</Label>
                      <Textarea value={aiData.caption_instagram} onChange={e => setAiData({...aiData, caption_instagram: e.target.value})} className="h-48" />
                    </div>
                  </TabsContent>

                  <TabsContent value="tiktok" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Legenda (TikTok)</Label>
                      <Textarea value={aiData.caption_tiktok} onChange={e => setAiData({...aiData, caption_tiktok: e.target.value})} className="h-32" />
                    </div>
                    <div className="space-y-2">
                      <Label>Hashtags</Label>
                      <Textarea value={aiData.hashtags} onChange={e => setAiData({...aiData, hashtags: e.target.value})} className="h-24" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar e Publicar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

