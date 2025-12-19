-- ============================================================================
-- EOL SCRIPT: Suppression de polls_created (End of Life)
-- Description: Supprime la colonne polls_created, le trigger et la fonction
--              qui la maintenaient automatiquement
-- Date: Janvier 2025
-- Branche: feature/eol-remove-polls-created
-- ============================================================================

-- ⚠️ ATTENTION: Ce script supprime définitivement la colonne polls_created
-- Assurez-vous que:
-- 1. Tous les clients frontend utilisent calculateTotalPollsCreated()
-- 2. Tous les tests E2E ont été mis à jour
-- 3. Tous les scripts de monitoring ont été mis à jour
-- 4. Vous êtes sur la branche feature/eol-remove-polls-created

BEGIN;

-- ============================================================================
-- ÉTAPE 1: Supprimer le trigger
-- ============================================================================

DROP TRIGGER IF EXISTS sync_polls_created_trigger ON quota_tracking;
DROP TRIGGER IF EXISTS sync_polls_created_trigger ON guest_quotas;

-- ============================================================================
-- ÉTAPE 2: Supprimer la fonction
-- ============================================================================

DROP FUNCTION IF EXISTS sync_polls_created_from_separated_counters();

-- ============================================================================
-- ÉTAPE 3: Supprimer la colonne polls_created de quota_tracking
-- ============================================================================

ALTER TABLE quota_tracking 
DROP COLUMN IF EXISTS polls_created;

-- ============================================================================
-- ÉTAPE 4: Supprimer la colonne polls_created de guest_quotas
-- ============================================================================

ALTER TABLE guest_quotas 
DROP COLUMN IF EXISTS polls_created;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les colonnes ont bien été supprimées
DO $$
BEGIN
  -- Vérifier quota_tracking
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quota_tracking' AND column_name = 'polls_created'
  ) THEN
    RAISE EXCEPTION 'La colonne polls_created existe encore dans quota_tracking';
  END IF;

  -- Vérifier guest_quotas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_quotas' AND column_name = 'polls_created'
  ) THEN
    RAISE EXCEPTION 'La colonne polls_created existe encore dans guest_quotas';
  END IF;

  -- Vérifier que la fonction a été supprimée
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'sync_polls_created_from_separated_counters'
  ) THEN
    RAISE EXCEPTION 'La fonction sync_polls_created_from_separated_counters existe encore';
  END IF;

  RAISE NOTICE '✅ EOL polls_created: Suppression réussie';
  RAISE NOTICE '   - Colonne polls_created supprimée de quota_tracking';
  RAISE NOTICE '   - Colonne polls_created supprimée de guest_quotas';
  RAISE NOTICE '   - Trigger sync_polls_created_trigger supprimé';
  RAISE NOTICE '   - Fonction sync_polls_created_from_separated_counters supprimée';
END $$;

COMMIT;

-- ============================================================================
-- NOTES POST-SUPPRESSION
-- ============================================================================
-- 
-- Après l'exécution de ce script:
-- 1. Les compteurs séparés (date_polls_created, form_polls_created, etc.) 
--    continuent de fonctionner normalement
-- 2. Utilisez calculateTotalPollsCreated() côté frontend pour calculer le total
-- 3. Les scripts SQL de monitoring doivent utiliser:
--    date_polls_created + form_polls_created + quizz_created + availability_polls_created
-- 4. Vérifiez que tous les tests passent après cette suppression
-- 
-- ============================================================================

