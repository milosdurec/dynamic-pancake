'use client';

import { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { LocationResponse, ReviewsResponse } from '@/lib/types';

interface Step6ReviewsProps {
  location?: LocationResponse;
  dishName?: string;
  onBack: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function Step6Reviews({ location, dishName, onBack }: Step6ReviewsProps) {
  const [restaurantName, setRestaurantName] = useState(location?.restaurantName || '');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewsResponse | null>(null);
  const [copied, setCopied] = useState<'google' | 'tripadvisor' | null>(null);

  async function generate() {
    if (!restaurantName.trim() || !comments.trim()) {
      setError('Zadaj názov reštaurácie a tvoje komentáre');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          userComments: comments.trim(),
          dishName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: ReviewsResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa vygenerovať recenzie');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, type: 'google' | 'tripadvisor') {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">← Späť</button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">✍️ Generovanie recenzií</h2>
          <p className="text-gray-500 text-sm">Google & TripAdvisor recenzie v angličtine</p>
        </div>
      </div>

      {!result && (
        <ResultCard>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Názov reštaurácie *</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="napr. Reštaurácia U Jozefa"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tvoje dojmy a komentáre *
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Opíš svoj zážitok — čo sa ti páčilo, ako chutnalo jedlo, ako bola obsluha, atmosféra... (môžeš písať po slovensky alebo anglicky)"
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">AI vytvorí recenzie v tvojom štýle, v angličtine</p>
            </div>
          </div>
        </ResultCard>
      )}

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {!result && !loading && (
        <button
          onClick={generate}
          disabled={!restaurantName.trim() || !comments.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✍️ Vygenerovať recenzie
        </button>
      )}

      {loading && <LoadingSpinner label="Píšem recenzie v tvojom štýle..." />}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Hodnotenie:</span>
            <div className="flex gap-0.5">
              {STARS.map((star) => (
                <span key={star} className={`text-xl ${star <= result.starRating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
            <span className="text-sm text-gray-500">({result.starRating}/5)</span>
          </div>

          <ResultCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">G</span>
                  Google Review
                </h3>
                <button
                  onClick={() => copyToClipboard(result.googleReview, 'google')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-all"
                >
                  {copied === 'google' ? '✓ Skopírované' : '📋 Kopírovať'}
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">{result.googleReview}</p>
            </div>
          </ResultCard>

          <ResultCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">T</span>
                  TripAdvisor Review
                </h3>
                <button
                  onClick={() => copyToClipboard(result.tripAdvisorReview, 'tripadvisor')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-all"
                >
                  {copied === 'tripadvisor' ? '✓ Skopírované' : '📋 Kopírovať'}
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">{result.tripAdvisorReview}</p>
            </div>
          </ResultCard>

          <button
            onClick={() => { setResult(null); setComments(''); }}
            className="w-full py-2 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
          >
            🔄 Vygenerovať znovu s inými komentármi
          </button>
        </div>
      )}
    </div>
  );
}
