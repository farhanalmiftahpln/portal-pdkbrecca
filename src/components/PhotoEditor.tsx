import React, { useRef, useState, useEffect } from 'react';
import { X, Check, PenTool, Undo } from 'lucide-react';

interface PhotoEditorProps {
  initialImage: string;
  onSave: (editedBase64: string) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ initialImage, onSave, onCancel }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !containerRef.current) return;

    const img = new Image();
    img.src = initialImage;
    img.onload = () => {
      // Calculate aspect ratio to fit within container
      const containerW = containerRef.current!.clientWidth;
      const containerH = containerRef.current!.clientHeight;
      
      let newW = img.width;
      let newH = img.height;
      const ratio = Math.min(containerW / img.width, containerH / img.height);
      
      if (ratio < 1) {
        newW = img.width * ratio;
        newH = img.height * ratio;
      }

      canvas.width = newW;
      canvas.height = newH;
      ctx.drawImage(img, 0, 0, newW, newH);
      saveState();
    };
  }, [initialImage]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const prevState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(prevState, 0, 0);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.beginPath(); // reset path
    saveState();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0a0f12]">
      {/* Toolbar */}
      <div className="h-14 bg-[#0d161a] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white rounded bg-white/5">
            <X className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <PenTool className="w-4 h-4" /> Edit Foto
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          />
          <button 
            onClick={undo}
            disabled={history.length <= 1}
            className="p-2 text-gray-400 hover:text-white rounded bg-white/5 disabled:opacity-50"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1 bg-primary text-black px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-primary-dark shadow-[0_0_10px_rgba(255,94,0,0.3)]"
          >
            <Check className="w-4 h-4" /> Simpan
          </button>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 flex items-center justify-center p-4 overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={endDrawing}
          onTouchMove={draw}
          className="max-w-full max-h-full rounded-lg shadow-2xl cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}
