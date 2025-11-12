-- ============================================================================
-- TEST DIRECT DU WEBHOOK SLACK
-- Teste l'envoi d'un message simple à Slack sans passer par l'Edge Function
-- Utile pour vérifier que le webhook fonctionne
-- ============================================================================

-- IMPORTANT: Remplacer YOUR_WEBHOOK_URL par votre URL Slack
-- Format: https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_TOKEN

-- Test simple avec un message texte
SELECT net.http_post(
  url := 'YOUR_WEBHOOK_URL',
  headers := jsonb_build_object(
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'text', '🧪 Test webhook Slack - Si vous voyez ce message, le webhook fonctionne !'
  )
);

-- Test avec format Slack Blocks (plus joli)
SELECT net.http_post(
  url := 'YOUR_WEBHOOK_URL',
  headers := jsonb_build_object(
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'blocks', jsonb_build_array(
      jsonb_build_object(
        'type', 'header',
        'text', jsonb_build_object(
          'type', 'plain_text',
          'text', '🧪 Test Webhook Slack'
        )
      ),
      jsonb_build_object(
        'type', 'section',
        'text', jsonb_build_object(
          'type', 'mrkdwn',
          'text', '✅ Si vous voyez ce message, votre webhook Slack est correctement configuré !'
        )
      )
    )
  )
);

