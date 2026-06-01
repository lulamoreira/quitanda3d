import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  DollarSign, 
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Package, label: "Drops", to: "/drops", showBadge: true },
  { icon: ClipboardList, label: "Histórico", to: "/historico" },
  { icon: DollarSign, label: "Financeiro", to: "/financeiro" },
  { icon: Settings, label: "Configurações", to: "/configuracoes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingPiecesCount, setPendingPiecesCount] = useState(0);
  const location = useLocation();


  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('pieces')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      
      if (!error && count !== null) {
        setPendingPiecesCount(count);
      }
    };

    fetchPendingCount();

    // Inscrição em tempo real para atualizações na contagem
    const channel = supabase
      .channel('pieces_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pieces' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Desktop e Tablet */}
      <aside className={cn(
        "hidden md:flex flex-col border-right bg-sidebar fixed h-full z-30 transition-all duration-300",
        "lg:w-60 w-16"
      )}>
        <div className="p-4 flex items-center gap-3">
          <span className="text-primary font-display font-bold text-2xl">Q3D</span>
          <span className="font-display font-bold text-lg lg:block hidden whitespace-nowrap overflow-hidden">
            Quitanda3dSHOP
          </span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="lg:block hidden font-medium">{item.label}</span>
                {item.showBadge && pendingPiecesCount > 0 && (
                  <Badge 
                    className="ml-auto lg:flex hidden bg-primary text-primary-foreground text-[10px] h-5 min-w-5 p-1 justify-center items-center"
                    variant="default"
                  >
                    {pendingPiecesCount}
                  </Badge>
                )}
                {/* Tooltip simples para modo colapsado no tablet */}
                {item.showBadge && pendingPiecesCount > 0 && (
                  <div className="lg:hidden absolute left-12 top-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        "md:ml-16 lg:ml-60 ml-0",
        "pb-16 md:pb-0" // Padding bottom para o mobile nav
      )}>
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-slide-up">
          {children}
        </div>
      </main>

      {/* Bottom Navigation para Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around px-2 z-40">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.showBadge && pendingPiecesCount > 0 && (
                <Badge 
                  className="absolute top-2 right-1/2 translate-x-4 bg-primary text-primary-foreground text-[8px] h-4 min-w-4 p-0.5 justify-center items-center"
                  variant="default"
                >
                  {pendingPiecesCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
