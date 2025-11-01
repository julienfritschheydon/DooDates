import React, { useState } from "react";
import { Mail, Phone, Link as LinkIcon, Hash, Calendar } from "lucide-react";
import {
  type ValidationType,
  validateValue,
  getValidationMessage,
  getValidationPlaceholder,
} from "../../lib/validation";

interface StructuredInputProps {
  value: string;
  onChange: (value: string) => void;
  validationType: ValidationType;
  required?: boolean;
  placeholder?: string;
}

/**
 * Composant StructuredInput
 * Champ de saisie avec validation HTML5 pour email, phone, url, number, date
 */
export function StructuredInput({
  value,
  onChange,
  validationType,
  required = false,
  placeholder,
}: StructuredInputProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setTouched(true);
    if (value && !validateValue(value, validationType)) {
      setError(getValidationMessage(validationType));
    } else {
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Réinitialiser l'erreur si le champ devient vide
    if (!newValue) {
      setError(null);
    } else if (touched) {
      // Valider en temps réel si déjà touché
      if (!validateValue(newValue, validationType)) {
        setError(getValidationMessage(validationType));
      } else {
        setError(null);
      }
    }
  };

  const getInputType = (): string => {
    switch (validationType) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "url":
        return "url";
      case "number":
        return "number";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  const getIcon = () => {
    switch (validationType) {
      case "email":
        return <Mail className="w-5 h-5 text-gray-400" />;
      case "phone":
        return <Phone className="w-5 h-5 text-gray-400" />;
      case "url":
        return <LinkIcon className="w-5 h-5 text-gray-400" />;
      case "number":
        return <Hash className="w-5 h-5 text-gray-400" />;
      case "date":
        return <Calendar className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const defaultPlaceholder = placeholder || getValidationPlaceholder(validationType);
  const hasError = touched && error;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Icône */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {getIcon()}
        </div>

        {/* Input */}
        <input
          type={getInputType()}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={defaultPlaceholder}
          required={required}
          className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-colors ${
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-purple-500 focus:ring-purple-200"
          } focus:outline-none focus:ring-2`}
        />
      </div>

      {/* Message d'erreur */}
      {hasError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Message requis */}
      {required && !value && touched && (
        <p className="text-sm text-red-600">Ce champ est obligatoire</p>
      )}

      {/* Indicateur de validation réussie */}
      {value && !hasError && touched && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Valide
        </p>
      )}
    </div>
  );
}
