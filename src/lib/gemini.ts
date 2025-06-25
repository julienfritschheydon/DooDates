import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerativeModel } from '@google/generative-ai';
import CalendarQuery, { CalendarDay } from './calendar-generator';

// Configuration pour Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialisation différée pour éviter le blocage au chargement
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

// Fonction d'initialisation lazy
const initializeGemini = () => {
  if (!genAI && API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }
  return { genAI, model };
};

// Constantes pour la gestion des quotas
const RATE_LIMIT = {
  REQUESTS_PER_SECOND: 2,
  REQUESTS_PER_DAY: 960, // Quota pour le chat
};

export interface PollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[]; // Dates spécifiques auxquelles ce créneau s'applique
  }>;
  type: 'date' | 'datetime' | 'custom';
  participants?: string[];
}

export interface GeminiResponse {
  success: boolean;
  data?: PollSuggestion;
  message: string;
  error?: string;
}

export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private lastRequestTime: number = 0;
  private requestsToday: number = 0;
  private isInitialized: boolean = false;
  private calendarQuery: CalendarQuery;
  
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private constructor() {
    // Initialiser le calendrier pré-généré
    this.calendarQuery = new CalendarQuery();
    
    // Pas d'initialisation immédiate de Gemini - sera fait lors du premier appel
    if (!API_KEY && process.env.NODE_ENV === 'development') {
      console.warn('VITE_GEMINI_API_KEY n\'est pas définie dans les variables d\'environnement');
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!API_KEY) {
      return false;
    }

    try {
      const { genAI: newGenAI, model: newModel } = initializeGemini();
      this.genAI = newGenAI;
      this.model = newModel;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Gemini:', error);
      return false;
    }
  }

  async generatePollFromText(userInput: string): Promise<GeminiResponse> {
    // Initialisation différée
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.model) {
      return {
        success: false,
        message: 'Service IA temporairement indisponible',
        error: 'INITIALIZATION_FAILED'
      };
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Génération du prompt pour:', userInput);
      }
      
      const prompt = this.buildPollGenerationPrompt(userInput);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Réponse brute de Gemini:', text);
      }

      // Parser la réponse JSON
      const pollData = this.parseGeminiResponse(text);
      
      if (pollData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Dates proposées par Gemini:', pollData.dates);
          console.log('⏰ Créneaux proposés:', pollData.timeSlots);
        }
        return {
          success: true,
          data: pollData,
          message: 'Sondage généré avec succès !'
        };
      } else {
        console.error('❌ Échec du parsing de la réponse Gemini');
        return {
          success: false,
          message: 'Impossible de générer le sondage à partir de votre demande',
          error: 'PARSE_ERROR'
        };
      }
    } catch (error) {
      console.error('🚨 Erreur lors de la génération du sondage:', error);
      return {
        success: false,
        message: 'Erreur lors de la communication avec le service IA',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  async chatAboutPoll(userInput: string, context?: string): Promise<string> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.model) {
      return 'Désolé, le service IA n\'est pas disponible actuellement.';
    }

    try {
      const prompt = this.buildChatPrompt(userInput, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erreur lors du chat:', error);
      return 'Désolé, je n\'ai pas pu traiter votre demande.';
    }
  }

  private getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));
    if (resultDate <= date) {
      resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
  }

  private getNextThursdayAfterTuesday(tuesday: Date): Date {
    // Si on est mardi, on veut le jeudi de la même semaine
    const thursday = new Date(tuesday);
    thursday.setDate(tuesday.getDate() + 2); // +2 jours pour aller de mardi à jeudi
    return thursday;
  }

  private getTargetYear(month: number): number {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Si le mois demandé est déjà passé cette année, utiliser l'année prochaine
    return (month < currentMonth) ? currentYear + 1 : currentYear;
  }

  private parseWeekendRange(startMonth: number, endMonth: number, year?: number): string[] {
    // Utiliser le calendrier pré-généré pour une performance optimale
    const targetYear = year || this.getTargetYear(startMonth);
    
    // Formater les mois pour la requête
    const startMonthKey = `${targetYear}-${startMonth.toString().padStart(2, '0')}`;
    const endMonthKey = `${targetYear}-${endMonth.toString().padStart(2, '0')}`;
    
    // Obtenir tous les week-ends de la période en une seule requête
    const weekendDays = this.calendarQuery.getWeekendsInMonths(startMonthKey, endMonthKey);
    
    return weekendDays.map(day => day.date);
  }

  private parseConsecutiveDays(firstDay: number, daysCount: number, fromDate?: Date): string[] {
    const dates: string[] = [];
    const startDate = fromDate || this.getNextDayOfWeek(new Date(), firstDay);
    
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private parseTimeRange(start: string, end: string, dates: string[]): any {
    return {
      start,
      end,
      dates
    };
  }

  private getNextNDaysOfWeek(dayOfWeek: number, count: number, month: number): string[] {
    // Utiliser le calendrier pré-généré pour une performance optimale
    const targetYear = this.getTargetYear(month);
    const fromDate = `${targetYear}-${month.toString().padStart(2, '0')}-01`;
    
    // Obtenir directement N occurrences du jour de la semaine
    const dayOccurrences = this.calendarQuery.getNextNDaysOfWeek(dayOfWeek, count, fromDate);
    
    return dayOccurrences.map(day => day.date);
  }

  private convertGeminiTimeSlots(timeSlots: any[]): Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> {
    const result: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> = {};
    
    timeSlots.forEach(slot => {
      slot.dates.forEach((date: string) => {
        if (!result[date]) {
          // Initialiser avec toutes les heures désactivées
          result[date] = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            minute: 0,
            enabled: false
          }));
        }
        
        // Activer les heures correspondant au créneau
        const startHour = parseInt(slot.start.split(':')[0]);
        const endHour = parseInt(slot.end.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          if (result[date][hour]) {
            result[date][hour].enabled = true;
          }
        }
      });
    });
    
    return result;
  }

  private generateSequentialTimeSlots(date: string, mainStartTime: string, durations: { brief?: number; main: number; debrief?: number }): any[] {
    const timeSlots = [];
    let currentTime = new Date(`${date}T${mainStartTime}`);
    
    // Si brief, on le met avant la réunion principale
    if (durations.brief) {
      const briefStart = new Date(currentTime);
      briefStart.setMinutes(briefStart.getMinutes() - durations.brief);
      
      timeSlots.push({
        start: briefStart.toTimeString().slice(0, 5),
        end: currentTime.toTimeString().slice(0, 5),
        dates: [date],
        description: "Brief d'équipe"
      });
    }
    
    // Réunion principale
    const mainEnd = new Date(currentTime);
    mainEnd.setMinutes(mainEnd.getMinutes() + durations.main);
    
    timeSlots.push({
      start: currentTime.toTimeString().slice(0, 5),
      end: mainEnd.toTimeString().slice(0, 5),
      dates: [date],
      description: "Réunion principale"
    });
    
    // Si débrief, on le met après la réunion principale
    if (durations.debrief) {
      const debriefStart = new Date(mainEnd);
      const debriefEnd = new Date(debriefStart);
      debriefEnd.setMinutes(debriefEnd.getMinutes() + durations.debrief);
      
      timeSlots.push({
        start: debriefStart.toTimeString().slice(0, 5),
        end: debriefEnd.toTimeString().slice(0, 5),
        dates: [date],
        description: "Débrief d'équipe"
      });
    }
    
    return timeSlots;
  }

  private parseTimePattern(timeStr: string): { hour: number; minute: number } {
    // Convertit "9h", "9:00", "09h00", etc. en { hour: 9, minute: 0 }
    const cleanTime = timeStr.toLowerCase().replace('h', ':').replace(/[^0-9:]/g, '');
    const [hours, minutes = '0'] = cleanTime.split(':');
    return {
      hour: parseInt(hours, 10),
      minute: parseInt(minutes, 10)
    };
  }

  private formatTime(hour: number, minute: number): string {
    // Formate en "HH:MM"
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  private parseSessionPattern(text: string): Array<{
    type: string;
    count: number;
    dayOfWeek: string;
    timeOfDay: string;
    month: string;
    format: string;
  }> {
    const patterns = [];
    
    // Analyse le texte pour trouver les patterns de sessions
    // Ex: "3 sessions en présentiel les lundis matins de mars"
    const sessionMatches = text.matchAll(/(\d+)\s+sessions?\s+en\s+(\w+)\s+les\s+(\w+)s?\s+(\w+)s?\s+(?:de|en|d'|du)\s+(\w+)/g);
    
    for (const match of sessionMatches) {
      const [_, count, format, day, timing, month] = match;
      patterns.push({
        type: 'session',
        count: parseInt(count),
        dayOfWeek: day,
        timeOfDay: timing,
        month: month,
        format: format
      });
    }
    
    return patterns;
  }

  private getTimeRangeForPeriod(period: string): { start: string; end: string } {
    const timeRanges = {
      'matin': { start: '09:00', end: '12:00' },
      'midi': { start: '12:00', end: '14:00' },
      'après-midi': { start: '14:00', end: '17:00' },
      'soir': { start: '17:00', end: '19:00' }
    };
    
    return timeRanges[period] || { start: '09:00', end: '17:00' };
  }

  private buildPollGenerationPrompt(userInput: string): string {
    // Analyse temporelle préalable
    const temporalAnalysis = this.analyzeTemporalInput(userInput);
    const counterfactualQuestions = this.generateCounterfactualQuestions(userInput);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() retourne 0-11
    
    return `Tu es l'IA DooDates, expert en planification temporelle avec techniques Counterfactual-Consistency.

ANALYSE TEMPORELLE PRÉALABLE:
- Conflits détectés: ${temporalAnalysis.conflicts.join(', ') || 'Aucun'}
- Suggestions: ${temporalAnalysis.suggestions.join(', ') || 'Aucune'}
- Type temporel: ${temporalAnalysis.temporalType}
- Confiance: ${Math.round(temporalAnalysis.confidence * 100)}%

QUESTIONS COUNTERFACTUAL POUR VALIDATION:
${counterfactualQuestions.map(q => `- ${q}`).join('\n')}

RÈGLE ABSOLUE - DATES PASSÉES INTERDITES:
- Aujourd'hui: ${today.toISOString().split('T')[0]}
- Ne JAMAIS proposer de dates antérieures à aujourd'hui
- Toutes les dates doivent être >= ${today.toISOString().split('T')[0]}
- Si "cette semaine" inclut des jours passés, commencer à partir d'aujourd'hui

Demande: "${userInput}"

INSTRUCTION SPÉCIALE DATES FUTURES UNIQUEMENT:
- "cette semaine" = semaine actuelle (du ${today.toISOString().split('T')[0]} à 7 jours)
- "semaine prochaine" = semaine suivante (toujours future)
- "demain" = ${new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0]}

RÈGLES DE GÉNÉRATION:
1. **DATES FUTURES OBLIGATOIRES** - Vérifier que chaque date >= ${today.toISOString().split('T')[0]}
2. **COHÉRENCE JOURS/DATES** - Si "lundi" demandé, vérifier que la date tombe un lundi
3. **CRÉNEAUX MULTIPLES** - Générer 4-8 créneaux par plage horaire (ex: si "matin" → 8h-9h, 9h-10h, 10h-11h, 11h-12h)
4. **RÉCURRENCE INTELLIGENTE** - "tous les jeudis pendant 2 mois" = 8-9 jeudis consécutifs
5. **CONTRAINTES TEMPORELLES** - "matin"=8h-12h, "après-midi"=12h-18h, "soir"=18h-21h

FORMATS STRICTS:
- Date: "YYYY-MM-DD" (>= ${today.toISOString().split('T')[0]})
- Heure: "HH:MM" format 24h
- Type: "date" ou "datetime" selon les créneaux

CRÉNEAUX DÉTAILLÉS (si demandés):
Si des heures sont mentionnées, générer TOUS les créneaux de 1h dans la plage:
Exemple "matin" (8h-12h):
[
  { "start": "08:00", "end": "09:00", "dates": ["2025-XX-XX"], "description": "8h-9h" },
  { "start": "09:00", "end": "10:00", "dates": ["2025-XX-XX"], "description": "9h-10h" },
  { "start": "10:00", "end": "11:00", "dates": ["2025-XX-XX"], "description": "10h-11h" },
  { "start": "11:00", "end": "12:00", "dates": ["2025-XX-XX"], "description": "11h-12h" }
]

2. Analyse du texte renforcée :
   * IMPORTANT : Respecter STRICTEMENT les jours demandés :
     - Si "lundi" est demandé, générer UNIQUEMENT des lundis
     - Si "mercredi" est demandé, générer UNIQUEMENT des mercredis
     - Si "week-end" ou "weekend" est demandé, générer UNIQUEMENT des samedis et dimanches (JAMAIS de vendredi)
     - Ne JAMAIS changer le jour de la semaine
   * IMPORTANT : Comprendre les expressions temporelles :
     - "cette semaine" = semaine actuelle (du ${new Date(currentYear, currentMonth - 1, new Date().getDate()).toISOString().split('T')[0]} à 7 jours)
     - "la semaine prochaine" = semaine suivante (les 7 jours après dimanche de cette semaine)
     - "ce week-end" = samedi-dimanche de cette semaine
     - "le week-end prochain" = samedi-dimanche de la semaine prochaine
   * IMPORTANT : Distinguer références spécifiques vs récurrentes :
     - "lundi matin" (sans "tous les" ou "chaque") = LE prochain lundi uniquement
     - "mardi après-midi" (sans "tous les" ou "chaque") = LE prochain mardi uniquement
     - "mercredi ou jeudi" = LE prochain mercredi ET LE prochain jeudi uniquement
     - "tous les lundis" ou "chaque lundi" = plusieurs lundis consécutifs
     - "les mardis" = plusieurs mardis consécutifs
     - c'est vrai aussi pour les autres jours de la semaine
   * IMPORTANT : Déterminer le type d'événement selon le CONTEXTE :
     - Si l'événement nécessite une coordination précise (réunions, formations, entretiens, cours, rendez-vous médicaux, présentations) → Horaires spécifiques OBLIGATOIRES
     - Si l'événement est flexible sur la durée ou se déroule naturellement sur une journée (sorties, loisirs, sport, repas, fêtes, visites) → PAS d'horaires spécifiques
     - Si le texte mentionne explicitement des heures précises → Respecter ces horaires
     - En cas de doute, privilégier les sondages de dates simples (type: "date")
   * IMPORTANT : Proposer le plus d'options possible en respectant les contraintes
   * Identifier les patterns de sessions :
     - Nombre de sessions
     - Type (présentiel/ligne/hybride)
     - Période (matin/midi/après-midi)
     - Mois
   * Identifier les durées :
     - Session principale
     - Brief (si mentionné)
     - Débrief (si mentionné)

2. Génération des créneaux :
   * IMPORTANT : Nous sommes actuellement en ${currentMonth}/${currentYear}
   * IMPORTANT : Proposer PLUSIEURS créneaux par jour en explorant TOUTES les plages horaires :
     - MATIN (8h-12h) : générer créneaux toutes les 30min selon la durée demandée
     - APRÈS-MIDI (14h-17h) : générer créneaux toutes les 30min selon la durée demandée  
     - JOURNÉE COMPLÈTE (9h-17h) : combiner matin + après-midi
     - Adapter l'espacement selon la durée : 45min → créneaux toutes les 30min, 1h30 → créneaux toutes les 30min ou 1h
   * Pour chaque type de session :
     - Si le mois demandé est antérieur au mois actuel (${currentMonth}), utiliser l'année ${currentYear + 1}
     - Si le mois demandé est postérieur ou égal au mois actuel, utiliser l'année ${currentYear}
     - VÉRIFIER que chaque date correspond au bon jour de la semaine
     - IMPORTANT : Pour les activités journée complète → NE PAS générer de timeSlots, utiliser type: "date"
     - Pour les événements avec horaires spécifiques → Adapter les horaires selon la période ET générer TOUS les créneaux possibles dans la plage
     - Ajouter brief/débrief si nécessaire
   * EXEMPLES concrets de génération de créneaux :
     - "Tests 1h30 lundi matin" → 8h-9h30, 8h30-10h, 9h-10h30, 9h30-11h, 10h-11h30, 10h30-12h (6 créneaux)
     - "Entretiens 45min mardi après-midi" → 14h-14h45, 14h30-15h15, 15h-15h45, 15h30-16h15, 16h-16h45, 16h30-17h15 (6 créneaux)
     - "RDV 1h mercredi" → 9h-10h, 10h-11h, 11h-12h, 14h-15h, 15h-16h, 16h-17h (6 créneaux)
   * IMPORTANT : Répartition temporelle intelligente :
     - Événements urgents : concentrer sur les 5-7 prochains jours
     - Événements flexibles : répartir uniformément sur la période
   * Respecter les contraintes :
     - Horaires de bureau (8h-19h)
     - Pauses déjeuner (12h-14h)
     - Durées cohérentes

3. Format des dates et heures :
   * Dates : YYYY-MM-DD (toujours dans le futur par rapport à ${currentMonth}/${currentYear})
   * IMPORTANT : Vérifier que chaque date YYYY-MM-DD correspond au jour de la semaine demandé
   * Heures : HH:MM (24h)
   * Zéros initiaux obligatoires

4. Structure de la réponse :
   * Titre descriptif
   * Dates uniques (même si plusieurs créneaux par date)
   * Créneaux horaires avec :
     - Heure début/fin
     - Dates concernées
     - Description incluant le jour de la semaine

Format JSON requis :

Pour événements SANS horaires spécifiques (flexible, journée complète) :
{
  "title": "Description de l'événement",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [],
  "type": "date"
}

Pour événements AVEC horaires spécifiques (coordination précise nécessaire) :
FORMAT JSON EXACT:
{
  "title": "Titre du sondage",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "dates": ["YYYY-MM-DD"],
      "description": "Description du créneau (préciser le jour)"
    }
  ],
  "type": "datetime"
}

AVANT DE RÉPONDRE :
1. Vérifier que TOUTES les dates correspondent aux jours demandés 
2. CRITIQUE : Vérifier que TOUTES les dates sont >= ${today.toISOString().split('T')[0]}
3. IMPORTANT : Vérifier que TOUS les créneaux possibles sont générés dans chaque plage horaire (voir exemples ci-dessus)
4. Si "week-end" est demandé, vérifier qu'il n'y a QUE des samedis et dimanches (PAS de vendredi) 
5. Vérifier que TOUS les créneaux sont sur les bons jours
6. Ne pas changer les jours de la semaine, même si cela nécessite d'ajouter ou retirer des dates
7. IMPORTANT : Éliminer les créneaux horaires dupliqués (même heure sur même date)
8. Si "cette semaine" ou "la semaine prochaine", utiliser les vraies dates de la semaine concernée
9. IMPORTANT : Respecter les références temporelles spécifiques vs récurrentes (voir règles ci-dessus)
10. IMPORTANT : Compter les créneaux générés - il doit y en avoir 5-6 minimum par plage horaire demandée
11. CRITIQUE : Éliminer immédiatement toute date < ${today.toISOString().split('T')[0]}

RESPECTE SCRUPULEUSEMENT ces règles et ce format.

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire.`;
  }

  private buildChatPrompt(userInput: string, context?: string): string {
    return `Tu es l'assistant IA de DooDates, une application de création de sondages pour planifier des rendez-vous.

${context ? `Contexte : ${context}` : ''}

Utilisateur : ${userInput}

Réponds de manière utile et amicale. Tu peux :
- Aider à créer des sondages
- Expliquer les fonctionnalités
- Donner des conseils sur la planification
- Répondre aux questions sur l'application

Reste concis et pratique. Réponds en français.`;
  }

  private parseGeminiResponse(text: string): PollSuggestion | null {
    try {
      // Nettoyer le texte pour extraire le JSON
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('🔄 Parsing de la réponse JSON:', jsonStr);
        const parsed = JSON.parse(jsonStr);
        
        // Valider la structure et les dates
        if (parsed.title && parsed.dates && Array.isArray(parsed.dates)) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // PROTECTION CRITIQUE : Filtrer strictement les dates passées
          const validDates = parsed.dates.filter((dateStr: string) => {
            const isValidDate = dateStr >= todayStr;
            if (!isValidDate) {
              console.warn(`🚫 Date passée éliminée par Gemini: ${dateStr} (avant ${todayStr})`);
            }
            return isValidDate;
          });
          
          // Si toutes les dates ont été filtrées, retourner null
          if (validDates.length === 0) {
            console.error('🚨 Toutes les dates étaient passées, suggestion rejetée');
            return null;
          }
          
          console.log(`✅ Dates validées: ${validDates.length}/${parsed.dates.length} dates futures conservées`);

          return {
            title: parsed.title,
            description: parsed.description,
            dates: validDates,
            timeSlots: parsed.timeSlots || [],
            type: parsed.type || 'date',
            participants: parsed.participants || []
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('🚨 Erreur lors du parsing de la réponse Gemini:', error);
      return null;
    }
  }

  /**
   * Analyse temporelle avec techniques Counterfactual-Consistency
   */
  private analyzeTemporalInput(userInput: string) {
    const text = userInput.toLowerCase();
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    
    // Détection des contraintes temporelles
    const constraints = {
      matin: text.includes('matin'),
      apresmidi: text.includes('après-midi') || text.includes('apres-midi'),
      soir: text.includes('soir') || text.includes('fin de journée'),
      weekend: text.includes('weekend') || text.includes('week-end'),
      semaine: text.includes('semaine') && !text.includes('weekend'),
      urgent: text.includes('urgent')
    };
    
    // Vérifications counterfactual de base
    if (text.includes('lundi') && constraints.weekend) {
      conflicts.push('Contradiction: "lundi" demandé mais "weekend" aussi mentionné');
      suggestions.push('Clarifiez si vous voulez un lundi ou un weekend');
    }
    
    if (text.includes('matin') && text.includes('soir')) {
      suggestions.push('Précisez si vous voulez le matin OU le soir, ou toute la journée');
    }
    
    // Détection du type temporel
    let temporalType = 'relative';
    if (text.includes('tous les') || text.includes('chaque')) {
      temporalType = 'recurring';
    } else if (constraints.matin || constraints.apresmidi || constraints.soir || /\d{1,2}h/.test(text)) {
      temporalType = 'datetime';
    } else if (text.includes('cette semaine') || text.includes('semaine prochaine')) {
      temporalType = 'date';
    }
    
    // Calcul de confiance
    let confidence = 0.7;
    if (temporalType !== 'relative') confidence += 0.1;
    if (conflicts.length === 0) confidence += 0.1;
    confidence = Math.min(1, confidence - (conflicts.length * 0.2));
    
    return {
      conflicts,
      suggestions,
      constraints,
      temporalType,
      confidence
    };
  }

  /**
   * Génère des questions counterfactual spécifiques au contexte
   */
  private generateCounterfactualQuestions(userInput: string): string[] {
    const questions: string[] = [];
    const text = userInput.toLowerCase();
    
    // Questions sur la cohérence des jours
    if (text.includes('lundi') || text.includes('mardi') || text.includes('mercredi')) {
      questions.push('Si on changeait le jour de la semaine demandé, le contexte resterait-il cohérent ?');
    }
    
    // Questions sur les relations temporelles
    if (text.includes('avant') || text.includes('après')) {
      questions.push('Si on inversait "avant" et "après", la phrase aurait-elle encore du sens ?');
    }
    
    // Questions sur les périodes
    if (text.includes('matin') || text.includes('soir')) {
      questions.push('Si on changeait "matin" par "soir", les horaires seraient-ils cohérents ?');
    }
    
    // Questions sur la récurrence
    if (text.includes('tous les') || text.includes('chaque')) {
      questions.push('Si on supprimait "tous les" ou "chaque", le sens changerait-il ?');
    }
    
    // Questions générales de cohérence
    questions.push('Chaque date générée correspond-elle exactement au jour demandé ?');
    questions.push('Les horaires respectent-ils les contraintes temporelles mentionnées ?');
    
    return questions;
  }

  async testConnection(): Promise<boolean> {
    if (!API_KEY) {
      return false;
    }

    try {
      // S'assurer que le modèle est initialisé avant de tester
      const initialized = await this.ensureInitialized();
      if (!initialized || !this.model) {
        return false;
      }

      const result = await this.model.generateContent("Test de connexion");
      const response = await result.response;
      return response !== null;
    } catch (error) {
      console.error('Erreur lors du test de connexion Gemini:', error);
      return false;
    }
  }
}

export const geminiService = GeminiService.getInstance(); 