import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { formatDateLocal } from "../lib/date-utils";

interface TemporalTestResult {
  input: string;
  analysis: {
    confidence: number;
    temporalType: string;
    conflicts: string[];
    suggestions: string[];
    extractedDates: string[];
    constraints: Record<string, boolean>;
  };
  geminiResult?: {
    title: string;
    dates: string[];
    timeSlots: any[];
    type: string;
  };
  validationScore: number;
  passed: boolean;
}

const TEST_CASES = [
  "Réunion d'équipe urgente cette semaine en fin de journée",
  "Organiser un barbecue entre amis cet été",
  "Formation Excel les mardis matin pendant 6 semaines",
  "Rendez-vous médecin la semaine prochaine",
  "Call client américain entre 14h et 16h cette semaine",
  "Week-end ski entre potes fin janvier ou début février",
  "Entretiens candidats mardi 10h-12h ou jeudi 14h-16h",
];

const TemporalTestInterface: React.FC = () => {
  const [testInput, setTestInput] = useState("");
  const [results, setResults] = useState<TemporalTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("");

  // Simulation de l'analyse temporelle améliorée
  const analyzeTemporalInput = (input: string) => {
    const text = input.toLowerCase();
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    const extractedDates: string[] = [];

    // Détection des contraintes
    const constraints = {
      matin: text.includes("matin"),
      apresmidi: text.includes("après-midi"),
      soir: text.includes("soir") || text.includes("fin de journée"),
      weekend: text.includes("weekend") || text.includes("week-end"),
      semaine: text.includes("semaine") && !text.includes("weekend"),
      urgent: text.includes("urgent"),
    };

    // Vérifications counterfactual
    if (text.includes("lundi") && constraints.weekend) {
      conflicts.push('Contradiction: "lundi" demandé mais "weekend" mentionné');
    }

    if (text.includes("cette semaine")) {
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + i);
        extractedDates.push(formatDateLocal(date));
      }
    }

    // Détection du type temporel
    let temporalType = "relative";
    if (text.includes("tous les") || text.includes("chaque")) {
      temporalType = "recurring";
    } else if (constraints.matin || constraints.apresmidi || constraints.soir) {
      temporalType = "datetime";
    } else if (extractedDates.length > 0) {
      temporalType = "date";
    }

    // Calcul de confiance
    let confidence = 0.7;
    if (extractedDates.length > 0) confidence += 0.1;
    if (conflicts.length === 0) confidence += 0.1;
    if (temporalType !== "relative") confidence += 0.1;

    // Suggestions d'amélioration
    if (conflicts.length > 0) {
      suggestions.push("Résoudre les contradictions temporelles");
    }
    if (confidence < 0.8) {
      suggestions.push("Être plus précis sur les dates et heures");
    }

    return {
      confidence,
      temporalType,
      conflicts,
      suggestions,
      extractedDates,
      constraints,
    };
  };

  // Simulation de génération Gemini améliorée
  const simulateGeminiGeneration = (input: string, analysis: any) => {
    const text = input.toLowerCase();

    // Génération basée sur l'analyse
    let title = input.charAt(0).toUpperCase() + input.slice(1);
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    let dates = analysis.extractedDates;
    if (dates.length === 0) {
      // Génération par défaut
      const today = new Date();
      if (text.includes("semaine prochaine")) {
        for (let i = 1; i <= 3; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + 7 + i);
          dates.push(formatDateLocal(date));
        }
      } else {
        for (let i = 1; i <= 3; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(formatDateLocal(date));
        }
      }
    }

    const timeSlots = [];
    if (analysis.constraints.matin) {
      timeSlots.push({
        start: "09:00",
        end: "12:00",
        dates: dates,
        description: "Créneaux matinaux",
      });
    }
    if (analysis.constraints.apresmidi) {
      timeSlots.push({
        start: "14:00",
        end: "17:00",
        dates: dates,
        description: "Créneaux après-midi",
      });
    }
    if (analysis.constraints.soir) {
      timeSlots.push({
        start: "17:00",
        end: "19:00",
        dates: dates,
        description: "Créneaux fin de journée",
      });
    }

    return {
      title,
      dates,
      timeSlots,
      type: timeSlots.length > 0 ? "datetime" : "date",
    };
  };

  // Validation counterfactual
  const validateResult = (
    input: string,
    analysis: any,
    geminiResult: any,
  ): { score: number; passed: boolean } => {
    let score = 100;
    const text = input.toLowerCase();

    // Test 1: Cohérence des jours
    for (const dateStr of geminiResult.dates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();

      if (text.includes("lundi") && dayOfWeek !== 1) score -= 20;
      if (text.includes("weekend") && ![0, 6].includes(dayOfWeek)) score -= 15;
      if (analysis.constraints.semaine && [0, 6].includes(dayOfWeek))
        score -= 15;
    }

    // Test 2: Cohérence des horaires
    for (const slot of geminiResult.timeSlots) {
      const startHour = parseInt(slot.start.split(":")[0]);

      if (analysis.constraints.matin && startHour >= 12) score -= 15;
      if (analysis.constraints.apresmidi && (startHour < 12 || startHour >= 18))
        score -= 15;
      if (analysis.constraints.soir && startHour < 17) score -= 15;
    }

    // Test 3: Résolution des conflits
    score -= analysis.conflicts.length * 10;

    // Test 4: Type temporel approprié
    if (
      analysis.temporalType === "datetime" &&
      geminiResult.type !== "datetime"
    )
      score -= 10;

    return {
      score: Math.max(0, score),
      passed: score >= 70,
    };
  };

  const runSingleTest = async (input: string): Promise<TemporalTestResult> => {
    const analysis = analyzeTemporalInput(input);
    const geminiResult = simulateGeminiGeneration(input, analysis);
    const validation = validateResult(input, analysis, geminiResult);

    return {
      input,
      analysis,
      geminiResult,
      validationScore: validation.score,
      passed: validation.passed,
    };
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const testCase of TEST_CASES) {
      const result = await runSingleTest(testCase);
      setResults((prev) => [...prev, result]);
      // Petite pause pour l'effet visuel
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const runCustomTest = async () => {
    if (!testInput.trim()) return;

    setIsRunning(true);
    const result = await runSingleTest(testInput);
    setResults([result]);
    setIsRunning(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const averageScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.validationScore, 0) / results.length
      : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Tests des Améliorations Temporelles DooDates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Testez votre propre phrase temporelle..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={runCustomTest}
              disabled={isRunning || !testInput.trim()}
            >
              Tester
            </Button>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              variant="outline"
            >
              Tests Complets
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEST_CASES.map((testCase, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setTestInput(testCase)}
                className="h-auto p-2 text-left text-xs"
              >
                {testCase.length > 40
                  ? testCase.substring(0, 40) + "..."
                  : testCase}
              </Button>
            ))}
          </div>

          {results.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Score moyen:{" "}
                <span className={getScoreColor(averageScore)}>
                  {averageScore.toFixed(1)}%
                </span>
                {" • "}
                Tests réussis: {results.filter((r) => r.passed).length}/
                {results.length}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card
            key={index}
            className={`border-l-4 ${result.passed ? "border-l-green-500" : "border-l-red-500"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Test {index + 1}
                </CardTitle>
                <Badge variant={result.passed ? "default" : "destructive"}>
                  {result.validationScore}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                "{result.input}"
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Analyse temporelle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Analyse Temporelle
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      Confiance:{" "}
                      <Badge variant="outline">
                        {(result.analysis.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div>
                      Type: <Badge>{result.analysis.temporalType}</Badge>
                    </div>
                    <div>
                      Dates extraites: {result.analysis.extractedDates.length}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(result.analysis.constraints)
                        .filter(([_, value]) => value)
                        .map(([key]) => (
                          <Badge
                            key={key}
                            variant="secondary"
                            className="text-xs"
                          >
                            {key}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Résultat Gemini
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      Titre:{" "}
                      <span className="font-mono text-xs bg-gray-100 p-1 rounded">
                        {result.geminiResult?.title}
                      </span>
                    </div>
                    <div>
                      Dates: {result.geminiResult?.dates.length} générées
                    </div>
                    <div>Créneaux: {result.geminiResult?.timeSlots.length}</div>
                    <div>
                      Type: <Badge>{result.geminiResult?.type}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflits et suggestions */}
              {(result.analysis.conflicts.length > 0 ||
                result.analysis.suggestions.length > 0) && (
                <div className="space-y-2">
                  {result.analysis.conflicts.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-red-600 mb-1">
                        Conflits détectés:
                      </h5>
                      <ul className="text-xs space-y-1">
                        {result.analysis.conflicts.map((conflict, i) => (
                          <li key={i} className="text-red-600">
                            • {conflict}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.analysis.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-blue-600 mb-1">
                        Suggestions:
                      </h5>
                      <ul className="text-xs space-y-1">
                        {result.analysis.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-blue-600">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Dates générées */}
              {result.geminiResult?.dates &&
                result.geminiResult.dates.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-2">
                      Dates générées:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {result.geminiResult.dates.map((date, i) => {
                        const dayName = new Date(date).toLocaleDateString(
                          "fr-FR",
                          { weekday: "short" },
                        );
                        return (
                          <Badge key={i} variant="outline" className="text-xs">
                            {date} ({dayName})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemporalTestInterface;
