import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON, reformatAsJSON } from '@/lib/utils';
import { validateText, validateCoords, sanitizeText, clientError } from '@/lib/validate';
import type { LocationResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JSON_SCHEMA = `{
  "restaurantName": "string",
  "address": "adresa alebo null",
  "rating": "napr. 4.3/5 alebo null",
  "priceRange": "€ alebo €€ alebo €€€",
  "specialties": ["špeciality"],
  "assessment": "hodnotenie po slovensky (2-3 vety)",
  "pros": ["kladná stránka"],
  "cons": ["záporná stránka"],
  "recommendation": "záverečné odporúčanie po slovensky"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { restaurantName: unknown; latitude?: unknown; longitude?: unknown };

    const errName = validateText(body.restaurantName, 'názov reštaurácie', 200);
    if (errName) return NextResponse.json(clientError(errName), { status: 400 });

    const errCoords = validateCoords(body.latitude, body.longitude);
    if (errCoords) return NextResponse.json(clientError(errCoords), { status: 400 });

    const restaurantName = sanitizeText(String(body.restaurantName));
    const lat = body.latitude !== undefined ? Number(body.latitude).toFixed(6) : null;
    const lng = body.longitude !== undefined ? Number(body.longitude).toFixed(6) : null;
    const geoHint = lat && lng ? ` na súradniciach ${lat}, ${lng}` : '';

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Si expert na hodnotenie reštaurácií. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `Zhodnoť reštauráciu s názvom: [${restaurantName}]${geoHint}.
Odhadni typ, hodnotenie, cenovú kategóriu, špeciality a charakteristiku polohy. Buď konkrétny.

JSON formát:\n${JSON_SCHEMA}`,
        },
      ],
    });

    const block = res.content.find((b) => b.type === 'text');
    const rawText = (block as { type: 'text'; text: string } | undefined)?.text ?? '';

    let result: LocationResponse;
    try {
      result = extractJSON<LocationResponse>(rawText);
    } catch {
      const reformatted = await reformatAsJSON(anthropic, rawText, JSON_SCHEMA);
      result = extractJSON<LocationResponse>(reformatted);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[location] error:', error);
    return NextResponse.json(clientError('Chyba pri hodnotení lokality'), { status: 500 });
  }
}
