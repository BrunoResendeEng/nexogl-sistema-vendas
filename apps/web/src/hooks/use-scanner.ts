import { useEffect, useRef, useCallback } from 'react';

const HID_TIMING_MS = 30; // teclas chegando em < 30ms = leitor USB

interface UseScannerOptions {
  onScan: (codigo: string) => void;
  enabled?: boolean;
}

export function useScanner({ onScan, enabled = true }: UseScannerOptions) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const codigo = bufferRef.current.trim();
    bufferRef.current = '';
    if (codigo.length >= 4) onScan(codigo);
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignora se o foco está em input/textarea/select (exceto o próprio scanner)
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
        return;
      }

      // Só acumula se for caractere imprimível
      if (e.key.length !== 1) return;

      // Se o intervalo entre teclas é maior que o threshold, reinicia o buffer
      if (delta > HID_TIMING_MS * 3 && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      bufferRef.current += e.key;

      // Timer de segurança: se não vier Enter, flush após 200ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 200);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush]);
}
