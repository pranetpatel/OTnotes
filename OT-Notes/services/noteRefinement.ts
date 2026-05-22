type RefinementContext = {
  studentName: string | null;
  goalSelections: {
    goal1: string[];
    goal2Primary: string[];
    goal2Coordination: string[];
    goal3: string[];
  };
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

  const promptPayload = {
    student: context.studentName ?? 'Unknown student',
    goals: context.goalSelections,
    rawTranscription: cleanNote,
    formattingRules: [
      'Return only the refined note text.',
      'No bullet points.',
      'Use professional OT language.',
      'Keep it brief and chart-ready.',
      'Remove filler words and stutters (for example: uh, um, repeated fragments).',
      'Consolidate repeated words/phrases into one clean mention unless repetition changes clinical meaning.',
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You rewrite OT session dictation into concise, professional clinical notes. Keep facts unchanged. Do not invent observations. Keep one short paragraph with clear, objective language. Clean up stutters and duplicate phrase repetition.',
        },
        {
          role: 'user',
          content: JSON.stringify(promptPayload),
        },
      ],
    }),
  });

  if (!response.ok) {
    let message = `OpenAI refinement failed (${response.status}).`;
    try {
      const body = await response.json();
      const apiMessage = body?.error?.message;
      if (apiMessage) message = `OpenAI refinement failed: ${apiMessage}`;
    } catch {
      // Ignore parse errors and keep generic message.
    }
    throw new Error(message);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content?.trim?.() ?? '';

  if (!text) {
    throw new Error('OpenAI returned an empty refinement.');
  }

  return text;
}
