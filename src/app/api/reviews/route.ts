import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import { validateText, sanitizeText, clientError } from '@/lib/validate';
import type { ReviewsResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { restaurantName: unknown; userComments: unknown; dishName?: unknown };

    const errName = validateText(body.restaurantName, 'názov reštaurácie', 200);
    if (errName) return NextResponse.json(clientError(errName), { status: 400 });

    const errComments = validateText(body.userComments, 'komentáre', 2000);
    if (errComments) return NextResponse.json(clientError(errComments), { status: 400 });

    const restaurantName = sanitizeText(String(body.restaurantName));
    const userComments = sanitizeText(String(body.userComments));
    const dishName = body.dishName ? sanitizeText(String(body.dishName)).slice(0, 200) : null;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: 'Si expert na písanie recenzií. Odpovedaj VÝLUČNE platným JSON bez markdown blokov.',
      messages: [
        {
          role: 'user',
          content: `Napíš dve recenzie v ANGLIČTINE pre reštauráciu [${restaurantName}]${dishName ? ` (jedlo: [${dishName}])` : ''}.

Zákazník napísal tieto dojmy (zachovaj jeho štýl a tón):
"""
${userComments}
"""

Vygeneruj:
1. Google recenzia: krátka (2-3 vety), priateľská
2. TripAdvisor recenzia: dlhšia (4-6 viet), detailnejšia

JSON formát:
{"googleReview":"...","tripAdvisorReview":"...","starRating":4}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<ReviewsResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[reviews] error:', error);
    return NextResponse.json(clientError('Chyba pri generovaní recenzií'), { status: 500 });
  }
}
