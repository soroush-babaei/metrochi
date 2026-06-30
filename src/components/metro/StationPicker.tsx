import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { allStations, type StationInfo } from "@/lib/metro/graph";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

const LINE_COLORS: Record<number, string> = {
  1: "#E63946", 2: "#273B91", 3: "#26ABE3", 4: "#FEE111",
  5: "#0C9448", 6: "#F16DA9", 7: "#813E9A",
};

interface Props {
  value: string | null;
  onChange: (s: string) => void;
  label: string;
  placeholder?: string;
  accentColor?: string;
}

export function StationPicker({ value, onChange, label, placeholder, accentColor }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim();
    if (!t) return allStations;
    return allStations.filter((s) => s.name.includes(t));
  }, [q]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="glass group flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-right transition-all hover:neon-ring"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full pulse-dot"
            style={{ background: accentColor ?? "var(--color-line-3)", boxShadow: `0 0 12px ${accentColor ?? "#26ABE3"}` }}
          />
          <span className="flex flex-1 flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            <span className={`truncate text-base font-bold ${value ? "text-foreground" : "text-muted-foreground"}`}>
              {value ?? placeholder ?? "انتخاب ایستگاه"}
            </span>
          </span>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh]" dir="rtl">
        <DrawerHeader>
          <DrawerTitle className="text-right">{label}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی ایستگاه..."
              className="pr-9 text-right"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto px-2 pb-6">
          {filtered.map((s) => (
            <StationRow
              key={s.name}
              s={s}
              selected={s.name === value}
              onSelect={() => {
                onChange(s.name);
                setOpen(false);
                setQ("");
              }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">ایستگاهی پیدا نشد</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StationRow({
  s, selected, onSelect,
}: { s: StationInfo; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right transition ${
        selected ? "bg-primary/15 text-primary" : "hover:bg-accent"
      }`}
    >
      <div className="flex gap-1">
        {s.lines.map((l) => (
          <span
            key={l}
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: LINE_COLORS[l], boxShadow: `0 0 6px ${LINE_COLORS[l]}` }}
          />
        ))}
      </div>
      <span className="flex-1 truncate text-sm font-medium">{s.name}</span>
      {s.is_transfer && (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">تعویض</span>
      )}
      {s.under_construction && (
        <span className="rounded-md bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-300">در دست ساخت</span>
      )}
      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}
