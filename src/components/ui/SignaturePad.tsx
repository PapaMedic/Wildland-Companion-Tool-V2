/**
 * SignaturePad
 * -----------
 * A glass-morphic wrapper around react-signature-canvas.
 * Captures a drawn signature and returns a base64 PNG data URL.
 *
 * Props:
 *  label       – Section label shown above the pad
 *  value       – Current saved data URL (shows a "Signed ✓" badge)
 *  onSave      – Called with the PNG data URL when user clicks "Save Signature"
 *  onClear     – Called when user clears the signature
 */
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, Trash2 } from 'lucide-react';

interface Props {
  label: string;
  value?: string;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}

export function SignaturePad({ label, value, onSave, onClear }: Props) {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    canvasRef.current?.clear();
    setIsEmpty(true);
    onClear();
  };

  const handleSave = () => {
    if (canvasRef.current?.isEmpty()) return;
    const dataUrl = canvasRef.current!.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        {value && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Signed
          </span>
        )}
      </div>

      {/* Canvas area */}
      <div className="relative border border-white/10 rounded-xl overflow-hidden bg-black/30 group">
        <SignatureCanvas
          ref={canvasRef}
          backgroundColor="rgba(0,0,0,0)"
          penColor="black"
          canvasProps={{
            className: 'w-full',
            style: { height: 110, display: 'block', cursor: 'crosshair', filter: 'invert(1)' },
          }}
          onBegin={() => setIsEmpty(false)}
        />
        {/* Placeholder text when empty */}
        {isEmpty && !value && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-zinc-600 text-sm select-none">
            Draw signature here
          </p>
        )}
        {/* Show previously saved sig as faint watermark */}
        {value && isEmpty && (
          <img
            src={value}
            alt="Saved signature"
            className="pointer-events-none absolute inset-0 w-full h-full object-contain opacity-30 invert"
          />
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-rose-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" /> Save Signature
        </button>
      </div>
    </div>
  );
}
