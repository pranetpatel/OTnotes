type RefinementContext = {
  studentName: string | null;
  goalSelections: {
    goal1: string[];
    goal2Primary: string[];
    goal2Coordination: string[];
    goal3: string[];
  };
};

type OpenAIResponsesOutput = {
  type: string;
  content?: Array<{ type: string; text?: string }>;
};

export async function refineNoteWithOpenAI(rawNote: string, context: RefinementContext): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY. Add it to your environment and restart Expo.');
  }

  const cleanNote = rawNote.trim();
  if (!cleanNote) {
    throw new Error('Add some note text before refining.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You rewrite OT session dictation into concise, professional clinical notes. Keep facts unchanged. Do not invent observations. Keep one short paragraph with clear, objective language.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            student: context.studentName ?? 'Unknown student',
            goals: context.goalSelections,
            rawTranscription: cleanNote,
            formattingRules: [
              'Return only the refined note text.',
              'No bullet points.',
              'Use professional OT language.',
              'Keep it brief and chart-ready.',
            ],
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI refinement failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  const outputs = (json.output ?? []) as OpenAIResponsesOutput[];
  const text = outputs
    .flatMap((entry) => entry.content ?? [])
    .filter((entry) => entry.type === 'output_text' && Boolean(entry.text))
    .map((entry) => entry.text?.trim() ?? '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('OpenAI returned an empty refinement.');
  }

  return text;
}
