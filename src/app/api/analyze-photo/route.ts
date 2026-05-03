import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { extractJSON } from '@/lib/utils';
import type { PhotoAnalysisResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType } = body as {
      imageBase64: string;
      mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    };

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Chýba obrázok alebo typ média' }, { status: 400 });
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyzuj fotografiu jedla dôkladne. Identifikuj:
1. Presný názov jedla (po slovensky)
2. Všetky viditeľné ingrediencie s čo najpresnejším odhadovaným množstvom

Odpovedaj VÝLUČNE vo formáte JSON (bez markdown blokov):
{
  "dishName": "názov jedla po slovensky",
  "ingredients": [
    { "name": "ingrediencia po slovensky", "amount": "množstvo s jednotkou (napr. 150 g)", "note": "voliteľná poznámka" }
  ],
  "confidence": "high alebo medium alebo low",
  "notes": "voliteľné celkové poznámky k analýze"
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
    return NextResponse.json(
      { error: 'Chyba pri analýze fotografie', details: error instanceof Error ? error.message : 'Neznáma chyba' },
      { status: 500 }
    );
  }
}
