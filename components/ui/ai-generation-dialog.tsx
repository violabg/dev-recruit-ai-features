"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LLMModelSelect } from "@/components/ui/llm-model-select";
import { Textarea } from "@/components/ui/textarea";
import { LLM_MODELS } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const aiGenerationSchema = z.object({
  instructions: z.string().optional(),
  llmModel: z.string(),
});

type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;

type AIGenerationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onGenerate: (data: AIGenerationFormData) => Promise<void>;
  loading?: boolean;
};

export const AIGenerationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onGenerate,
  loading = false,
}: AIGenerationDialogProps) => {
  const form = useForm<AIGenerationFormData>({
    resolver: zodResolver(aiGenerationSchema),
    defaultValues: {
      instructions: "",
      llmModel: LLM_MODELS.VERSATILE,
    },
  });

  const handleSubmit = async (data: AIGenerationFormData) => {
    try {
      await onGenerate(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Generation error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Istruzioni aggiuntive (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Inserisci istruzioni specifiche per l'AI..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Fornisci istruzioni specifiche per guidare la generazione
                    dell&apos;AI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="llmModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modello LLM</FormLabel>
                  <FormControl>
                    <LLMModelSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Seleziona il modello LLM per la generazione.
                    <strong> Versatile</strong> è raccomandato per la qualità
                    migliore.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Generazione...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Genera
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
