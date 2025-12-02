import React from 'react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const productFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  type: z.enum(['date', 'form', 'quizz'], {
    required_error: 'Le type de produit est requis',
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  loading?: boolean;
  className?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitText = 'Créer',
  loading = false,
  className = '',
}) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: undefined,
      ...initialData,
    },
  });

  const handleSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Modifier le produit' : 'Créer un nouveau produit'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de produit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type de produit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="date">Sondage de dates</SelectItem>
                      <SelectItem value="form">Formulaire</SelectItem>
                      <SelectItem value="quizz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choisissez le type de produit que vous souhaitez créer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez le titre du produit" {...field} />
                  </FormControl>
                  <FormDescription>
                    Le titre sera visible par les participants
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnelle)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre produit en quelques mots..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Une description aide les participants à comprendre le but du produit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitText}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
