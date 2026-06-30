import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Sun, Info, Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/metro/AppShell";
import { storage, type Settings } from "@/lib/metro/storage";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const ACCENTS = [
  { name: "آبی خط ۳", color: "#26ABE3" },
  { name: "قرمز خط ۱", color: "#E63946" },
  { name: "صورتی خط ۶", color: "#F16DA9" },
  { name: "بنفش خط ۷", color: "#813E9A" },
  { name: "سبز خط ۵", color: "#0C9448" },
  { name: "زرد خط ۴", color: "#FEE111" },
];

function SettingsPage() {
  const [s, setS] = useState<Settings>(() => storage.getSettings());

  const update = (next: Settings) => {
    setS(next);
    storage.setSettings(next);
    document.documentElement.classList.toggle("light", next.theme === "light");
    document.documentElement.style.setProperty("--primary", next.accent);
    document.documentElement.style.setProperty("--ring", next.accent);
    document.documentElement.style.setProperty(
      "--glow",
      `color-mix(in oklab, ${next.accent} 55%, transparent)`,
    );
  };

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-glow">تنظیمات</h1>
        <p className="mt-1 text-xs text-muted-foreground">ظاهر و رنگ‌ها را به سلیقه خود تنظیم کنید</p>
      </header>

      <section className="glass mb-4 rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold">حالت نمایش</h2>
        <div className="grid grid-cols-2 gap-2">
          <ThemeBtn active={s.theme === "dark"} onClick={() => update({ ...s, theme: "dark" })} icon={<Moon className="h-4 w-4" />} label="تاریک" />
          <ThemeBtn active={s.theme === "light"} onClick={() => update({ ...s, theme: "light" })} icon={<Sun className="h-4 w-4" />} label="روشن" />
        </div>
      </section>

      <section className="glass mb-4 rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold">رنگ تأکید</h2>
        <div className="grid grid-cols-3 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.color}
              onClick={() => update({ ...s, accent: a.color })}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition ${
                s.accent === a.color ? "ring-2 ring-offset-2 ring-offset-background" : "hover:bg-accent"
              }`}
              style={{ ["--tw-ring-color" as never]: a.color }}
            >
              <span
                className="h-8 w-8 rounded-full"
                style={{ background: a.color, boxShadow: `0 0 14px ${a.color}` }}
              />
              <span className="text-[10px] text-muted-foreground">{a.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glass mb-4 rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold">نمایش ایستگاه‌های بین راهی</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          در صورت غیر فعال بودن، فقط مبدأ و مقصد در مسیر نمایش داده می‌شود
        </p>
<div className="flex gap-2">
          <ThemeBtn
            active={s.showIntermediateStations}
            onClick={() => update({ ...s, showIntermediateStations: true })}
            icon={<Eye className="h-4 w-4" />}
            label="نمایش بگذار"
          />
          <ThemeBtn
            active={!s.showIntermediateStations}
            onClick={() => update({ ...s, showIntermediateStations: false })}
            icon={<EyeOff className="h-4 w-4" />}
            label="عدم نمایش"
          />
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          <Info className="h-4 w-4" /> درباره متروچی
        </h2>
        <p className="text-xs leading-6 text-muted-foreground">
          متروچی یک مسیریاب هوشمند برای شبکه مترو تهران است. تمام محاسبات به‌صورت
          آفلاین و روی دستگاه شما انجام می‌شود — بدون نیاز به اینترنت یا سرور.
          <br />
          سازنده: سروش بابائی
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">نسخه ۱.۰.۰</p>
      </section>
    </AppShell>
  );
}

function ThemeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
        active ? "bg-primary text-primary-foreground neon-ring" : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
