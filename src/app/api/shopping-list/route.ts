import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import { validateText, validatePeople, sanitizeText, clientError } from '@/lib/validate';
import type { ShoppingListResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { dishName: unknown; ingredients: unknown; people: unknown };

    const errName = validateText(body.dishName, 'názov jedla', 200);
    if (errName) return NextResponse.json(clientError(errName), { status: 400 });

    const errPeople = validatePeople(body.people);
    if (errPeople) return NextResponse.json(clientError(errPeople), { status: 400 });

    const dishName = sanitizeText(String(body.dishName));
    const people = Number(body.people);
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.slice(0, 30).map((i) => ({
          name: sanitizeText(String((i as { name?: unknown }).name ?? '')),
          amount: sanitizeText(String((i as { amount?: unknown }).amount ?? '')),
        }))
      : [];

    const ingredientsPart = ingredients.length
      ? `Ingrediencie receptu (1 porcia):\n${JSON.stringify(ingredients)}\n\n`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Si kulinársky expert. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `${ingredientsPart}Vytvor nákupný zoznam na prípravu jedla [${dishName}] pre ${people} osôb.
Zaokrúhli na bežné balenia (napr. 500g nie 437g). Zoskup podľa kategórie.

JSON formát:
{"dishName":"...","people":${people},"items":[{"name":"...","amount":"...","unit":"g|kg|ml|l|ks","category":"mäso|zelenina|mliečne výrobky|koreniny|obilniny|ostatné"}],"estimatedCost":"cca X €"}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<ShoppingListResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[shopping-list] error:', error);
    return NextResponse.json(clientError('Chyba pri generovaní nákupného zoznamu'), { status: 500 });
  }
}
