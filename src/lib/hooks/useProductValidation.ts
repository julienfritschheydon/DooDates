import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ValidationRule<T> {
  field: keyof T;
  schema: z.ZodSchema;
  message?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

interface UseProductValidationOptions<T> {
  rules: ValidationRule<T>[];
  onValidationError?: (errors: Record<string, string>) => void;
  onValidationWarning?: (warnings: Record<string, string>) => void;
}

export const useProductValidation = <T extends Record<string, any>>(
  options: UseProductValidationOptions<T>
) => {
  const { rules, onValidationError, onValidationWarning } = options;
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  
  const { toast } = useToast();

  const validate = useCallback(async (data: T): Promise<ValidationResult> => {
    setIsValidating(true);
    
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    try {
      // Valider chaque champ selon les règles
      for (const rule of rules) {
        const fieldName = String(rule.field);
        const fieldValue = data[rule.field];

        try {
          const result = rule.schema.safeParse(fieldValue);
          
          if (!result.success) {
            errors[fieldName] = rule.message || result.error.issues[0]?.message || 'Champ invalide';
          }
        } catch (err) {
          errors[fieldName] = rule.message || 'Erreur de validation';
        }
      }

      const validationResult: ValidationResult = {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
      };

      setLastValidation(validationResult);

      // Notifier les callbacks
      if (Object.keys(errors).length > 0) {
        onValidationError?.(errors);
        
        toast({
          title: 'Erreur de validation',
          description: `${Object.keys(errors).length} champ(s) invalide(s)`,
          variant: 'destructive',
        });
      }

      if (Object.keys(warnings).length > 0) {
        onValidationWarning?.(warnings);
        
        toast({
          title: 'Avertissement',
          description: `${Object.keys(warnings).length} avertissement(s)`,
        });
      }

      return validationResult;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de validation inconnue');
      
      logger.error('Erreur lors de la validation', { data, error });
      
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la validation',
        variant: 'destructive',
      });

      const errorResult: ValidationResult = {
        isValid: false,
        errors: { general: error.message },
        warnings,
      };

      setLastValidation(errorResult);
      return errorResult;

    } finally {
      setIsValidating(false);
    }
  }, [rules, onValidationError, onValidationWarning, toast]);

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;

    try {
      const result = rule.schema.safeParse(value);
      return result.success ? null : (rule.message || result.error.issues[0]?.message || 'Champ invalide');
    } catch (err) {
      return rule.message || 'Erreur de validation';
    }
  }, [rules]);

  const clearValidation = useCallback(() => {
    setLastValidation(null);
  }, []);

  return {
    validate,
    validateField,
    isValidating,
    lastValidation,
    clearValidation,
  };
};

// Schémas de validation communs
export const commonValidationSchemas = {
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-Z0-9\s\-_àâäéèêëïîôöùûüÿç]+$/, 'Le titre contient des caractères non valides'),
  
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  
  slug: z.string()
    .min(1, 'Le slug est requis')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9\-]+$/, 'Le slug ne doit contenir que des lettres minuscules, des chiffres et des tirets'),
  
  email: z.string()
    .email('L\'email n\'est pas valide'),
  
  url: z.string()
    .url('L\'URL n\'est pas valide')
    .optional(),
  
  date: z.string()
    .datetime('La date n\'est pas valide'),
  
  positiveNumber: z.number()
    .positive('Le nombre doit être positif'),
  
  nonEmptyArray: z.array(z.any())
    .min(1, 'Au moins un élément est requis'),
};
