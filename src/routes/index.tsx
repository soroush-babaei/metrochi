import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpDown, Search, Sparkles, Zap, GitBranch } from "lucide-react";
import { AppShell } from "@/components/metro/AppShell";
import { StationPicker } from "@/components/metro/StationPicker";
import { RouteSummary, RouteTimeline } from "@/components/metro/RouteView";
import { metroGraph, type Mode } from "@/lib/metro/graph";
import { storage, type FavoriteRoute } from "@/lib/metro/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      from: search.from as string | undefined,
      to: search.to as string | undefined,
      mode: search.mode as Mode | undefined,
    };
  },
});

function HomePage() {
  const routeSearch = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("fastest");

  useEffect(() => {
    if (routeSearch.from && routeSearch.to) {
      setFrom(routeSearch.from);
      setTo(routeSearch.to);
      setMode(routeSearch.mode ?? "fastest");
      setComputed({ from: routeSearch.from, to: routeSearch.to, mode: routeSearch.mode ?? "fastest" });
    }
  }, [routeSearch.from, routeSearch.to, routeSearch.mode, navigate]);

  const [computed, setComputed] = useState<{ from: string; to: string; mode: Mode } | null>(() => {
    try {
      const raw = localStorage.getItem("metrochi:last_computed");
      return raw ? (JSON.parse(raw) as { from: string; to: string; mode: Mode }) : null;
    } catch {
      return null;
    }
  });

  const [favTick, setFavTick] = useState(0);

  const result = useMemo(() => {
    if (!computed) return null;
    return metroGraph.findRoute(computed.from, computed.to, computed.mode);
  }, [computed]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const search = () => {
    if (!from || !to) {
      toast.error("لطفاً مبدأ و مقصد را انتخاب کنید");
      return;
    }

    if (from === to) {
      toast.error("مبدأ و مقصد یکسان هستند");
      return;
    }
    const nextComputed = { from, to, mode } as const;
    setComputed(nextComputed);
    try {
      localStorage.setItem("metrochi:last_computed", JSON.stringify(nextComputed));
    } catch {
      // ignore
    }
  };

  const favRoutes = storage.getFavRoutes();
  const isSaved = !!(
    computed &&
    favRoutes.find(
      (r) => r.from === computed.from && r.to === computed.to && r.mode === computed.mode,
    )
  );

  const saveFav = () => {
    if (!computed) return;
    const list = storage.getFavRoutes();
    const existing = list.findIndex(
      (r) => r.from === computed.from && r.to === computed.to && r.mode === computed.mode,
    );
    if (existing >= 0) {
      list.splice(existing, 1);
      storage.setFavRoutes(list);
      toast("از علاقه‌مندی‌ها حذف شد");
    } else {
      const fav: FavoriteRoute = {
        id: `${Date.now()}`,
        from: computed.from,
        to: computed.to,
        mode: computed.mode,
        createdAt: Date.now(),
      };
      storage.setFavRoutes([fav, ...list]);
      toast.success("به علاقه‌مندی‌ها اضافه شد");
    }
    setFavTick((t) => t + 1);
  };

  void favTick;

  return (
    <AppShell>
      <header className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          مسیریاب هوشمند مترو تهران
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-glow">متروچی</h1>
        <p className="mt-1 text-xs text-muted-foreground">سریع‌ترین راه به مقصد</p>
      </header>

      <section className="relative space-y-2">
        <StationPicker
          label="مبدأ"
          value={from}
          onChange={setFrom}
          placeholder="ایستگاه شروع"
          accentColor="#26ABE3"
        />
        <div className="flex justify-center">
          <button
            onClick={swap}
            disabled={!from && !to}
            className="glass relative z-10 -my-3 flex h-10 w-10 items-center justify-center rounded-full neon-ring transition active:scale-95 disabled:opacity-40"
            aria-label="جابجایی"
          >
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </button>
        </div>
        <StationPicker
          label="مقصد"
          value={to}
          onChange={setTo}
          placeholder="ایستگاه پایان"
          accentColor="#F16DA9"
        />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <ModeButton
          active={mode === "fastest"}
          onClick={() => setMode("fastest")}
          icon={<Zap className="h-4 w-4" />}
          title="سریع‌ترین"
          subtitle="کمترین زمان"
        />
        <ModeButton
          active={mode === "least_transfers"}
          onClick={() => setMode("least_transfers")}
          icon={<GitBranch className="h-4 w-4" />}
          title="کم‌تعویض"
          subtitle="کمترین تعویض خط"
        />
      </section>

      <button
        onClick={search}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground neon-ring transition active:scale-[0.99]"
      >
        <Search className="h-5 w-5" />
        یافتن مسیر
      </button>

      {result === null && computed && (
        <div className="mt-6 rounded-2xl glass p-6 text-center text-sm text-muted-foreground">
          مسیری بین این دو ایستگاه پیدا نشد.
        </div>
      )}

      {result && (
        <section className="mt-6 space-y-4">
          <RouteSummary result={result} onSaveFavorite={saveFav} saved={isSaved} />
          <div className="glass rounded-2xl p-4">
            <h2 className="mb-2 text-sm font-bold text-muted-foreground">مسیر گام‌به‌گام</h2>
            <RouteTimeline result={result} />
          </div>
        </section>
      )}
    </AppShell>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass flex items-center gap-3 rounded-2xl px-3 py-3 text-right transition ${active ? "neon-ring bg-primary/15" : ""
        }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}
