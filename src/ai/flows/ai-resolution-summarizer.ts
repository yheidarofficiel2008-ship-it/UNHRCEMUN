'use server';
/**
 * @fileOverview An AI agent for summarizing delegate resolution proposals and extracting key points.
 *
 * - aiResolutionSummarizer - A function that handles the resolution summarization process.
 * - ResolutionSummarizerInput - The input type for the aiResolutionSummarizer function.
 * - ResolutionSummarizerOutput - The return type for the aiResolutionSummarizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResolutionSummarizerInputSchema = z
  .object({
    resolutionText: z
      .string()
      .describe('The full text of the resolution proposal to be summarized.'),
  })
  .describe('Input for the resolution summarizer AI.');
export type ResolutionSummarizerInput = z.infer<
  typeof ResolutionSummarizerInputSchema
>;

const ResolutionSummarizerOutputSchema = z
  .object({
    summary: z
      .string()
      .describe('A concise summary of the resolution proposal.'),
    keyPoints: z
      .array(z.string())
      .describe('A list of the main key points or arguments from the resolution.'),
  })
  .describe('Output from the resolution summarizer AI, containing a summary and key points.');
export type ResolutionSummarizerOutput = z.infer<
  typeof ResolutionSummarizerOutputSchema
>;

export async function aiResolutionSummarizer(
  input: ResolutionSummarizerInput
): Promise<ResolutionSummarizerOutput> {
  return aiResolutionSummarizerFlow(input);
}

const resolutionSummarizerPrompt = ai.definePrompt({
  name: 'resolutionSummarizerPrompt',
  input: {schema: ResolutionSummarizerInputSchema},
  output: {schema: ResolutionSummarizerOutputSchema},
  prompt: `En tant qu'outil d'intelligence artificielle pour le président du Comité des droits de l'homme des Nations Unies, votre tâche est de lire attentivement une proposition de résolution et d'en extraire les informations les plus importantes. Fournissez un résumé concis et une liste de points clés qui aideront le président à comprendre et à évaluer rapidement la proposition.

Contenu de la résolution :
{{{resolutionText}}}

---

Sur la base du contenu de la résolution ci-dessus, fournissez:
1. Un résumé concis.
2. Une liste des points clés ou arguments principaux.`,
});

const aiResolutionSummarizerFlow = ai.defineFlow(
  {
    name: 'aiResolutionSummarizerFlow',
    inputSchema: ResolutionSummarizerInputSchema,
    outputSchema: ResolutionSummarizerOutputSchema,
  },
  async (input) => {
    const {output} = await resolutionSummarizerPrompt(input);
    return output!;
  }
);
