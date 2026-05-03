import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON, reformatAsJSON } from '@/lib/utils';
import { validateText, sanitizeText, clientError } from '@/lib/validate';
import type { RecipeResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JSON_SCHEMA = `{
  "dishName": "string",
  "source": "URL zdroja",
  "rating": "napr. 4.8/5",
  "prepTime": "napr. 15 min",
  "cookTime": "napr. 30 min",
  "servings": 1,
  "ingredients": [{ "name": "ingrediencia po slovensky", "amount": "množstvo s jednotkou" }],
  "steps": [{ "stepNumber": 1, "instruction": "krok po slovensky" }]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { dishName: unknown };

    const err = validateText(body.dishName, 'názov jedla', 200);
    if (err) return NextResponse.json(clientError(err), { status: 400 });

    const dishName = sanitizeText(String(body.dishName));

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Si kulinársky expert. Odpovedaj VÝLUČNE platným JSON bez markdown blokov ani iného textu.',
      messages: [
        {
          role: 'user',
          content: `Napíš najpopulárnejší a najlepšie hodnotený recept na jedlo s názvom: [${dishName}].
Uveď realistické URL zdroja (napr. allrecipes.com), hodnotenie, čas prípravy a varenia.
Ingrediencie a postup po slovensky. Porcia pre 1 osobu.

JSON formát:\n${JSON_SCHEMA}`,
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
    return NextResponse.json(clientError('Chyba pri hľadaní receptu'), { status: 500 });
  }
}
