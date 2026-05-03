'use client';

import { useState, useRef } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { PhotoAnalysisResponse } from '@/lib/types';

interface Step1PhotoUploadProps {
  onComplete: (result: PhotoAnalysisResponse) => void;
}

export default function Step1PhotoUpload({ onComplete }: Step1PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoAnalysisResponse | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    setMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }

  async function analyze() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview, mediaType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: PhotoAnalysisResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa analyzovať fotografiu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">📸 Analýza fotografie jedla</h2>
        <p className="text-gray-500 text-sm">Nahraj fotografiu jedla a AI identifikuje ingrediencie a odhadne množstvá</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}
          ${preview ? 'py-4' : 'py-12'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Náhľad jedla" className="max-h-64 mx-auto rounded-xl object-contain shadow-md" />
            <p className="text-sm text-gray-400">Klikni pre výber iného obrázka</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">🍽️</div>
            <p className="text-gray-600 font-medium">Pretiahni sem fotografiu alebo klikni na výber</p>
            <p className="text-gray-400 text-sm">Podporované formáty: JPEG, PNG, WebP, GIF (max 5 MB)</p>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {preview && !loading && (
        <button
          onClick={analyze}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
        >
          🔍 Analyzovať jedlo
        </button>
      )}

      {loading && <LoadingSpinner label="Analyzujem fotografiu jedla..." />}

      {result && (
        <ResultCard>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">🍴 {result.dishName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                ${result.confidence === 'high' ? 'bg-green-100 text-green-700' : ''}
                ${result.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${result.confidence === 'low' ? 'bg-red-100 text-red-700' : ''}
              `}>
                Istota: {result.confidence === 'high' ? 'Vysoká' : result.confidence === 'medium' ? 'Stredná' : 'Nízka'}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Identifikované ingrediencie:</h4>
              <ul className="space-y-1">
                {result.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between items-start text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{ing.name}</span>
                    <span className="text-gray-500 font-mono ml-4">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.notes && (
              <p className="text-xs text-gray-400 italic">{result.notes}</p>
            )}

            <button
              onClick={() => onComplete(result)}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Pokračovať → Nutričné hodnoty
            </button>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
