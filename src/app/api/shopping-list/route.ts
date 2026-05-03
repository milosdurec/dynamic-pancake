import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import type { ShoppingListResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { dishName: string; ingredients: { name: string; amount: string }[]; people: number };

    if (!body.dishName) {
      return NextResponse.json({ error: 'Chýba názov jedla' }, { status: 400 });
    }

    const people = body.people ?? 5;
    const ingredientsPart = body.ingredients?.length
      ? `Na základe týchto ingrediencií (1 porcia):\n${JSON.stringify(body.ingredients, null, 2)}\n\n`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Si kulinársky expert. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `${ingredientsPart}Vytvor kompletný nákupný zoznam na prípravu "${body.dishName}" pre ${people} ľudí.
Zaokrúhli množstvá na bežné balenia dostupné v obchode (napr. 500g nie 437g).
Zoskup položky podľa kategórie.

Odpovedaj VÝLUČNE v tomto JSON formáte:
{
  "dishName": "${body.dishName}",
  "people": ${people},
  "items": [
    {
      "name": "názov položky po slovensky",
      "amount": "množstvo ako číslo",
      "unit": "jednotka (g, kg, ml, l, ks)",
      "category": "mäso|zelenina|mliečne výrobky|koreniny|obilniny|ostatné"
    }
  ],
  "estimatedCost": "odhad celkovej ceny v EUR"
}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<ShoppingListResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[shopping-list] error:', error);
    return NextResponse.json(
      { error: 'Chyba pri generovaní nákupného zoznamu', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
