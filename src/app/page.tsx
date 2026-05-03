'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ScanLine, BarChart3, BookOpen, ShoppingCart,
  MapPin, Star, Copy, Check, ChevronDown, ChevronUp,
  ExternalLink, Printer, RefreshCw,
} from 'lucide-react';
import PhotoCapture from '@/components/PhotoCapture';
import Panel from '@/components/ui/Panel';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonList, SkeletonTable, SkeletonText } from '@/components/ui/Skeleton';
import type {
  PhotoAnalysisResponse, NutritionResponse, RecipeResponse,
  ShoppingListResponse, LocationResponse, ReviewsResponse,
} from '@/lib/types';

type AsyncState<T> = { status: 'idle' | 'loading' | 'done' | 'error'; data?: T; error?: string };
function idle<T>(): AsyncState<T> { return { status: 'idle' }; }
function loading<T>(): AsyncState<T> { return { status: 'loading' }; }
function done<T>(data: T): AsyncState<T> { return { status: 'done', data }; }
function failed<T>(error: string): AsyncState<T> { return { status: 'error', error }; }

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('image/jpeg');

  const [analysis, setAnalysis] = useState<AsyncState<PhotoAnalysisResponse>>(idle());
  const [nutrition, setNutrition] = useState<AsyncState<NutritionResponse>>(idle());
  const [recipe, setRecipe] = useState<AsyncState<RecipeResponse>>(idle());
  const [shopping, setShopping] = useState<AsyncState<ShoppingListResponse>>(idle());
  const [location, setLocation] = useState<AsyncState<LocationResponse>>(idle());
  const [reviews, setReviews] = useState<AsyncState<ReviewsResponse>>(idle());

  const [restaurantName, setRestaurantName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [userComments, setUserComments] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [copied, setCopied] = useState<'google' | 'tripadvisor' | null>(null);

  // collapsed state for sections
  const [recipeOpen, setRecipeOpen] = useState(true);
  const [shoppingOpen, setShoppingOpen] = useState(true);

  const analyzePhoto = useCallback(async (base64: string, mt: string) => {
    setAnalysis(loading());
    setNutrition(idle());
    setRecipe(idle());
    setShopping(idle());
    try {
      const data = await post<PhotoAnalysisResponse>('/api/analyze-photo', {
        imageBase64: base64,
        mediaType: mt,
      });
      setAnalysis(done(data));
    } catch (e) {
      setAnalysis(failed(e instanceof Error ? e.message : 'Chyba analýzy'));
    }
  }, []);

  // auto-trigger nutrition + recipe when analysis is done
  useEffect(() => {
    if (analysis.status !== 'done' || !analysis.data) return;
    const { dishName, ingredients } = analysis.data;

    setNutrition(loading());
    post<NutritionResponse>('/api/nutrition', { dishName, ingredients })
      .then((d) => setNutrition(done(d)))
      .catch((e) => setNutrition(failed(e.message)));

    setRecipe(loading());
    post<RecipeResponse>('/api/recipe', { dishName })
      .then((d) => setRecipe(done(d)))
      .catch((e) => setRecipe(failed(e.message)));
  }, [analysis]);

  // auto-trigger shopping list when recipe is done
  useEffect(() => {
    if (recipe.status !== 'done' || !recipe.data?.dishName) return;
    setShopping(loading());
    post<ShoppingListResponse>('/api/shopping-list', {
      dishName: recipe.data.dishName,
      ingredients: recipe.data.ingredients ?? [],
      people: 5,
    })
      .then((d) => setShopping(done(d)))
      .catch((e) => setShopping(failed(e.message)));
  }, [recipe]);

  function onImage(base64: string, mt: string) {
    setPreview(base64);
    setMediaType(mt);
    analyzePhoto(base64, mt);
  }

  function onClear() {
    setPreview(null);
    setAnalysis(idle());
    setNutrition(idle());
    setRecipe(idle());
    setShopping(idle());
  }

  async function assessLocation() {
    if (!restaurantName.trim()) return;
    setLocation(loading());
    try {
      const data = await post<LocationResponse>('/api/location', {
        restaurantName: restaurantName.trim(),
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
      });
      setLocation(done(data));
    } catch (e) {
      setLocation(failed(e instanceof Error ? e.message : 'Chyba lokality'));
    }
  }

  async function generateReviews() {
    if (!restaurantName.trim() || !userComments.trim()) return;
    setReviews(loading());
    try {
      const data = await post<ReviewsResponse>('/api/reviews', {
        restaurantName: restaurantName.trim(),
        userComments: userComments.trim(),
        dishName: analysis.data?.dishName,
      });
      setReviews(done(data));
    } catch (e) {
      setReviews(failed(e instanceof Error ? e.message : 'Chyba recenzií'));
    }
  }

  function getGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setGeoLoading(false); },
      () => setGeoLoading(false)
    );
  }

  async function copyText(text: string, type: 'google' | 'tripadvisor') {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const foodReady = analysis.status === 'done';

  return (
    <div className="min-h-screen bg-stone-100">
      {/* header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <ScanLine size={16} className="text-white" />
            </div>
            <span className="font-bold text-stone-800 tracking-tight">Dynamic Pancake</span>
          </div>
          <span className="text-xs text-stone-400 hidden sm:block">AI analýza jedla · recepty · recenzie</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── PHOTO + INGREDIENTS ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Photo */}
          <Panel icon={ScanLine} title="Fotografia jedla" subtitle="Odfot alebo nahraj">
            <div className="space-y-4">
              <PhotoCapture
                onImage={onImage}
                preview={preview}
                onClear={onClear}
                disabled={analysis.status === 'loading'}
              />
              {analysis.status === 'loading' && (
                <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl">
                  <RefreshCw size={15} className="text-orange-400 spin flex-shrink-0" />
                  <span className="text-sm text-orange-700">Analyzujem jedlo...</span>
                </div>
              )}
              {analysis.status === 'error' && (
                <div className="px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600">{analysis.error}</div>
              )}
            </div>
          </Panel>

          {/* Ingredients */}
          <Panel
            icon={ScanLine}
            title="Identifikované ingrediencie"
            subtitle={analysis.data?.dishName}
            status={analysis.status as 'idle' | 'loading' | 'done' | 'error'}
            action={analysis.status !== 'idle' ? <StatusBadge status={analysis.status as 'idle' | 'loading' | 'done' | 'error'} /> : undefined}
          >
            {analysis.status === 'idle' && (
              <p className="text-sm text-stone-400 text-center py-6">Nahraj fotografiu jedla</p>
            )}
            {analysis.status === 'loading' && <SkeletonList rows={6} />}
            {analysis.status === 'error' && (
              <p className="text-sm text-red-500">{analysis.error}</p>
            )}
            {analysis.status === 'done' && analysis.data && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-stone-800">{analysis.data.dishName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${analysis.data.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : ''}
                    ${analysis.data.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : ''}
                    ${analysis.data.confidence === 'low' ? 'bg-red-100 text-red-600' : ''}
                  `}>
                    {analysis.data.confidence === 'high' ? 'Vysoká istota' : analysis.data.confidence === 'medium' ? 'Stredná istota' : 'Nízka istota'}
                  </span>
                </div>
                <ul className="divide-y divide-stone-100">
                  {analysis.data.ingredients.map((ing, i) => (
                    <li key={i} className="flex justify-between items-center py-2 text-sm">
                      <span className="text-stone-700">{ing.name}</span>
                      <span className="text-stone-400 font-mono text-xs">{ing.amount}</span>
                    </li>
                  ))}
                </ul>
                {analysis.data.notes && (
                  <p className="text-xs text-stone-400 pt-1 italic">{analysis.data.notes}</p>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* ── NUTRITION ──────────────────────────────────────── */}
        <Panel
          icon={BarChart3}
          title="Nutričné hodnoty"
          subtitle={nutrition.data ? `Porcia: ${nutrition.data.servingSize}` : undefined}
          status={foodReady || nutrition.status !== 'idle' ? nutrition.status as 'idle' | 'loading' | 'done' | 'error' : 'idle'}
          action={nutrition.status !== 'idle' ? <StatusBadge status={nutrition.status as 'idle' | 'loading' | 'done' | 'error'} /> : undefined}
        >
          {nutrition.status === 'idle' && (
            <p className="text-sm text-stone-400 text-center py-4">Spustí sa automaticky po analýze</p>
          )}
          {nutrition.status === 'loading' && <SkeletonTable rows={8} />}
          {nutrition.status === 'error' && <p className="text-sm text-red-500">{nutrition.error}</p>}
          {nutrition.status === 'done' && nutrition.data && (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-stone-200">
                    <th className="text-left py-2 px-1 font-semibold text-stone-600 text-xs uppercase tracking-wide">Živina</th>
                    <th className="text-right py-2 px-1 font-semibold text-stone-400 text-xs uppercase tracking-wide">/ 100 g</th>
                    <th className="text-right py-2 px-1 font-semibold text-orange-500 text-xs uppercase tracking-wide">/ porcia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {nutrition.data.table.map((row, i) => (
                    <tr key={i} className={row.nutrient === 'Kalórie' ? 'bg-orange-50/60' : ''}>
                      <td className="py-2.5 px-1 text-stone-700 font-medium">{row.nutrient}</td>
                      <td className="py-2.5 px-1 text-right text-stone-400 font-mono text-xs">{row.per100g}</td>
                      <td className="py-2.5 px-1 text-right text-stone-800 font-mono font-semibold">{row.perServing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* ── RECIPE + SHOPPING ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recipe */}
          <Panel
            icon={BookOpen}
            title="Najlepší recept"
            status={recipe.status as 'idle' | 'loading' | 'done' | 'error'}
            action={
              <div className="flex items-center gap-2">
                {recipe.status !== 'idle' && <StatusBadge status={recipe.status as 'idle' | 'loading' | 'done' | 'error'} />}
                {recipe.status === 'done' && (
                  <button onClick={() => setRecipeOpen((v) => !v)} className="text-stone-400 hover:text-stone-600 transition-colors">
                    {recipeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            }
          >
            {recipe.status === 'idle' && (
              <p className="text-sm text-stone-400 text-center py-4">Spustí sa automaticky po analýze</p>
            )}
            {recipe.status === 'loading' && <SkeletonText lines={5} />}
            {recipe.status === 'error' && <p className="text-sm text-red-500">{recipe.error}</p>}
            {recipe.status === 'done' && recipe.data && recipeOpen && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-stone-800">{recipe.data.dishName}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recipe.data.rating && (
                      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                        <Star size={11} fill="currentColor" />
                        {recipe.data.rating}
                      </span>
                    )}
                    {recipe.data.prepTime && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">Príprava: {recipe.data.prepTime}</span>
                    )}
                    {recipe.data.cookTime && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">Varenie: {recipe.data.cookTime}</span>
                    )}
                  </div>
                  {recipe.data.source && (
                    <a
                      href={recipe.data.source.startsWith('http') ? recipe.data.source : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 mt-2 transition-colors"
                    >
                      <ExternalLink size={11} />
                      {recipe.data.source.length > 50 ? recipe.data.source.slice(0, 50) + '…' : recipe.data.source}
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Ingrediencie (1 porcia)</p>
                  <ul className="divide-y divide-stone-100">
                    {recipe.data.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between py-1.5 text-sm">
                        <span className="text-stone-700">{ing.name}</span>
                        <span className="text-stone-400 font-mono text-xs">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Postup</p>
                  <ol className="space-y-2">
                    {recipe.data.steps.map((s) => (
                      <li key={s.stepNumber} className="flex gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {s.stepNumber}
                        </span>
                        <span className="text-stone-600 leading-relaxed">{s.instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </Panel>

          {/* Shopping list */}
          <Panel
            icon={ShoppingCart}
            title="Nákupný zoznam"
            subtitle="pre 5 osôb"
            status={shopping.status as 'idle' | 'loading' | 'done' | 'error'}
            action={
              <div className="flex items-center gap-2">
                {shopping.status !== 'idle' && <StatusBadge status={shopping.status as 'idle' | 'loading' | 'done' | 'error'} />}
                {shopping.status === 'done' && (
                  <>
                    <button onClick={() => window.print()} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                      <Printer size={14} />
                    </button>
                    <button onClick={() => setShoppingOpen((v) => !v)} className="text-stone-400 hover:text-stone-600 transition-colors">
                      {shoppingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </>
                )}
              </div>
            }
          >
            {shopping.status === 'idle' && (
              <p className="text-sm text-stone-400 text-center py-4">Vygeneruje sa po nájdení receptu</p>
            )}
            {shopping.status === 'loading' && <SkeletonList rows={7} />}
            {shopping.status === 'error' && <p className="text-sm text-red-500">{shopping.error}</p>}
            {shopping.status === 'done' && shopping.data && shoppingOpen && (
              <div className="space-y-4">
                {(() => {
                  const grouped = shopping.data.items.reduce<Record<string, typeof shopping.data.items>>((acc, item) => {
                    const cat = item.category || 'ostatné';
                    (acc[cat] = acc[cat] || []).push(item);
                    return acc;
                  }, {});
                  const catIcons: Record<string, string> = { mäso: 'M', zelenina: 'Z', 'mliečne výrobky': 'ML', koreniny: 'K', obilniny: 'O', ostatné: '·' };
                  return Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                        {catIcons[cat] && <span className="mr-1.5 text-orange-400">{catIcons[cat]}</span>}
                        {cat}
                      </p>
                      <ul className="divide-y divide-stone-100">
                        {items.map((item, i) => (
                          <li key={i} className="flex justify-between py-1.5 text-sm">
                            <span className="text-stone-700">{item.name}</span>
                            <span className="text-stone-400 font-mono text-xs">{item.amount} {item.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
                {shopping.data.estimatedCost && (
                  <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                    <span className="text-sm font-semibold text-stone-700">Odhadované náklady</span>
                    <span className="font-bold text-orange-500">{shopping.data.estimatedCost}</span>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* ── RESTAURANT ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Location */}
          <Panel
            icon={MapPin}
            title="Hodnotenie reštaurácie"
            status={location.status as 'idle' | 'loading' | 'done' | 'error'}
            action={location.status !== 'idle' ? <StatusBadge status={location.status as 'idle' | 'loading' | 'done' | 'error'} /> : undefined}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Názov reštaurácie
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="napr. Reštaurácia U Jozefa"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-stone-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Zem. šírka</label>
                  <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="48.1486" step="0.000001"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Zem. dĺžka</label>
                  <input type="number" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="17.1077" step="0.000001"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-stone-50" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={getGeo} disabled={geoLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-600 hover:border-orange-300 hover:text-orange-600 transition-colors disabled:opacity-50 bg-white">
                  <MapPin size={14} className={geoLoading ? 'spin' : ''} />
                  {geoLoading ? 'Získavam...' : 'Moja poloha'}
                </button>
                <button onClick={assessLocation} disabled={!restaurantName.trim() || location.status === 'loading'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Hodnotiť
                </button>
              </div>

              {location.status === 'error' && <p className="text-sm text-red-500">{location.error}</p>}
              {location.status === 'done' && location.data && (
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex flex-wrap gap-2">
                    {location.data.rating && (
                      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                        <Star size={11} fill="currentColor" />{location.data.rating}
                      </span>
                    )}
                    {location.data.priceRange && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">{location.data.priceRange}</span>
                    )}
                  </div>
                  {location.data.address && <p className="text-xs text-stone-500">{location.data.address}</p>}
                  <p className="text-sm text-stone-700 leading-relaxed">{location.data.assessment}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Plusy</p>
                      <ul className="space-y-1">{location.data.pros.map((p, i) => (
                        <li key={i} className="text-xs text-stone-600">+ {p}</li>
                      ))}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1">Mínusy</p>
                      <ul className="space-y-1">{location.data.cons.map((c, i) => (
                        <li key={i} className="text-xs text-stone-600">− {c}</li>
                      ))}</ul>
                    </div>
                  </div>
                  <p className="text-xs bg-orange-50 text-orange-700 px-3 py-2 rounded-xl">{location.data.recommendation}</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Reviews */}
          <Panel
            icon={Star}
            title="Recenzie"
            subtitle="Google · TripAdvisor · anglicky"
            status={reviews.status as 'idle' | 'loading' | 'done' | 'error'}
            action={reviews.status !== 'idle' ? <StatusBadge status={reviews.status as 'idle' | 'loading' | 'done' | 'error'} /> : undefined}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Tvoje dojmy a komentáre
                </label>
                <textarea
                  value={userComments}
                  onChange={(e) => setUserComments(e.target.value)}
                  placeholder="Opíš zážitok — jedlo, obsluha, atmosféra... (po slovensky alebo anglicky)"
                  rows={4}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-stone-50"
                />
              </div>
              <button
                onClick={generateReviews}
                disabled={!restaurantName.trim() || !userComments.trim() || reviews.status === 'loading'}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Vygenerovať recenzie
              </button>

              {reviews.status === 'loading' && <SkeletonText lines={4} />}
              {reviews.status === 'error' && <p className="text-sm text-red-500">{reviews.error}</p>}
              {reviews.status === 'done' && reviews.data && (
                <div className="space-y-3">
                  {/* Star rating */}
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={16} className={s <= reviews.data!.starRating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'} />
                    ))}
                    <span className="text-xs text-stone-400 ml-1">{reviews.data.starRating}/5</span>
                  </div>

                  {/* Google */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs font-black">G</span>
                        </div>
                        <span className="text-xs font-semibold text-stone-600">Google Review</span>
                      </div>
                      <button onClick={() => copyText(reviews.data!.googleReview, 'google')}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                        {copied === 'google' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        {copied === 'google' ? 'Skopírované' : 'Kopírovať'}
                      </button>
                    </div>
                    <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">{reviews.data.googleReview}</p>
                  </div>

                  {/* TripAdvisor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center">
                          <span className="text-white text-xs font-black">T</span>
                        </div>
                        <span className="text-xs font-semibold text-stone-600">TripAdvisor Review</span>
                      </div>
                      <button onClick={() => copyText(reviews.data!.tripAdvisorReview, 'tripadvisor')}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                        {copied === 'tripadvisor' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        {copied === 'tripadvisor' ? 'Skopírované' : 'Kopírovať'}
                      </button>
                    </div>
                    <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">{reviews.data.tripAdvisorReview}</p>
                  </div>

                  <button onClick={() => { setReviews(idle()); setUserComments(''); }}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1">
                    <RefreshCw size={12} />
                    Vygenerovať znovu
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </main>

      <footer className="text-center text-xs text-stone-400 py-8">
        Powered by Claude AI
      </footer>
    </div>
  );
}
