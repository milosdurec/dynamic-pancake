import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON, reformatAsJSON } from '@/lib/utils';
import type { LocationResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JSON_SCHEMA = `{
  "restaurantName": "string",
  "address": "adresa alebo null",
  "rating": "napr. 4.3/5 alebo null",
  "priceRange": "€ alebo €€ alebo €€€",
  "specialties": ["špeciality reštaurácie"],
  "assessment": "celkové hodnotenie po slovensky (2-3 vety)",
  "pros": ["kladná stránka 1", "kladná stránka 2"],
  "cons": ["záporná stránka 1"],
  "recommendation": "záverečné odporúčanie po slovensky"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { restaurantName: string; latitude?: number; longitude?: number };

    if (!body.restaurantName) {
      return NextResponse.json({ error: 'Chýba názov reštaurácie' }, { status: 400 });
    }

    const geoHint = body.latitude && body.longitude
      ? ` na GPS súradniciach ${body.latitude}, ${body.longitude}`
      : '';

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Si expert na hodnotenie reštaurácií a lokalít. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `Zhodnoť reštauráciu "${body.restaurantName}"${geoHint}.
Na základe názvu a polohy odhadni typ reštaurácie, typické hodnotenie, cenovú kategóriu, špeciality a charakteristiky lokality.
Buď konkrétny a realistický.

Odpovedaj VÝLUČNE v tomto JSON formáte:
${JSON_SCHEMA}`,
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
    return NextResponse.json(
      { error: 'Chyba pri hodnotení lokality', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
