import React from "react";
import { Star, Smile, Meh, Frown } from "lucide-react";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  scale?: number; // 5 ou 10
  style?: "numbers" | "stars" | "emojis";
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
}

/**
 * Composant RatingInput
 * Échelle de notation avec 3 styles : chiffres, étoiles, emojis
 */
export function RatingInput({
  value,
  onChange,
  scale = 5,
  style = "numbers",
  minLabel,
  maxLabel,
  required = false,
}: RatingInputProps) {
  const items = Array.from({ length: scale }, (_, i) => i + 1);

  const renderNumbers = () => (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`w-12 h-12 rounded-lg font-semibold transition-all ${
            value === num
              ? "bg-purple-600 text-white scale-110 shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );

  const renderStars = () => (
    <div className="flex gap-1 justify-center">
      {items.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              value && num <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const renderEmojis = () => {
    // Pour échelle 5 : 😞 😕 😐 🙂 😄
    // Pour échelle 10 : progression plus fine
    const getEmoji = (num: number) => {
      if (scale === 5) {
        const emojis = [Frown, Meh, Meh, Smile, Smile];
        const colors = [
          "text-red-500",
          "text-orange-500",
          "text-gray-500",
          "text-green-500",
          "text-green-600",
        ];
        const Icon = emojis[num - 1];
        const color = colors[num - 1];
        return { Icon, color };
      } else {
        // Échelle 10
        const ratio = num / scale;
        if (ratio <= 0.3) return { Icon: Frown, color: "text-red-500" };
        if (ratio <= 0.5) return { Icon: Meh, color: "text-orange-500" };
        if (ratio <= 0.7) return { Icon: Meh, color: "text-gray-500" };
        return { Icon: Smile, color: "text-green-500" };
      }
    };

    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((num) => {
          const { Icon, color } = getEmoji(num);
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`p-2 rounded-lg transition-all ${
                value === num
                  ? "bg-purple-100 scale-110 shadow-md"
                  : "hover:bg-gray-100 hover:scale-105"
              }`}
            >
              <Icon className={`w-8 h-8 ${value === num ? "text-purple-600" : color}`} />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Échelle de notation */}
      <div className="py-4">
        {style === "numbers" && renderNumbers()}
        {style === "stars" && renderStars()}
        {style === "emojis" && renderEmojis()}
      </div>

      {/* Labels min/max */}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{minLabel || ""}</span>
          <span>{maxLabel || ""}</span>
        </div>
      )}

      {/* Valeur sélectionnée */}
      {value !== null && (
        <div className="text-center text-sm text-gray-500">
          Votre note :{" "}
          <span className="font-semibold text-purple-600">
            {value}/{scale}
          </span>
        </div>
      )}

      {/* Message requis */}
      {required && value === null && (
        <p className="text-sm text-red-500 text-center">Cette question est obligatoire</p>
      )}
    </div>
  );
}
