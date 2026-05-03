import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import type { ReviewsResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { restaurantName: string; userComments: string; dishName?: string };

    if (!body.restaurantName || !body.userComments) {
      return NextResponse.json({ error: 'Chýba názov reštaurácie alebo komentáre' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Na základe komentárov zákazníka o reštaurácii "${body.restaurantName}"${
            body.dishName ? ` (jedlo: ${body.dishName})` : ''
          }:

KOMENTÁRE ZÁKAZNÍKA (môžu byť po slovensky alebo anglicky):
"${body.userComments}"

Vygeneruj dve recenzie v ANGLIČTINE zachovajúc štýl a tón zákazníka:
1. Google recenzia: krátka (2-3 vety), priateľská, priama
2. TripAdvisor recenzia: dlhšia (4-6 viet), detailnejšia, opisuje zážitok

Na základe komentárov odhadni hviezdičkové hodnotenie (1-5).

Odpovedaj VÝLUČNE vo formáte JSON (bez markdown blokov):
{
  "googleReview": "recenzia pre Google v angličtine",
  "tripAdvisorReview": "recenzia pre TripAdvisor v angličtine",
  "starRating": 4
}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<ReviewsResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[reviews] error:', error);
    return NextResponse.json(
      { error: 'Chyba pri generovaní recenzií', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
