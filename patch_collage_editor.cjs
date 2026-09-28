const fs = require('fs');
let code = fs.readFileSync('src/components/CollageEditor.tsx', 'utf8');

// We want to replace everything from `const [dragging, setDragging] = useState<string | null>(null);` to the end.
// And also we need `useRef` added if it's not. Wait, `useRef` is already imported.
const targetStart = "const [dragging, setDragging] = useState<string | null>(null);";

const startIndex = code.indexOf(targetStart);
if (startIndex === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

const replacement = `  const pointers = useRef<Map<number, {x: number, y: number}>>(new Map());
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
      const pts = Array.from(pointers.current.values());
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
      const pts = Array.from(pointers.current.values());
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
`;

code = code.slice(0, startIndex) + replacement;
fs.writeFileSync('src/components/CollageEditor.tsx', code);
console.log("Successfully patched CollageEditor.");
