'use client';

import { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { PhotoAnalysisResponse, RecipeResponse } from '@/lib/types';

interface Step3RecipeProps {
  photoAnalysis: PhotoAnalysisResponse;
  onComplete: (result: RecipeResponse) => void;
  onBack: () => void;
}

export default function Step3Recipe({ photoAnalysis, onComplete, onBack }: Step3RecipeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeResponse | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: photoAnalysis.dishName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: RecipeResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa nájsť recept');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">← Späť</button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔍 Najlepší recept online</h2>
          <p className="text-gray-500 text-sm">{photoAnalysis.dishName}</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {!result && !loading && (
        <button
          onClick={search}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
        >
          🌐 Vyhľadať najlepší recept
        </button>
      )}

      {loading && <LoadingSpinner label="Prehľadávam web, hľadám najlepší recept..." />}

      {result && (
        <ResultCard>
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{result.dishName}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.rating && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {result.rating}</span>
                )}
                {result.prepTime && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">⏱ Príprava: {result.prepTime}</span>
                )}
                {result.cookTime && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🍳 Varenie: {result.cookTime}</span>
                )}
              </div>
              {result.source && (
                <p className="text-xs text-gray-400 mt-2">
                  Zdroj:{' '}
                  {result.source.startsWith('http') ? (
                    <a href={result.source} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                      {result.source}
                    </a>
                  ) : (
                    <span>{result.source}</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ingrediencie (1 porcia):</h4>
              <ul className="space-y-1">
                {result.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{ing.name}</span>
                    <span className="text-gray-500 font-mono">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Postup:</h4>
              <ol className="space-y-2">
                {result.steps.map((step) => (
                  <li key={step.stepNumber} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <span className="text-gray-600">{step.instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => onComplete(result)}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Pokračovať → Nákupný zoznam
            </button>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
