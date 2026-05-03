import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON, reformatAsJSON } from '@/lib/utils';
import type { RecipeResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JSON_SCHEMA = `{
  "dishName": "string",
  "source": "URL zdroja napr. https://www.allrecipes.com/...",
  "rating": "napr. 4.8/5",
  "prepTime": "napr. 15 min",
  "cookTime": "napr. 30 min",
  "servings": 1,
  "ingredients": [
    { "name": "ingrediencia po slovensky", "amount": "množstvo s jednotkou" }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "krok po slovensky" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { dishName: string };

    if (!body.dishName) {
      return NextResponse.json({ error: 'Chýba názov jedla' }, { status: 400 });
    }

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Si kulinársky expert. Odpovedaj VÝLUČNE platným JSON bez markdown blokov ani iného textu.',
      messages: [
        {
          role: 'user',
          content: `Napíš najpopulárnejší a najlepšie hodnotený recept na "${body.dishName}" (ako by bol na allrecipes.com alebo recepty.sk).
Uveď realistické URL zdroja (napr. https://www.allrecipes.com/recipe/...), hodnotenie, čas prípravy a varenia.
Ingrediencie a postup po slovensky. Porcia pre 1 osobu.

Odpovedaj VÝLUČNE v tomto JSON formáte:
${JSON_SCHEMA}`,
        },
      ],
    });

    const block = res.content.find((b) => b.type === 'text');
    const rawText = (block as { type: 'text'; text: string } | undefined)?.text ?? '';

    let result: RecipeResponse;
    try {
      result = extractJSON<RecipeResponse>(rawText);
    } catch {
      const reformatted = await reformatAsJSON(anthropic, rawText, JSON_SCHEMA);
      result = extractJSON<RecipeResponse>(reformatted);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[recipe] error:', error);
    return NextResponse.json(
      { error: 'Chyba pri hľadaní receptu', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
