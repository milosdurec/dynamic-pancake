import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import { validateText, sanitizeText, clientError } from '@/lib/validate';
import type { NutritionResponse, NutritionRequest } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as NutritionRequest;

    const err = validateText(body.dishName, 'názov jedla', 200);
    if (err) return NextResponse.json(clientError(err), { status: 400 });
    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(clientError('Chýbajú ingrediencie'), { status: 400 });
    }

    const dishName = sanitizeText(body.dishName);
    const ingredients = body.ingredients.slice(0, 30).map((i) => ({
      name: sanitizeText(String(i.name ?? '')),
      amount: sanitizeText(String(i.amount ?? '')),
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Si nutričný expert. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `Pre jedlo "${dishName}" s ingredienciami:\n${JSON.stringify(ingredients)}\n\nVypočítaj nutričné hodnoty.\n\nJSON formát:\n{"dishName":"...","servingSize":"... g","table":[{"nutrient":"Kalórie","per100g":"... kcal","perServing":"... kcal"},{"nutrient":"Bielkoviny","per100g":"... g","perServing":"... g"},{"nutrient":"Sacharidy","per100g":"... g","perServing":"... g"},{"nutrient":"z toho cukry","per100g":"... g","perServing":"... g"},{"nutrient":"Tuky","per100g":"... g","perServing":"... g"},{"nutrient":"z toho nasýtené","per100g":"... g","perServing":"... g"},{"nutrient":"Vláknina","per100g":"... g","perServing":"... g"},{"nutrient":"Sodík","per100g":"... mg","perServing":"... mg"}]}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<NutritionResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[nutrition] error:', error);
    return NextResponse.json(clientError('Chyba pri výpočte nutričných hodnôt'), { status: 500 });
  }
}
