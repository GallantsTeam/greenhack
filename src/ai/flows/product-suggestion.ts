'use server';

/**
 * @fileOverview An AI agent that suggests products based on browsing history.
 *
 * - productSuggestion - A function that handles the product suggestion process.
 * - ProductSuggestionInput - The input type for the productSuggestion function.
 * - ProductSuggestionOutput - The return type for the productSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSuggestionInputSchema = z.object({
  browsingHistory: z
    .string()
    .describe('The user browsing history, as a comma separated list of product names or descriptions.'),
});
export type ProductSuggestionInput = z.infer<typeof ProductSuggestionInputSchema>;

const ProductSuggestionOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of product suggestions based on the browsing history.'),
});
export type ProductSuggestionOutput = z.infer<typeof ProductSuggestionOutputSchema>;

export async function productSuggestion(input: ProductSuggestionInput): Promise<ProductSuggestionOutput> {
  return productSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productSuggestionPrompt',
  input: {schema: ProductSuggestionInputSchema},
  output: {schema: ProductSuggestionOutputSchema},
  prompt: `You are a helpful shopping assistant. Based on the user's browsing history, suggest products that they might be interested in.  Return the suggestions as a JSON array.

Browsing History: {{{browsingHistory}}}`,
});

const productSuggestionFlow = ai.defineFlow(
  {
    name: 'productSuggestionFlow',
    inputSchema: ProductSuggestionInputSchema,
    outputSchema: ProductSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
