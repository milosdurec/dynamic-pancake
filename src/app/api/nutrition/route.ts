import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import type { NutritionResponse, NutritionRequest } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as NutritionRequest;

    if (!body.dishName || !body.ingredients?.length) {
      return NextResponse.json({ error: 'Chýba názov jedla alebo ingrediencie' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Pre jedlo "${body.dishName}" s nasledovnými ingredienciami:
${JSON.stringify(body.ingredients, null, 2)}

Vypočítaj nutričné hodnoty čo najpresnejšie na základe štandardných nutričných databáz.
Odpovedaj VÝLUČNE vo formáte JSON (bez markdown blokov):
{
  "dishName": "${body.dishName}",
  "servingSize": "odhadovaná veľkosť porcie v gramoch",
  "table": [
    { "nutrient": "Kalórie", "per100g": "hodnota kcal", "perServing": "hodnota kcal" },
    { "nutrient": "Bielkoviny", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "Sacharidy", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "z toho cukry", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "Tuky", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "z toho nasýtené", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "Vláknina", "per100g": "hodnota g", "perServing": "hodnota g" },
    { "nutrient": "Sodík", "per100g": "hodnota mg", "perServing": "hodnota mg" }
  ]
}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<NutritionResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[nutrition] error:', error);
    return NextResponse.json(
      { error: 'Chyba pri výpočte nutričných hodnôt', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
