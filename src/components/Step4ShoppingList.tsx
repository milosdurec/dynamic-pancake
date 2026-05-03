'use client';

import { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { RecipeResponse, ShoppingListResponse } from '@/lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  mäso: '🥩',
  zelenina: '🥦',
  'mliečne výrobky': '🧀',
  koreniny: '🧂',
  obilniny: '🌾',
  ostatné: '🛒',
};

interface Step4ShoppingListProps {
  recipe: RecipeResponse;
  onComplete: (result: ShoppingListResponse) => void;
  onBack: () => void;
}

export default function Step4ShoppingList({ recipe, onComplete, onBack }: Step4ShoppingListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShoppingListResponse | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: recipe.dishName, ingredients: recipe.ingredients, people: 5 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: ShoppingListResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa vygenerovať nákupný zoznam');
    } finally {
      setLoading(false);
    }
  }

  const grouped = result
    ? result.items.reduce<Record<string, typeof result.items>>((acc, item) => {
        const cat = item.category || 'ostatné';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">← Späť</button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🛒 Nákupný zoznam</h2>
          <p className="text-gray-500 text-sm">{recipe.dishName} — pre 5 osôb</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {!result && !loading && (
        <button
          onClick={generate}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
        >
          🛒 Vygenerovať nákupný zoznam pre 5 osôb
        </button>
      )}

      {loading && <LoadingSpinner label="Pripravujem nákupný zoznam pre 5 osôb..." />}

      {result && (
        <ResultCard>
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Nákupný zoznam</h3>
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">👥 {result.people} osoby</span>
            </div>

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-600 text-sm mb-2 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] || '🛒'}</span>
                  <span className="capitalize">{category}</span>
                </h4>
                <ul className="space-y-1 pl-6">
                  {items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-mono">{item.amount} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {result.estimatedCost && (
              <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                <span className="text-sm font-semibold text-gray-700">Odhadované náklady</span>
                <span className="font-bold text-orange-600">{result.estimatedCost}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                🖨️ Tlačiť
              </button>
              <button
                onClick={() => onComplete(result)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
              >
                Pokračovať → Lokalita
              </button>
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
