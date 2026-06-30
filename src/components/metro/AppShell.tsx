import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, Star, Settings as SettingsIcon } from "lucide-react";
import { MetroBackground } from "@/components/metro/MetroBackground";
import { storage } from "@/lib/metro/storage";

const NAV = [
  { to: "/", icon: Home, label: "خانه" },
  { to: "/map", icon: Map, label: "نقشه" },
  { to: "/favorites", icon: Star, label: "علاقه‌مندی‌ها" },
  { to: "/settings", icon: SettingsIcon, label: "تنظیمات" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const s = storage.getSettings();
    document.documentElement.classList.toggle("light", s.theme === "light");
    document.documentElement.style.setProperty("--primary", oklchFromHex(s.accent));
    document.documentElement.style.setProperty("--ring", oklchFromHex(s.accent));
    document.documentElement.style.setProperty(
      "--glow",
      `color-mix(in oklab, ${s.accent} 55%, transparent)`,
    );
  }, []);

  return (
    <div dir="rtl" className="relative min-h-dvh font-fa">
      <MetroBackground />
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
        <div className="glass relative mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl p-2">
          {/* تبلیغ اپ دیگر */}
          <div className="pointer-events-none absolute -top-8 left-[6px] right-auto flex items-center justify-center">
            <div className="rounded-full bg-primary/15 px-4 py-1 text-[11px] font-bold text-primary neon-ring">
              یادگیری شیمی با <span className="text-foreground">Atome Atlas</span>
            </div>
          </div>

          {NAV.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-all ${active
                    ? "bg-primary/15 text-primary neon-ring"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Very small hex -> oklch passthrough — we just set the CSS var to a color the
// browser can parse. oklch() can't read hex directly, so fall back to the hex.
function oklchFromHex(hex: string): string {
  return hex;
}

