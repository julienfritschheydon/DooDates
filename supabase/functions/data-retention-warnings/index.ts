import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeletionWarning {
  type: 'chat' | 'poll';
  daysUntilDeletion: number;
  itemCount: number;
  deletionDate: string;
  userEmail: string;
  userId: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    const { warnings } = await req.json()

    if (!warnings || !Array.isArray(warnings)) {
      return new Response(
        JSON.stringify({ error: 'Invalid warnings data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const warning of warnings) {
      try {
        const emailContent = generateEmailContent(warning)
        
        const { data, error } = await resend.emails.send({
          from: 'DooDates <noreply@doodates.com>',
          to: [warning.userEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        })

        if (error) {
          console.error(`Error sending email to ${warning.userEmail}:`, error)
          results.push({ success: false, error: error.message, userEmail: warning.userEmail })
        } else {
          console.log(`Email sent successfully to ${warning.userEmail}`)
          results.push({ success: true, messageId: data?.id, userEmail: warning.userEmail })
        }

        // Log l'envoi dans la base de données
        await supabaseClient
          .from('email_logs')
          .insert({
            user_id: warning.userId,
            email: warning.userEmail,
            type: 'deletion_warning',
            warning_type: warning.type,
            days_until_deletion: warning.daysUntilDeletion,
            sent_at: new Date().toISOString(),
            status: error ? 'failed' : 'sent'
          })

      } catch (error) {
        console.error(`Error processing warning for ${warning.userEmail}:`, error)
        results.push({ success: false, error: (error as Error).message, userEmail: warning.userEmail })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailContent(warning: DeletionWarning) {
  const typeLabels = {
    chat: 'conversations IA',
    poll: 'sondages et formulaires'
  }

  const subject = `⚠️ Alerte DooDates : Suppression de vos ${typeLabels[warning.type]} dans ${warning.daysUntilDeletion} jours`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-secondary { background: #6b7280; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Alerte de Suppression de Données</h1>
          <p>DooDates - Votre vie privée, vos règles</p>
        </div>
        
        <div class="content">
          <div class="alert">
            <h2>⚠️ Action requise : ${warning.daysUntilDeletion} jours restants</h2>
            <p><strong>${warning.itemCount}</strong> ${typeLabels[warning.type]} seront automatiquement supprimées le <strong>${new Date(warning.deletionDate).toLocaleDateString('fr-FR')}</strong>.</p>
          </div>

          <h3>📋 Que se passe-t-il ?</h3>
          <p>Selon vos paramètres de conservation, vos données arrivent en fin de période de rétention. Pour protéger votre vie privée, elles seront automatiquement supprimées.</p>

          <h3>🎯 Vos options :</h3>
          <div style="margin: 20px 0;">
            <a href="https://doodates.com/data-control" class="button">
              🔧 Gérer mes données
            </a>
            <a href="https://doodates.com/data-control?action=postpone&type=${warning.type}&userId=${warning.userId}" class="button button-secondary">
              ⏰ Reporter de 30 jours
            </a>
          </div>

          <h3>💡 Pourquoi cette alerte ?</h3>
          <p>Chez DooDates, nous croyons en la transparence totale. Cette alerte vous permet de garder le contrôle sur vos données personnelles.</p>

          <div style="background: #e0f2fe; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3>📧 Besoin d'aide ?</h3>
            <p>Contactez notre DPO (Data Protection Officer) : <strong>privacy@doodates.com</strong></p>
          </div>

          <div class="footer">
            <p>Cet email est automatique. Vous pouvez désactiver les notifications dans vos paramètres.</p>
            <p>DooDates - 2025 | <a href="https://doodates.com/privacy">Politique de confidentialité</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
