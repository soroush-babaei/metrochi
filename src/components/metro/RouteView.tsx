import { ArrowLeftRight, Clock, MapPin, AlertTriangle, Star } from "lucide-react";
import { storage } from "@/lib/metro/storage";
import { toast } from "sonner";

import type { RouteResult } from "@/lib/metro/graph";

const LINE_COLORS: Record<number, string> = {
  1: "#E63946", 2: "#273B91", 3: "#26ABE3", 4: "#FEE111",
  5: "#0C9448", 6: "#F16DA9", 7: "#813E9A",
};

export function RouteSummary({
  result, onSaveFavorite, saved,
}: { result: RouteResult; onSaveFavorite?: () => void; saved?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <Stat icon={<MapPin className="h-4 w-4" />} label="تعداد ایستگاه" value={`${result.station_count}`} />
        <Stat icon={<ArrowLeftRight className="h-4 w-4" />} label="تعویض خط" value={`${result.transfer_count}`} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1 overflow-hidden">
          {dedupeLines(result.lines).map((lid, i) => (
            <span
              key={`${lid}-${i}`}
              className="rounded-full px-3 py-1 text-[11px] font-bold text-black"
              style={{ background: LINE_COLORS[lid], boxShadow: `0 0 10px ${LINE_COLORS[lid]}66` }}
            >
              خط {toFa(lid)}
            </span>
          ))}
        </div>
        {onSaveFavorite && (
          <button
            onClick={onSaveFavorite}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${saved ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            aria-label="ذخیره در علاقه‌مندی‌ها"
          >
            <Star className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/40 px-2 py-2">
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-base font-bold text-foreground">{value}</span>
    </div>
  );
}

export function RouteTimeline({ result }: { result: RouteResult }) {
  const settings = storage.getSettings();
  const showIntermediate = settings.showIntermediateStations;

  const visibleSteps = result.steps.map((step, i) => ({ step, index: i })).filter(({ step, index }) => {
    const isStart = index === 0;
    const isEnd = index === result.steps.length - 1;
    const isTransfer = step.is_transfer;

    return showIntermediate || isStart || isEnd || isTransfer;
  });

  return (
    <ol className="relative mt-4 pr-4">
      {visibleSteps.map(({ step, index }, visibleIdx) => {
        const nextVisible = visibleSteps[visibleIdx + 1];
        const nextStep = nextVisible?.step;
        const transferInstruction = getTransferInstruction(result, index);
        const color = step.line_color;
        const nextColor = nextStep?.line_color;
        const isStart = index === 0;
        const isEnd = index === result.steps.length - 1;

        return (
          <li key={`${step.station}-${index}`} className="relative pr-6 pb-6 last:pb-0">
            {/* vertical line */}
            {!isEnd && (
              <span
                className="absolute right-[7px] top-3 bottom-0 w-[3px] rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${color}, ${nextColor ?? color})`,
                  boxShadow: `0 0 8px ${color}55`,
                }}
              />
            )}
            {/* dot */}
            <span
              className={`absolute right-0 top-2 flex h-4 w-4 items-center justify-center rounded-full ${isStart || isEnd ? "pulse-dot" : ""
                }`}
              style={{
                background: color,
                boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 30%, transparent), 0 0 14px ${color}`,
              }}
            />
            <div className="flex items-center gap-2">
              <p className={`font-bold ${isStart || isEnd ? "text-foreground text-lg" : "text-foreground"}`}>
                {step.station}
              </p>
              {step.under_construction && (
                <AlertTriangle
                  className="h-3.5 w-3.5 text-yellow-400 cursor-pointer"
                  aria-label="در دست ساخت"
                  onClick={() => toast("این ایستگاه در حال تعمیر یا در حال ساخت است", { duration: 1000 })}
                />
              )}
              {isStart && <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">مبدأ</span>}
              {isEnd && <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">مقصد</span>}
            </div>

            <p className="mt-0.5 text-[11px]" style={{ color }}>{step.line_name}</p>

            {transferInstruction && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: `${color}22`, color }}
              >
                <ArrowLeftRight className="h-3 w-3 text-white" />
                <span className="text-white">
                  تعویض به {transferInstruction.lineName}
                  {transferInstruction.directionName && (
                    <span className="text-white">— سمت {transferInstruction.directionName}</span>
                  )}
                  {transferInstruction.untilStation && (
                    <span className="text-white">— تا {transferInstruction.untilStation}</span>
                  )}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function getTransferInstruction(result: RouteResult, index: number) {
  const step = result.steps[index];
  const prevStep = result.steps[index - 1];
  if (!step || !prevStep || prevStep.line_id === step.line_id) return null;

  let untilStation = step.station;
  for (let i = index + 1; i < result.steps.length; i++) {
    const candidate = result.steps[i];
    if (candidate.line_id !== step.line_id) break;
    untilStation = candidate.station;
  }

  return {
    lineName: step.line_name,
    directionName: step.direction_name,
    untilStation: untilStation !== step.station ? untilStation : undefined,
  };
}

function dedupeLines(lines: number[]): number[] {
  const out: number[] = [];
  for (const l of lines) if (out[out.length - 1] !== l) out.push(l);
  return out;
}

function toFa(n: number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).split("").map((c) => map[+c] ?? c).join("");
}
