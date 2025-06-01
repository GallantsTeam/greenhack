"use client";

import { useState, useEffect } from 'react'; // Removed useCallback because it's not used
import { productSuggestion } from '@/ai/flows/product-suggestion';
import type { ProductSuggestionInput, ProductSuggestionOutput } from '@/ai/flows/product-suggestion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AiProductSuggestionsProps {
  browsingHistory: string[];
}

export default function AiProductSuggestions({ browsingHistory }: AiProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (browsingHistory.length === 0) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const input: ProductSuggestionInput = { browsingHistory: browsingHistory.join(', ') };
        const result: ProductSuggestionOutput = await productSuggestion(input);
        setSuggestions(result.suggestions || []);
      } catch (err) {
        console.error("Error fetching AI suggestions:", err);
        setError("Failed to load suggestions. Please try again later.");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce fetching suggestions to avoid too many API calls
    const debounceTimeout = setTimeout(() => {
      fetchSuggestions();
    }, 500); // Adjust timeout as needed

    return () => clearTimeout(debounceTimeout);

  }, [browsingHistory]);

  if (browsingHistory.length === 0 && !isLoading) {
    return (
      <Card className="mt-8 bg-secondary/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center font-headline">
            <Lightbulb className="mr-2 h-5 w-5 text-accent" />
            Personalized Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View some products to get personalized suggestions here!</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-12 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center font-headline">
          <Lightbulb className="mr-2 h-6 w-6 text-accent" />
          You Might Also Like
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Generating recommendations...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-center text-destructive py-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && suggestions.length > 0 && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="min-w-[200px] max-w-[250px] shrink-0 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="font-medium text-sm truncate" title={suggestion}>{suggestion}</p>
                    <Button variant="link" size="sm" className="p-0 mt-2 h-auto text-accent">
                      View Product
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
        {!isLoading && !error && suggestions.length === 0 && browsingHistory.length > 0 && (
          <p className="text-muted-foreground py-4">No specific suggestions at the moment. Keep browsing!</p>
        )}
      </CardContent>
    </Card>
  );
}
