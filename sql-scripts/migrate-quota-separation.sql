-- ============================================================================
-- MIGRATION: Séparation des quotas par type de poll
-- Description: Répartit polls_created existant dans les nouveaux compteurs séparés
-- ============================================================================

-- Note: Beta fermée, peu d'utilisateurs - migration simple acceptable

-- Étape 1: Ajouter les colonnes si elles n'existent pas déjà
DO $$
BEGIN
  -- Table quota_tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quota_tracking' AND column_name = 'date_polls_created'
  ) THEN
    ALTER TABLE quota_tracking 
    ADD COLUMN date_polls_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN form_polls_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN quizz_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN availability_polls_created INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Table guest_quotas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_quotas' AND column_name = 'date_polls_created'
  ) THEN
    ALTER TABLE guest_quotas 
    ADD COLUMN date_polls_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN form_polls_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN quizz_created INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN availability_polls_created INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Étape 2: Répartir polls_created existant selon le type de poll
-- Pour quota_tracking (utilisateurs authentifiés)
DO $$
DECLARE
  poll_record RECORD;
  date_count INTEGER;
  form_count INTEGER;
  quizz_count INTEGER;
  availability_count INTEGER;
BEGIN
  -- Parcourir tous les quotas avec polls_created > 0
  FOR poll_record IN 
    SELECT qt.user_id, qt.polls_created
    FROM quota_tracking qt
    WHERE qt.polls_created > 0
  LOOP
    -- Récupérer les polls de cet utilisateur depuis doodates_polls
    -- et compter par type
    SELECT 
      COUNT(*) FILTER (WHERE p.type = 'date'),
      COUNT(*) FILTER (WHERE p.type = 'form'),
      COUNT(*) FILTER (WHERE p.type = 'quizz'),
      COUNT(*) FILTER (WHERE p.type = 'availability')
    INTO date_count, form_count, quizz_count, availability_count
    FROM doodates_polls p
    WHERE p.creator_id = poll_record.user_id;
    
    -- Si on trouve des polls, répartir selon les comptages réels
    -- Sinon, tout mettre dans date_polls_created (fallback)
    IF (date_count + form_count + quizz_count + availability_count) > 0 THEN
      UPDATE quota_tracking
      SET 
        date_polls_created = COALESCE(date_count, 0),
        form_polls_created = COALESCE(form_count, 0),
        quizz_created = COALESCE(quizz_count, 0),
        availability_polls_created = COALESCE(availability_count, 0)
      WHERE user_id = poll_record.user_id;
    ELSE
      -- Fallback: tout mettre dans date_polls_created si aucun poll trouvé
      UPDATE quota_tracking
      SET date_polls_created = poll_record.polls_created
      WHERE user_id = poll_record.user_id;
    END IF;
  END LOOP;
END $$;

-- Étape 3: Mettre à jour polls_created = somme des 4 compteurs (sécurité)
UPDATE quota_tracking
SET polls_created = COALESCE(date_polls_created, 0) + 
                    COALESCE(form_polls_created, 0) + 
                    COALESCE(quizz_created, 0) + 
                    COALESCE(availability_polls_created, 0)
WHERE polls_created != (COALESCE(date_polls_created, 0) + 
                        COALESCE(form_polls_created, 0) + 
                        COALESCE(quizz_created, 0) + 
                        COALESCE(availability_polls_created, 0));

-- Note: Pour guest_quotas, la migration sera plus simple car on n'a pas de lien direct
-- avec les polls. On peut soit laisser à 0, soit répartir équitablement.
-- Pour l'instant, on laisse à 0 et les nouveaux polls seront comptés correctement.

-- Étape 4: Vérification
DO $$
DECLARE
  total_polls INTEGER;
  sum_separated INTEGER;
BEGIN
  SELECT SUM(polls_created) INTO total_polls FROM quota_tracking;
  SELECT SUM(COALESCE(date_polls_created, 0) + 
             COALESCE(form_polls_created, 0) + 
             COALESCE(quizz_created, 0) + 
             COALESCE(availability_polls_created, 0)) 
  INTO sum_separated 
  FROM quota_tracking;
  
  RAISE NOTICE 'Migration terminée. Total polls_created: %, Somme compteurs séparés: %', total_polls, sum_separated;
END $$;
