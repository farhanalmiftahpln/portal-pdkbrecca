import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" 
      onClick={onClose}
    >
        <div 
            className="relative max-w-[95vw] max-h-[95vh] w-full flex items-center justify-center border border-white/20 rounded-lg overflow-hidden bg-black/50" 
            onClick={(e) => e.stopPropagation()}
        >
            <button 
               className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-red-500/80 text-white rounded-full transition-colors font-bold shadow-lg"
               onClick={onClose}
             >
               <X className="w-5 h-5" />
             </button>

            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                centerOnInit={true}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <React.Fragment>
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                           <button 
                             className="w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg"
                             onClick={() => zoomIn()}
                             title="Zoom In"
                           >
                             <ZoomIn className="w-5 h-5" />
                           </button>
                           <button 
                             className="w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg"
                             onClick={() => zoomOut()}
                             title="Zoom Out"
                           >
                             <ZoomOut className="w-5 h-5" />
                           </button>
                           <button 
                             className="w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg"
                             onClick={() => resetTransform()}
                             title="Reset"
                           >
                             <Maximize className="w-5 h-5" />
                           </button>
                        </div>
                        <TransformComponent wrapperClass="w-full h-full flex items-center justify-center" contentClass="w-full h-full flex items-center justify-center">
                            <img 
                                src={imageUrl} 
                                alt="Zoomed" 
                                className="max-w-[95vw] max-h-[95vh] object-contain" 
                                referrerPolicy="no-referrer" 
                            />
                        </TransformComponent>
                    </React.Fragment>
                )}
            </TransformWrapper>
        </div>
    </div>
  );
}
