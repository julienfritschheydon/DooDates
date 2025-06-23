import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export interface PollData {
  title: string;
  description?: string | null;
  selectedDates: string[];
  timeSlotsByDate: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  participantEmails: string[];
  settings: {
    timeGranularity: number;
    allowAnonymousVotes: boolean;
    allowMaybeVotes: boolean;
    sendNotifications: boolean;
    expiresAt?: string;
  };
}

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings: any;
  status: 'draft' | 'active' | 'closed' | 'archived';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: any;
  display_order: number;
  created_at: string;
}

export function usePolls() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = useCallback((title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Éviter les tirets multiples
      .substring(0, 50) // Limiter la longueur
      + '-' + uuidv4().substring(0, 8); // Ajouter un ID unique
  }, []);

  const createPoll = useCallback(async (pollData: PollData): Promise<{ poll?: Poll; error?: string }> => {
    if (!user) {
      return { error: 'Utilisateur non connecté' };
    }

    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(pollData.title);
      console.log('Création sondage - Slug généré:', slug);

      // 1. Créer le sondage principal
      console.log('Étape 1: Création du sondage principal...');
      console.log('Données à insérer:', {
        creator_id: user.id,
        title: pollData.title,
        description: pollData.description,
        slug: slug,
        settings: pollData.settings,
        status: 'active',
        expires_at: pollData.settings.expiresAt || null,
      });
      
      const insertData = {
        creator_id: user.id,
        title: pollData.title,
        description: pollData.description || null,
        slug: slug,
        settings: pollData.settings,
        status: 'active' as const,
        expires_at: pollData.settings.expiresAt || null,
      };
      
      console.log('Tentative d\'insertion avec:', insertData);
      
      // Utiliser fetch direct car le client supabase se bloque
      let poll;
      try {
        // Récupérer le token JWT
        let token = null;
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          const sessionData = JSON.parse(supabaseSession);
          token = sessionData?.access_token || sessionData?.currentSession?.access_token;
        }
        
        if (!token) {
          const authData = localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);
          if (authData) {
            const parsed = JSON.parse(authData);
            token = parsed?.access_token;
          }
        }
        
        if (!token) {
          throw new Error('Token d\'authentification non trouvé');
        }
        
        // Faire l'insertion avec fetch
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/polls`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(insertData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        poll = data[0]; // PostgREST retourne un array
        console.log('Sondage principal créé:', poll);
        
        if (!poll || !poll.id) {
          throw new Error('Réponse invalide du serveur');
        }
        
      } catch (fetchError) {
        console.error('Erreur création sondage:', fetchError);
        throw fetchError;
      }

      // 2. Créer les options de dates
      console.log('Étape 2: Création des options de dates...');
      const pollOptions = pollData.selectedDates.map((date, index) => {
        const timeSlots = pollData.timeSlotsByDate[date] || [];
        
        // Transformer les créneaux au format attendu par la DB
        const formattedTimeSlots = timeSlots
          .filter(slot => slot.enabled)
          .map((slot, slotIndex) => {
            const endHour = slot.hour + Math.floor(pollData.settings.timeGranularity / 60);
            const endMinute = slot.minute + (pollData.settings.timeGranularity % 60);
            
            return {
              id: `slot-${slotIndex + 1}`,
              start_hour: slot.hour,
              start_minute: slot.minute,
              end_hour: endHour >= 24 ? endHour - 24 : endHour,
              end_minute: endMinute >= 60 ? endMinute - 60 : endMinute,
              label: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')} - ${(endHour >= 24 ? endHour - 24 : endHour).toString().padStart(2, '0')}:${(endMinute >= 60 ? endMinute - 60 : endMinute).toString().padStart(2, '0')}`
            };
          });

        return {
          poll_id: poll.id,
          option_date: date,
          time_slots: formattedTimeSlots,
          display_order: index,
        };
      });

      console.log('Options à créer:', pollOptions);
      
      // Utiliser fetch direct pour les options aussi
      try {
        // Récupérer le token JWT (même logique que pour le poll)
        let token = null;
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
          const sessionData = JSON.parse(supabaseSession);
          token = sessionData?.access_token || sessionData?.currentSession?.access_token;
        }
        
        if (!token) {
          const authData = localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);
          if (authData) {
            const parsed = JSON.parse(authData);
            token = parsed?.access_token;
          }
        }
        
        if (!token) {
          throw new Error('Token d\'authentification non trouvé');
        }
        
        // Faire l'insertion des options avec fetch
        const optionsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/poll_options`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(pollOptions)
        });
        
        if (!optionsResponse.ok) {
          const errorText = await optionsResponse.text();
          console.error('Erreur création options:', errorText);
          
          // Nettoyer le sondage créé en cas d'erreur
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/polls?id=eq.${poll.id}`, {
            method: 'DELETE',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token}`,
            }
          });
          
          throw new Error(`Erreur HTTP ${optionsResponse.status}: ${errorText}`);
        }
        
        console.log('Options créées avec succès');
        
      } catch (optionsError) {
        console.error('Erreur création options:', optionsError);
        throw optionsError;
      }

      // 3. Analytics (optionnel - ne doit pas bloquer la création)
      // Désactivé temporairement car le client Supabase se bloque
      console.log('Analytics désactivées temporairement pour éviter les blocages');

      console.log('Sondage créé avec succès:', poll);
      return { poll };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création du sondage';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, generateSlug]);

  const getUserPolls = useCallback(async (): Promise<{ polls?: Poll[]; error?: string }> => {
    if (!user) {
      return { error: 'Utilisateur non connecté' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (pollsError) {
        throw pollsError;
      }

      return { polls: polls || [] };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des sondages';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPollBySlug = useCallback(async (slug: string): Promise<{ poll?: Poll; options?: PollOption[]; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer le sondage
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (pollError) {
        throw pollError;
      }

      // Récupérer les options
      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('display_order');

      if (optionsError) {
        throw optionsError;
      }

      return { poll, options: options || [] };
    } catch (err: any) {
      const errorMessage = err.message || 'Sondage non trouvé';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePollStatus = useCallback(async (pollId: string, status: Poll['status']): Promise<{ error?: string }> => {
    if (!user) {
      return { error: 'Utilisateur non connecté' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('polls')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', pollId)
        .eq('creator_id', user.id); // Sécurité : seul le créateur peut modifier

      if (updateError) {
        throw updateError;
      }

      return {};
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du sondage';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    createPoll,
    getUserPolls,
    getPollBySlug,
    updatePollStatus,
  };
}
