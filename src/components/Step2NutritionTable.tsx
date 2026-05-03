'use client';

import { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { PhotoAnalysisResponse, NutritionResponse } from '@/lib/types';

interface Step2NutritionTableProps {
  photoAnalysis: PhotoAnalysisResponse;
  onComplete: (result: NutritionResponse) => void;
  onBack: () => void;
}

export default function Step2NutritionTable({ photoAnalysis, onComplete, onBack }: Step2NutritionTableProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionResponse | null>(null);

  async function calculate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: photoAnalysis.dishName, ingredients: photoAnalysis.ingredients }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: NutritionResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa vypočítať nutričné hodnoty');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">← Späť</button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📊 Nutričné hodnoty</h2>
          <p className="text-gray-500 text-sm">{photoAnalysis.dishName}</p>
        </div>
      </div>

      <ResultCard className="bg-orange-50/50">
        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Ingrediencie z analýzy:</h4>
        <ul className="space-y-1">
          {photoAnalysis.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{ing.name}</span>
              <span className="text-gray-500 font-mono">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </ResultCard>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {!result && !loading && (
        <button
          onClick={calculate}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
        >
          📊 Vypočítať nutričné hodnoty
        </button>
      )}

      {loading && <LoadingSpinner label="Počítam nutričné hodnoty..." />}

      {result && (
        <ResultCard>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Nutričná tabuľka</h3>
              <span className="text-sm text-gray-500">Porcia: {result.servingSize}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-orange-200">
                    <th className="text-left py-2 font-semibold text-gray-700">Živina</th>
                    <th className="text-right py-2 font-semibold text-gray-700">na 100g</th>
                    <th className="text-right py-2 font-semibold text-orange-600">na porciu</th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${row.nutrient === 'Kalórie' ? 'bg-orange-50/50 font-semibold' : ''}`}>
                      <td className="py-2 text-gray-700">{row.nutrient}</td>
                      <td className="text-right py-2 text-gray-500 font-mono">{row.per100g}</td>
                      <td className="text-right py-2 text-gray-800 font-mono font-medium">{row.perServing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => onComplete(result)}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Pokračovať → Vyhľadať recept
            </button>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
