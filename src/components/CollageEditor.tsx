import React, { useRef, useState, useEffect } from "react";
import { cn } from "../lib/utils";

interface CollageEditorProps {
  sebelum: string;
  sesudah: string;
  proses1: string;
  proses2: string;
  onGridReady: (base64: string) => void;
}

export const CollageEditor: React.FC<CollageEditorProps> = ({ sebelum, sesudah, proses1, proses2, onGridReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Create a 1200 x 1200 canvas (2x2 grid, each cell 600x600)
  const cellW = 600;
  const cellH = 600;
  const cells = [
    { id: "sebelum", label: "FOTO SEBELUM", x: 0, y: 0, w: cellW, h: cellH, src: sebelum },
    { id: "sesudah", label: "FOTO SELESAI", x: cellW, y: 0, w: cellW, h: cellH, src: sesudah },
    { id: "proses1", label: "FOTO PROSES 1", x: 0, y: cellH, w: cellW, h: cellH, src: proses1 },
    { id: "proses2", label: "FOTO PROSES 2", x: cellW, y: cellH, w: cellW, h: cellH, src: proses2 }
  ];

  const [offsets, setOffsets] = useState<Record<string, { x: number, y: number, scale: number }>>({
    sebelum: { x: 0, y: 0, scale: 1 },
    sesudah: { x: 0, y: 0, scale: 1 },
    proses1: { x: 0, y: 0, scale: 1 },
    proses2: { x: 0, y: 0, scale: 1 }
  });

  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const loadImg = (id: string, src: string) => {
      if (!src) {
        setImages(prev => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return;
      }
      const img = new Image();
      if (!src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        setImages(prev => ({ ...prev, [id]: img }));
      };
      img.onerror = () => {
        console.warn(`[CollageEditor] Failed to load image for ${id}`);
      };
      img.src = src;
    };
    cells.forEach(c => loadImg(c.id, c.src));
  }, [sebelum, sesudah, proses1, proses2]);

  useEffect(() => {
    generateCanvas();
  }, [images, offsets]);

  const generateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1200;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cells.forEach(cell => {
      const img = images[cell.id];
      if (img) {
        const off = offsets[cell.id];
        
        const imgRatio = img.width / img.height;
        const cellRatio = cell.w / cell.h;
        let drawW = cell.w;
        let drawH = cell.h;

        if (imgRatio > cellRatio) {
          drawW = cell.h * imgRatio;
        } else {
          drawH = cell.w / imgRatio;
        }
        
        drawW *= off.scale;
        drawH *= off.scale;

        let drawX = cell.x + (cell.w - drawW) / 2 + off.x;
        let drawY = cell.y + (cell.h - drawH) / 2 + off.y;

        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.x, cell.y, cell.w, cell.h);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        ctx.fillStyle = "#374151";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TIDAK ADA FOTO", cell.x + cell.w/2, cell.y + cell.h/2);
      }

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

      // Label background at the bottom of the cell
      const barHeight = 60;
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(cell.x, cell.y + cell.h - barHeight, cell.w, barHeight);

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.label, cell.x + cell.w/2, cell.y + cell.h - (barHeight/2));
    });

    onGridReady(canvas.toDataURL("image/jpeg", 0.9));
  };

    const pointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const draggingCell = useRef<string | null>(null);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return {x: 0, y: 0};
    return {
      x: (clientX - rect.left) * (1200 / rect.width),
      y: (clientY - rect.top) * (1200 / rect.height)
    };
  };

  const clampOffset = (id: string, newOff: {x: number, y: number, scale: number}) => {
    const img = images[id];
    const cell = cells.find(c => c.id === id);
    if (!img || !cell) return newOff;

    const imgRatio = img.width / img.height;
    const cellRatio = cell.w / cell.h;
    let drawW = cell.w;
    let drawH = cell.h;

    if (imgRatio > cellRatio) {
      drawW = cell.h * imgRatio;
    } else {
      drawH = cell.w / imgRatio;
    }
    
    drawW *= newOff.scale;
    drawH *= newOff.scale;

    const maxPanX = Math.max(0, (drawW - cell.w) / 2);
    const maxPanY = Math.max(0, (drawH - cell.h) / 2);

    return {
      ...newOff,
      x: Math.min(Math.max(newOff.x, -maxPanX), maxPanX),
      y: Math.min(Math.max(newOff.y, -maxPanY), maxPanY)
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, pt);

    if (pointers.current.size === 1) {
      const cell = cells.find(c => pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h);
      if (cell) {
        draggingCell.current = cell.id;
      }
    } else if (pointers.current.size === 2 && draggingCell.current) {
      const pts = Array.from(pointers.current.values()) as Array<{ x: number; y: number }>;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDist.current = dist;
      initialScale.current = offsets[draggingCell.current].scale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    
    const pt = getCanvasPoint(e.clientX, e.clientY);
    const oldPt = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, pt);

    if (!draggingCell.current) return;
    const cellId = draggingCell.current;

    if (pointers.current.size === 1) {
      // Pan
      const dx = pt.x - oldPt.x;
      const dy = pt.y - oldPt.y;
      setOffsets(prev => ({
        ...prev,
        [cellId]: clampOffset(cellId, {
          ...prev[cellId],
          x: prev[cellId].x + dx,
          y: prev[cellId].y + dy
        })
      }));
    } else if (pointers.current.size === 2) {
      // Pinch
      const pts = Array.from(pointers.current.values()) as Array<{ x: number; y: number }>;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDist.current) {
        const scaleDelta = dist / initialPinchDist.current;
        const newScale = Math.max(0.5, initialScale.current * scaleDelta);
        setOffsets(prev => ({
          ...prev,
          [cellId]: clampOffset(cellId, {
            ...prev[cellId],
            scale: newScale
          })
        }));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      draggingCell.current = null;
      initialPinchDist.current = null;
    } else if (pointers.current.size === 1) {
      initialPinchDist.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const pt = getCanvasPoint(e.clientX, e.clientY);
    const cell = cells.find(c => pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h);
    if (cell) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setOffsets(prev => ({
        ...prev,
        [cell.id]: clampOffset(cell.id, {
          ...prev[cell.id],
          scale: Math.max(0.5, prev[cell.id].scale + delta)
        })
      }));
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-2">
      <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-primary/20 text-center">
        Sesuaikan Posisi & Ukuran Foto<br/>
        <span className="text-[9px] text-gray-400 font-normal">Geser (Drag) untuk memindahkan • Scroll/Pinch untuk memperbesar</span>
      </div>
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full max-w-[500px] touch-none cursor-move rounded-xl border border-white/20 shadow-2xl" 
      />
    </div>
  );
};
