import Anthropic from '@anthropic-ai/sdk';

export function extractJSON<T>(text: string): T {
  // fenced code block
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]) as T; } catch { /* fall through */ }
  }

  // greedy outermost { … }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) as T; } catch { /* fall through */ }
  }

  throw new Error('Nepodarilo sa extrahovať JSON z odpovede');
}

/** Ask Claude to take rawText and reformat it as the given JSON schema description. */
export async function reformatAsJSON(
  client: Anthropic,
  rawText: string,
  jsonSchema: string
): Promise<string> {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'You are a JSON formatter. Output ONLY valid JSON, no markdown, no explanation.',
    messages: [
      {
        role: 'user',
        content: `Preformátuj nasledujúci text do tohto JSON schéma:\n\n${jsonSchema}\n\nText na preformátovanie:\n\n${rawText}`,
      },
    ],
  });
  const block = res.content.find((b) => b.type === 'text');
  return (block as { type: 'text'; text: string } | undefined)?.text ?? '';
}

export async function runWithWebSearch(
  client: Anthropic,
  userPrompt: string,
  maxIterations = 10
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];

  for (let i = 0; i < maxIterations; i++) {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20260209' as const, name: 'web_search' }],
      messages,
    });

    messages.push({ role: 'assistant', content: res.content });

    if (res.stop_reason === 'end_turn') {
      const block = res.content.find((b) => b.type === 'text');
      return (block as { type: 'text'; text: string } | undefined)?.text ?? '';
    }

    // server-side tool: no client tool_result needed, just loop
  }

  throw new Error('Dosiahnutý maximálny počet iterácií webového vyhľadávania');
}
