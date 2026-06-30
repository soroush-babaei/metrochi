import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Star, GitBranch, Zap } from "lucide-react";
import { AppShell } from "@/components/metro/AppShell";
import { storage, type FavoriteRoute } from "@/lib/metro/storage";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Mode } from "@/lib/metro/graph";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState(() => storage.getFavRoutes());

  const removeRoute = (id: string) => {
    setRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      storage.setFavRoutes(next);
      return next;
    });
  };

  const useRoute = (from: string, to: string, mode: Mode) => {
    navigate({ to: "/", search: { from, to, mode } });
  };

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-black text-glow">علاقه‌مندی‌ها</h1>
        <p className="mt-1 text-xs text-muted-foreground">دسترسی سریع به مسیرهای پرتکرار</p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          <Star className="h-3.5 w-3.5" /> مسیرها
        </h2>
        {routes.length === 0 ? (
          <Empty text="هنوز مسیری ذخیره نکرده‌اید" />
        ) : (
          <div className="space-y-2">
            {routes.map((r) => (
              <RouteItem key={r.id} route={r} onRemove={removeRoute} onUse={useRoute} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function RouteItem({
  route,
  onRemove,
  onUse,
}: {
  route: FavoriteRoute;
  onRemove: (id: string) => void;
  onUse: (from: string, to: string, mode: Mode) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="glass flex cursor-pointer items-center gap-3 rounded-2xl p-3">
          <div className="flex-1">
            <p className="text-sm font-bold">
              {route.from} ← {route.to}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {route.mode === "fastest" ? "سریع‌ترین" : "کم‌تعویض"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(route.id);
            }}
            className="rounded-full bg-muted p-4 -m-2 text-muted-foreground hover:text-destructive touch-manipulation"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onUse(route.from, route.to, "least_transfers")}>
          <GitBranch className="h-4 w-4" />
          کم‌تعویض
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUse(route.from, route.to, "fastest")}>
          <Zap className="h-4 w-4" />
          سریع‌ترین
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">{text}</div>;
}