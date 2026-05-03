import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import { validateImage, clientError } from '@/lib/validate';
import type { PhotoAnalysisResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType } = body as { imageBase64: unknown; mediaType: unknown };

    const err = validateImage(imageBase64, mediaType);
    if (err) return NextResponse.json(clientError(err), { status: 400 });

    const base64Data = (imageBase64 as string).includes(',')
      ? (imageBase64 as string).split(',')[1]
      : (imageBase64 as string);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64Data },
            },
            {
              type: 'text',
              text: `Analyzuj fotografiu jedla. Identifikuj názov jedla a všetky ingrediencie s odhadovaným množstvom.

Odpovedaj VÝLUČNE vo formáte JSON (bez markdown blokov):
{
  "dishName": "názov jedla po slovensky",
  "ingredients": [
    { "name": "ingrediencia po slovensky", "amount": "množstvo s jednotkou" }
  ],
  "confidence": "high|medium|low",
  "notes": "voliteľné poznámky"
}`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = (textBlock as { type: 'text'; text: string } | undefined)?.text ?? '';
    const result = extractJSON<PhotoAnalysisResponse>(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[analyze-photo] error:', error);
    return NextResponse.json(clientError('Chyba pri analýze fotografie'), { status: 500 });
  }
}
