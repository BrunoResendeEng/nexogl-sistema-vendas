'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface WebcamScannerProps {
  onScan: (codigo: string) => void;
  onClose: () => void;
}

export function WebcamScanner({ onScan, onClose }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setErro('Nenhuma câmera encontrada');
          setIniciando(false);
          return;
        }

        // Prefere câmera traseira em dispositivos móveis
        const device = devices.find((d) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('traseira') ||
          d.label.toLowerCase().includes('rear')
        ) ?? devices[0]!;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: device.deviceId, facingMode: 'environment' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIniciando(false);

        await reader.decodeFromStream(stream, videoRef.current!, (result) => {
          if (!ativo || !result) return;
          onScan(result.getText());
        });
      } catch (e) {
        if (!ativo) return;
        setErro('Não foi possível acessar a câmera. Verifique as permissões.');
        setIniciando(false);
      }
    }

    void iniciar();

    return () => {
      ativo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Leitor de câmera</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {iniciando && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
              Iniciando câmera...
            </div>
          )}
          {erro ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-400 text-sm">
              {erro}
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" />
              {/* Mira */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-cyan-400/70 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br" />
                </div>
              </div>
            </>
          )}
        </div>

        <p className="px-4 py-3 text-center text-xs text-slate-500">
          Aponte a câmera para o código de barras
        </p>
      </div>
    </div>
  );
}
