import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/metro/AppShell";
import { useEffect, useRef, useState } from "react";

import mapImg from "../../نقشه-ارديبهشت- (1).jpg";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

function MapPage() {
  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-black text-glow">نقشه مترو</h1>
        <p className="mt-1 text-xs text-muted-foreground">برای بزرگ‌نمایی و جابه‌جایی از دو انگشت استفاده کنید</p>
      </header>

      <div className="glass overflow-hidden rounded-2xl p-3">
        <div
          className="relative touch-none select-none w-full"
          style={{
            touchAction: "none",
            width: "100%",
            height: "70dvh",
            background: "transparent",
          }}
        >
          <MapViewer imgSrc={mapImg} />
        </div>
      </div>
    </AppShell>
  );
}

type MapViewerProps = { imgSrc: string };

function MapViewer({ imgSrc }: MapViewerProps) {
  return <MapViewerInner imgSrc={imgSrc} />;
}

type ViewerState = { scale: number; tx: number; ty: number };

type DragState = {
  dragging: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
  pinch: boolean;
  startDist: number;
  startScale: number;
  centerStartX: number;
  centerStartY: number;
  startTx2: number;
  startTy2: number;
};

function MapViewerInner({ imgSrc }: { imgSrc: string }) {
  const [state, setState] = useState<ViewerState>({ scale: 1, tx: 0, ty: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({
    dragging: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    pinch: false,
    startDist: 0,
    startScale: 1,
    centerStartX: 0,
    centerStartY: 0,
    startTx2: 0,
    startTy2: 0,
  });

  const activePointersRef = useRef<Map<number, PointerEvent>>(new Map());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const getDist = (a: PointerEvent, b: PointerEvent) => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

      const d = dragRef.current;
      activePointersRef.current.set(e.pointerId, e);

      if (!d.pinch && !d.dragging && activePointersRef.current.size === 1) {
        d.dragging = true;
        d.pointerId = e.pointerId;
        d.startX = e.clientX;
        d.startY = e.clientY;
        d.startTx = state.tx;
        d.startTy = state.ty;
        return;
      }

      if (!d.pinch && activePointersRef.current.size === 2) {
        const pointers = [...activePointersRef.current.values()];
        const first = pointers[0];
        const dist = getDist(first, e);

        d.pinch = true;
        d.dragging = false;
        d.startDist = dist;
        d.startScale = state.scale;
        d.centerStartX = (first.clientX + e.clientX) / 2;
        d.centerStartY = (first.clientY + e.clientY) / 2;
        d.startTx2 = state.tx;
        d.startTy2 = state.ty;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

      activePointersRef.current.set(e.pointerId, e);

      const d = dragRef.current;
      if (d.pinch) {
        const map = activePointersRef.current;
        if (map.size < 2) return;
        const pointers = [...map.values()];
        const a = pointers[0];
        const b = pointers[1];

        const dist = getDist(a, b);
        const nextScale = Math.min(4, Math.max(1, (dist / d.startDist) * d.startScale));

        const centerX = (a.clientX + b.clientX) / 2;
        const centerY = (a.clientY + b.clientY) / 2;
        const dx = centerX - d.centerStartX;
        const dy = centerY - d.centerStartY;

        const scaleRatio = nextScale / d.startScale;
        const nextTx = d.startTx2 + dx * (scaleRatio - 1);
        const nextTy = d.startTy2 + dy * (scaleRatio - 1);

        setState({ scale: nextScale, tx: nextTx, ty: nextTy });
        return;
      }

      if (d.dragging && e.pointerId === d.pointerId) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        setState({ scale: state.scale, tx: d.startTx + dx, ty: d.startTy + dy });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);

      const d = dragRef.current;
      if (d.pinch) {
        d.pinch = false;
        d.dragging = false;
        d.pointerId = -1;
        return;
      }

      if (d.dragging && e.pointerId === d.pointerId) {
        d.dragging = false;
        d.pointerId = -1;
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [state.scale, state.tx, state.ty]);

  const { scale, tx, ty } = state;

  return (
    <div ref={ref} className="h-full w-full overflow-hidden flex items-center justify-center">
      <img
        src={imgSrc}
        alt="نقشه مترو"
        draggable={false}
        className="select-none"
        style={{
          userSelect: "none",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center",
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
