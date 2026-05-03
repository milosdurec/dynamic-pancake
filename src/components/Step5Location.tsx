'use client';

import { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ResultCard from './ui/ResultCard';
import type { LocationResponse } from '@/lib/types';

interface Step5LocationProps {
  onComplete: (result: LocationResponse) => void;
  onBack: () => void;
}

export default function Step5Location({ onComplete, onBack }: Step5LocationProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LocationResponse | null>(null);

  function getLocation() {
    if (!navigator.geolocation) {
      setError('Geolokácia nie je podporovaná týmto prehliadačom');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => {
        setError('Nepodarilo sa získať polohu. Skús zadať súradnice ručne.');
        setGeoLoading(false);
      }
    );
  }

  async function assess() {
    if (!restaurantName.trim()) {
      setError('Zadaj názov reštaurácie');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          latitude: lat ? parseFloat(lat) : undefined,
          longitude: lng ? parseFloat(lng) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba servera');
      }
      const data: LocationResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodarilo sa hodnotiť lokalitu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">← Späť</button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📍 Hodnotenie lokality</h2>
          <p className="text-gray-500 text-sm">Zadaj reštauráciu pre hodnotenie polohy a miesta</p>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zemepisná šírka</label>
                <input
                  type="number"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="48.1486"
                  step="0.000001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zemepisná dĺžka</label>
                <input
                  type="number"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="17.1077"
                  step="0.000001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <button
              onClick={getLocation}
              disabled={geoLoading}
              className="w-full py-2 px-4 border border-orange-200 text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-all text-sm disabled:opacity-50"
            >
              {geoLoading ? '⏳ Získavam polohu...' : '📡 Použiť moju aktuálnu polohu'}
            </button>
          </div>
        </ResultCard>
      )}

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {!result && !loading && (
        <button
          onClick={assess}
          disabled={!restaurantName.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📍 Hodnotiť lokalitu reštaurácie
        </button>
      )}

      {loading && <LoadingSpinner label="Vyhľadávam informácie o reštaurácii..." />}

      {result && (
        <ResultCard>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{result.restaurantName}</h3>
              {result.address && <p className="text-sm text-gray-500 mt-1">📍 {result.address}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {result.rating && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {result.rating}</span>
                )}
                {result.priceRange && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{result.priceRange}</span>
                )}
              </div>
            </div>

            {result.specialties && result.specialties.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-1">Špeciality:</h4>
                <div className="flex flex-wrap gap-1">
                  {result.specialties.map((s, i) => (
                    <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-700 text-sm mb-1">Hodnotenie:</h4>
              <p className="text-sm text-gray-600">{result.assessment}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 text-sm mb-1">✅ Plusy</h4>
                <ul className="space-y-1">
                  {result.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-gray-600">• {pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 text-sm mb-1">⚠️ Mínusy</h4>
                <ul className="space-y-1">
                  {result.cons.map((con, i) => (
                    <li key={i} className="text-sm text-gray-600">• {con}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-sm text-orange-800 font-medium">{result.recommendation}</p>
            </div>

            <button
              onClick={() => onComplete(result)}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Pokračovať → Písať recenzie
            </button>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
