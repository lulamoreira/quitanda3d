import { AppShell } from "@/components/AppShell";
import { 
  ClipboardList, 
  Eye, 
  Copy, 
  Check, 
  Filter,
  Package,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";


import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function Historico() {

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const { data: listings, isLoading, isError, error } = useQuery({
    queryKey: ["listings", platformFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          pieces(
            name,
            image_url,
            drops(drop_name)
          )
        `)
        .order("published_at", { ascending: false });

      if (platformFilter !== "all") {
        query = query.eq("platform", platformFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;
      return data;
    },
    retry: 1,
  });

  if (isError) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
          <ClipboardList className="h-10 w-10 text-destructive opacity-50" />
          <h2 className="text-xl font-bold text-destructive">Erro no Histórico</h2>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || "Erro ao buscar publicações."}</p>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold font-display">Histórico de Publicações</h1>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 bg-card p-4 rounded-2xl border shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                <SelectItem value="ml_shopee">Mercado Livre / Shopee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <CheckCircle2 className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Peça</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Publicado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing: any) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          {listing.pieces?.image_url ? (
                            <img src={listing.pieces.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2 opacity-20" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{listing.pieces?.name}</span>
                          <span className="text-xs text-muted-foreground">{listing.pieces?.drops?.drop_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={listing.platform} />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {Number(listing.price).toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(listing.published_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={listing.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedListing(listing)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-4">
              {listings.map((listing: any) => (
                <Card key={listing.id} className="overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      {listing.pieces?.image_url ? (
                        <img src={listing.pieces.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-4 opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold truncate">{listing.pieces?.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{listing.pieces?.drops?.drop_name}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedListing(listing)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={listing.platform} />
                        <StatusBadge status={listing.status} />
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-lg font-bold text-primary">R$ {Number(listing.price).toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(listing.published_at), "dd/MM/yy", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="border-dashed py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-accent">
              <ClipboardList className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Nenhuma publicação ainda</p>
              <p className="text-sm text-muted-foreground px-12 max-w-md">Publique sua primeira peça na página Drops para vê-la aparecer aqui no seu histórico.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/drops'}>
              Ir para Drops
            </Button>
          </Card>
        )}

        {/* Details Sheet */}
        <ListingDetailsSheet 
          listing={selectedListing} 
          isOpen={!!selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      </div>
    </AppShell>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'ml_shopee') {
    return (
      <div className="flex gap-1">
        <Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 h-5">ML</Badge>
        <Badge className="bg-orange-500 text-white border-0 text-[10px] px-1.5 h-5">Shopee</Badge>
      </div>
    );
  }
  return <Badge variant="outline">{platform}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    ativo: "bg-green-100 text-green-700 border-green-200",
    pausado: "bg-yellow-100 text-yellow-700 border-yellow-200",
    encerrado: "bg-red-100 text-red-700 border-red-200"
  };
  return <Badge className={cn("text-[10px] uppercase font-bold", styles[status] || "bg-muted")}>{status}</Badge>;
}

function ListingDetailsSheet({ listing, isOpen, onClose }: { listing: any, isOpen: boolean, onClose: () => void }) {
  if (!listing) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl">Detalhes da Publicação</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-8">
          <div className="flex gap-4 items-start bg-muted/30 p-4 rounded-2xl border">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
              {listing.pieces?.image_url ? (
                <img src={listing.pieces.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-full h-full p-4 opacity-20" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{listing.pieces?.name}</h2>
              <p className="text-sm text-muted-foreground">{listing.pieces?.drops?.drop_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <PlatformBadge platform={listing.platform} />
                <StatusBadge status={listing.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Publicado em {format(new Date(listing.published_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          <Tabs defaultValue="ml" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ml">ML</TabsTrigger>
              <TabsTrigger value="shopee">Shopee</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>

            <TabsContent value="ml" className="space-y-4 mt-6">
              <CopyField label="Título (Mercado Livre)" value={listing.title} />
              <CopyField label="Descrição" value={listing.description_ml} multiline />
            </TabsContent>

            <TabsContent value="shopee" className="space-y-4 mt-6">
              <CopyField label="Título (Shopee)" value={listing.title} />
              <CopyField label="Descrição" value={listing.description_shopee} multiline />
            </TabsContent>

            <TabsContent value="instagram" className="space-y-4 mt-6">
              <CopyField label="Legenda Instagram" value={listing.caption_instagram} multiline />
              <CopyField label="Hashtags" value={listing.hashtags} multiline />
            </TabsContent>

            <TabsContent value="tiktok" className="space-y-4 mt-6">
              <CopyField label="Legenda TikTok" value={listing.caption_tiktok} multiline />
              <CopyField label="Hashtags" value={listing.hashtags} multiline />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CopyField({ label, value, multiline = false }: { label: string, value: string, multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copiado para o clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-bold uppercase opacity-60 tracking-wider">{label}</Label>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 mr-1 text-success" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      {multiline ? (
        <div className="p-3 bg-muted/50 rounded-lg text-sm border whitespace-pre-wrap min-h-[100px] max-h-[300px] overflow-y-auto">
          {value}
        </div>
      ) : (
        <div className="p-3 bg-muted/50 rounded-lg text-sm border font-medium truncate">
          {value}
        </div>
      )}
    </div>
  );
}

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
