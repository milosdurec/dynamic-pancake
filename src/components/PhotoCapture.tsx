'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RefreshCw, X } from 'lucide-react';

interface PhotoCaptureProps {
  onImage: (base64: string, mediaType: string) => void;
  preview: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function PhotoCapture({ onImage, preview, onClear, disabled }: PhotoCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'camera'>('idle');
  const [cameraError, setCameraError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function compressImage(dataUrl: string, mimeType: string, callback: (compressed: string) => void) {
    const img = new Image();
    img.onload = () => {
      const MAX_PX = 1920;
      const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB base64 target
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      let quality = 0.88;
      let result = canvas.toDataURL('image/jpeg', quality);
      // reduce quality until under limit
      while (result.length > MAX_BYTES && quality > 0.4) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      callback(result);
    };
    img.src = dataUrl;
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      compressImage(raw, file.type || 'image/jpeg', (compressed) => {
        onImage(compressed, 'image/jpeg');
      });
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) readFile(file);
  }

  const startCamera = useCallback(async () => {
    setCameraError(false);
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError(true);
      setMode('idle');
    }
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMode('idle');
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    compressImage(dataUrl, 'image/jpeg', (compressed) => {
      onImage(compressed, 'image/jpeg');
    });
  }

  function handleClear() {
    stopCamera();
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (mode === 'camera') {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={stopCamera}
            className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-white/40 hover:scale-105 transition-transform shadow-lg"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Upload size={18} />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
    );
  }

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: '4/3' }}>
        <img src={preview} alt="Jedlo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <button
          onClick={handleClear}
          disabled={disabled}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-4 p-8 cursor-pointer select-none
        ${dragging ? 'border-orange-400 bg-orange-50' : 'border-stone-200 bg-stone-50 hover:border-orange-300 hover:bg-orange-50/60'}
      `}
      style={{ minHeight: 220 }}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-400">
        <Upload size={26} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-stone-700">Pretiahni alebo vyber fotografiu</p>
        <p className="text-sm text-stone-400 mt-1">JPEG · PNG · WebP · max 5 MB</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 text-sm font-medium hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
        >
          <Upload size={15} />
          Vybrať súbor
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startCamera(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Camera size={15} />
          Odfotiť
        </button>
      </div>
      {cameraError && <p className="text-xs text-red-500 mt-1">Kamera nie je dostupná — použi nahranie súboru</p>}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
