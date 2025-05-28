'use server';

/**
 * @fileOverview This file defines a Genkit flow for selecting relevant puppet-based activities based on a child's logged behaviors and emotions.
 *
 * The flow takes a description of the child's behavior and emotion as input and returns a list of suggested activities.
 *
 * @module src/ai/flows/select-activity
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectActivityInputSchema = z.object({
  behaviorLog: z
    .string()
    .describe(
      'A detailed log of the childs behavior, including their emotions and triggers.'
    ),
});
export type SelectActivityInput = z.infer<typeof SelectActivityInputSchema>;

const SelectActivityOutputSchema = z.object({
  suggestedActivities: z
    .array(z.string())
    .describe(
      'A list of puppet-based activity suggestions to help the child regulate their emotions.'
    ),
});
export type SelectActivityOutput = z.infer<typeof SelectActivityOutputSchema>;

export async function selectActivity(input: SelectActivityInput): Promise<SelectActivityOutput> {
  return selectActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectActivityPrompt',
  input: {schema: SelectActivityInputSchema},
  output: {schema: SelectActivityOutputSchema},
  prompt: `Based on the following behavior log, suggest three puppet-based activities that would help the child regulate their emotions:

Behavior Log:
{{{behaviorLog}}}

Respond with a JSON object containing a "suggestedActivities" field that is an array of strings. Each string should be a short name/description of the activity.
`,
});

const selectActivityFlow = ai.defineFlow(
  {
    name: 'selectActivityFlow',
    inputSchema: SelectActivityInputSchema,
    outputSchema: SelectActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
