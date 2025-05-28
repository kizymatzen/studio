// Story Assignment: Implemented Genkit flow to suggest relevant educational stories based on logged behaviors and emotions.

'use server';

/**
 * @fileOverview AI-powered story selection for children's app.
 *
 * - selectStory - A function that suggests an educational story based on child's behavior logs.
 * - SelectStoryInput - The input type for the selectStory function.
 * - SelectStoryOutput - The return type for the selectStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectStoryInputSchema = z.object({
  behaviorLog: z.string().describe('A log of the child’s behavior, emotions, and triggers.'),
});
export type SelectStoryInput = z.infer<typeof SelectStoryInputSchema>;

const SelectStoryOutputSchema = z.object({
  storyTitle: z.string().describe('The title of the suggested educational story.'),
  storySummary: z.string().describe('A brief summary of the suggested story.'),
  suitabilityReason: z.string().describe('The reason why this story is suitable based on the behavior log.'),
});
export type SelectStoryOutput = z.infer<typeof SelectStoryOutputSchema>;

export async function selectStory(input: SelectStoryInput): Promise<SelectStoryOutput> {
  return selectStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectStoryPrompt',
  input: {schema: SelectStoryInputSchema},
  output: {schema: SelectStoryOutputSchema},
  prompt: `Based on the following behavior log, suggest an educational story that could help the child develop social and emotional skills.\n\nBehavior Log: {{{behaviorLog}}}\n\nConsider the child's emotions, triggers, and any resolutions that were attempted. The story should be relevant to the situation and offer a positive learning experience.\n\nOutput the story title, a brief summary, and a reason why the story is suitable for this specific situation.`,
});

const selectStoryFlow = ai.defineFlow(
  {
    name: 'selectStoryFlow',
    inputSchema: SelectStoryInputSchema,
    outputSchema: SelectStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
