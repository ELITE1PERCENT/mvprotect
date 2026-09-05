/**
 * ImagePositionPicker — aperçu d'une image dans un cadre au ratio choisi,
 * avec upload et repositionnement par glisser-déposer (souris + tactile).
 *
 * L'image est affichée en `object-fit: cover` ; faire glisser la photo à
 * l'intérieur du cadre déplace le point de cadrage (`object-position`),
 * exactement comme le repositionnement d'une photo de couverture. Le
 * résultat est stocké sous forme de chaîne CSS "X% Y%".
 */
import { useRef, useState } from "react";
import { Upload, Loader, Move, RotateCcw } from "lucide-react";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parsePosition(pos: string): { x: number; y: number } {
  const parts = pos.trim().split(/\s+/);
  const x = parseFloat(parts[0] ?? "50");
  const y = parseFloat(parts[1] ?? parts[0] ?? "50");
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  };
}

interface ImagePositionPickerProps {
  label: string;
  hint?: string;
  src: string;
  position: string;
  aspect: number; // width / height du cadre d'aperçu
  uploading?: boolean;
  onUpload: (file: File) => void;
  onPositionChange: (position: string) => void;
}

export function ImagePositionPicker({
  label,
  hint,
  src,
  position,
  aspect,
  uploading = false,
  onUpload,
  onPositionChange,
}: ImagePositionPickerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!src) return;
    e.preventDefault();
    const { x, y } = parsePosition(position);
    dragState.current = { startX: e.clientX, startY: e.clientY, posX: x, posY: y };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - dragState.current.startX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragState.current.startY) / rect.height) * 100;
    const newX = clamp(dragState.current.posX - deltaXPct, 0, 100);
    const newY = clamp(dragState.current.posY - deltaYPct, 0, 100);
    onPositionChange(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
  };

  const endDrag = () => {
    dragState.current = null;
    setDragging(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-white/60 font-sans text-xs uppercase tracking-widest">{label}</label>
        {src && (
          <button
            type="button"
            onClick={() => onPositionChange("50% 50%")}
            className="flex items-center gap-1 text-white/30 hover:text-white/60 font-sans text-[10px] uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Recentrer
          </button>
        )}
      </div>

      {hint && <p className="text-white/30 font-sans text-xs mb-3 leading-relaxed">{hint}</p>}

      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ aspectRatio: String(aspect), touchAction: "none" }}
        className={`relative w-full max-w-md overflow-hidden bg-black/40 border border-white/10 select-none ${
          src ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ objectPosition: position }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 font-sans text-xs">
            Aucune image
          </div>
        )}

        {src && !dragging && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white/60 px-2 py-1 flex items-center gap-1 text-[10px] font-sans uppercase tracking-wider pointer-events-none">
            <Move className="w-3 h-3" /> Glisser pour cadrer
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-3 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-sans text-xs px-4 py-2.5 transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5" />
        {src ? "Changer la photo" : "Uploader une photo"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
