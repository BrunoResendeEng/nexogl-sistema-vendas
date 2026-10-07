'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Scan } from 'lucide-react';
import { WebcamScanner } from './webcam-scanner';

interface ScannerInputProps {
  onScan: (codigo: string) => void;
  onChange?: (valor: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const HID_TIMING_MS = 30;

export function ScannerInput({
  onScan,
  onChange,
  placeholder = 'Código de barras (leitor ou câmera)...',
  className = '',
  autoFocus = false,
}: ScannerInputProps) {
  const [valor, setValor] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTimeRef = useRef(0);
  const isHidRef = useRef(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const now = Date.now();
    const delta = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Detecta leitor HID pelo timing entre teclas
    isHidRef.current = delta < HID_TIMING_MS;

    if (e.key === 'Enter') {
      e.preventDefault();
      const codigo = valor.trim();
      if (codigo.length >= 4) {
        onScan(codigo);
        setValor('');
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValor(e.target.value);
    onChange?.(e.target.value);
  }

  function handleWebcamScan(codigo: string) {
    setShowWebcam(false);
    onScan(codigo);
  }

  const base = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            ref={inputRef}
            value={valor}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${base} pl-9 pr-3 ${className}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          title="Usar câmera"
          className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {showWebcam && (
        <WebcamScanner
          onScan={handleWebcamScan}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </>
  );
}
