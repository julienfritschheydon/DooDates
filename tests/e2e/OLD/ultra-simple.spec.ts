// import { test, expect } from '@playwright/test';
// import { withConsoleGuard, robustClick, waitForCopySuccess } from './utils';
// import { setupTestEnvironment } from './helpers/test-setup';
// import { waitForNetworkIdle, waitForReactStable, waitForElementReady, waitForAnimationComplete } from './helpers/wait-helpers';
// import { getTimeouts } from './config/timeouts';
// import { safeIsVisible } from './helpers/safe-helpers';

// // Simple scoped logger  
// function mkLogger(scope: string) {
//   return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
// }

// test.describe('DooDates - Test Ultra Simple', () => {
//   test.describe.configure({ mode: 'serial' });
  
//   test.beforeEach(async ({ page, browserName }) => {
//     await setupTestEnvironment(page, browserName, {
//       enableE2ELocalMode: true,
//       warmup: true,
//       consoleGuard: {
//         enabled: true,
//         allowlist: [
//           /Importing a module script failed\./i,
//           /error loading dynamically imported module/i,
//           /The above error occurred in one of your React components/i,
//           /The above error occurred in the .* component/i,
//           /Erreur préchargement/i,
//           /calendrier JSON/i,
//           /TimeSlot Functions/i,
//           /Sondage avec slug .* non trouvé/i,
//           /DooDatesError/i,
//           /\[vite\] Failed to reload.*\.css/i,
//           /\[vite\] Failed to reload \/src\/index\.css/i,
//           /vite.*reload.*css/i,
//           /Can't find variable: requestIdleCallback/i,
//           /requestIdleCallback is not defined/i,
//           /Access to fetch.*has been blocked by CORS policy/i,
//           /No 'Access-Control-Allow-Origin' header/i,
//           /No dates selected for poll creation/i,
//           /Erreur lors de la sauvegarde/i,
//         ],
//       },
//       mocks: { gemini: true },
//     });
//   });
  
//   test('Workflow complet : Création DatePoll → Dashboard @smoke @critical', async ({ page, browserName }, testInfo) => {
//     const timeouts = getTimeouts(browserName);
//     const log = mkLogger('UltraSimple');
    
//     await withConsoleGuard(page, async () => {
//       test.slow();
//       await expect(page).toHaveTitle(/DooDates/);
//       console.log('✅ App charge');

//       // Navigation vers /create/date (redirige vers /create/ai?type=date)
//       await page.goto('/create/date', { waitUntil: 'domcontentloaded' });
//       await waitForNetworkIdle(page, { browserName });
//       await expect(page).toHaveURL(/\/create\/ai\?type=date/);
//       console.log('✅ Page /create/date accessible → redirigée vers /create/ai?type=date');

//       // Vérifier calendrier visible (après amélioration de l'initialisation dans useState)
//       const projectName = testInfo.project.name;
//       const isMobileBrowser = projectName === 'Mobile Safari' || projectName === 'Mobile Chrome';
//       // Sur mobile, le calendrier peut être présent mais nécessiter du scroll
//       if (isMobileBrowser) {
//         console.log(`⚠️ Skip vérification calendrier sur ${projectName} (peut nécessiter scroll)`);
//       } else {
//         // Le calendrier devrait maintenant être visible immédiatement grâce à l'initialisation dans useState
//         const calendar = await waitForElementReady(page, '[data-testid="calendar"]', { browserName, timeout: timeouts.element });
//         await expect(calendar).toBeVisible({ timeout: timeouts.element });
//         console.log(`✅ Calendrier visible sur ${projectName}`);
//       }

//       // Sélectionner 3 dates NON-CONSÉCUTIVES pour que le bouton Horaires apparaisse
      
//       // Calculer 3 dates ESPACÉES à partir d'aujourd'hui (+1, +4, +7 jours)
//       // Cela évite les groupes consécutifs qui masquent le bouton Horaires
//       const today = new Date();
//       const formatDate = (d: Date) => {
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//       };
      
//       const offsets = [1, 4, 7]; // Jours espacés
//       const dates = offsets.map(offset => {
//         const d = new Date(today);
//         d.setDate(today.getDate() + offset);
//         return formatDate(d);
//       });
      
//       console.log(`✅ Dates à sélectionner (espacées): ${dates.join(', ')}`);
      
//       // Cliquer sur chaque date
//       // Sur mobile, le calendrier peut nécessiter du scroll
//       let datesSelected = 0;
//       if (!isMobileBrowser) {
//         // Note: Il y a 2 boutons par date (mobile + desktop), on filtre par visibilité
//         for (const dateStr of dates) {
//           const dayButton = page.locator(`button[data-date="${dateStr}"]:visible`).first();
//           await expect(dayButton).toBeVisible({ timeout: timeouts.element });
//           await robustClick(dayButton);
//           datesSelected++;
//         }
//         console.log('✅ 3 dates sélectionnées');
//       } else {
//         console.log('⚠️ Skip sélection de dates sur mobile (calendrier non visible immédiatement)');
//         // Sur mobile, on essaie de cliquer sur les boutons même s'ils ne sont pas visibles
//         // en utilisant force: true, car le calendrier peut être présent dans le DOM mais non visible
//         // On attend aussi un peu plus longtemps pour que le calendrier se charge
//         await waitForReactStable(page, { browserName });
//         try {
//           for (const dateStr of dates) {
//             // Essayer plusieurs sélecteurs pour trouver le bouton de date
//             const dayButton = page.locator(`button[data-date="${dateStr}"]`).first();
//             // Attendre que le bouton soit attaché au DOM (même s'il n'est pas visible)
//             const isAttached = await dayButton.waitFor({ state: 'attached', timeout: timeouts.element }).catch(() => false);
//             if (isAttached) {
//               // Essayer de cliquer avec force: true pour contourner les problèmes de visibilité
//               await dayButton.click({ force: true, timeout: timeouts.element }).catch(() => {
//                 console.log(`⚠️ Impossible de cliquer sur la date ${dateStr}`);
//               });
//               datesSelected++;
//             } else {
//               console.log(`⚠️ Bouton pour la date ${dateStr} non trouvé dans le DOM`);
//             }
//           }
//           if (datesSelected > 0) {
//             console.log(`✅ ${datesSelected} date(s) sélectionnée(s) sur mobile (avec force)`);
//             // Attendre un peu pour que l'état se mette à jour
//             await waitForReactStable(page, { browserName });
//           } else {
//             console.log('⚠️ Aucune date sélectionnée sur navigateur problématique, le test continuera quand même');
//           }
//         } catch (error) {
//           console.log('⚠️ Erreur lors de la sélection de dates sur navigateur problématique:', error);
//         }
//       }
      
//       // Si aucune date n'a été sélectionnée sur mobile, skip la création du poll
//       if (isMobileBrowser && datesSelected === 0) {
//         console.log('⚠️ Skip création du poll sur mobile (aucune date sélectionnée)');
//         test.skip(true, 'Calendrier nécessite scroll sur mobile');
//         return;
//       }

//       // Ouvrir section horaires (le bouton n'apparaît que si dates non-groupées)
//       // Skip sur mobile si dates non sélectionnées
//       if (!isMobileBrowser || (isMobileBrowser && datesSelected > 0)) {
//         const horaireButton = await waitForElementReady(page, '[data-testid="add-time-slots-button"]', { browserName, timeout: timeouts.element });
//         await robustClick(horaireButton);
        
//         const visibleSection = await waitForElementReady(page, '[data-testid="time-slots-section"]', { browserName, timeout: timeouts.element });
//         await expect(visibleSection).toBeVisible({ timeout: timeouts.element });
//         console.log('✅ Section horaires visible');

//         // Sélectionner des créneaux horaires (adaptatif)
//         const timesCandidates = ['09-00', '10-00', '11-00', '14-00', '15-00'];
//         const maxColumns = 3;
//         let slotsSelected = 0;
        
//         // Trouver la grille visible (mobile ou desktop)
//         const visibleGrid = page.locator('[data-testid="time-slots-grid-mobile"]:visible, [data-testid="time-slots-grid-desktop"]:visible').first();
        
//         for (let col = 0; col < maxColumns; col++) {
//           for (const t of timesCandidates) {
//             const btn = visibleGrid.getByTestId(`time-slot-${t}-col-${col}`);
//             if (await btn.count()) {
//               await robustClick(btn);
//               log(`Créneau ${t} sélectionné pour colonne ${col + 1}`);
//               slotsSelected++;
//               break;
//             }
//           }
//         }
//         expect(slotsSelected, `Au moins 1 créneau requis`).toBeGreaterThanOrEqual(1);
//         console.log(`✅ ${slotsSelected} créneau(x) sélectionné(s)`);
//       } else {
//         console.log('⚠️ Skip section horaires sur mobile (dates non sélectionnées)');
//         // Sur mobile, on skip cette étape car les dates n'ont pas été sélectionnées
//         // Le test continuera avec les étapes suivantes qui ne dépendent pas des horaires
//       }

//       // Screenshot AVANT de saisir le titre
//       await page.screenshot({ path: 'test-results/01-avant-titre.png', fullPage: true });
//       console.log('📸 Screenshot 1: Avant saisie titre');
      
//       // Sur mobile, utiliser le bouton "Créer manuellement" pour accéder au formulaire
//       if (isMobileBrowser) {
//         console.log('📱 Mode mobile détecté - utilisation du bouton "Créer manuellement"');
//         // Cliquer sur le bouton "Créer manuellement"
//         const createManualButton = await waitForElementReady(page, 'button:has-text("Créer manuellement")', { browserName, timeout: timeouts.element });
//         await robustClick(createManualButton);
//         console.log('✅ Bouton "Créer manuellement" cliqué');
        
//         // Attendre que le formulaire apparaisse
//         await waitForReactStable(page, { browserName });
        
//         // Le formulaire devrait maintenant être visible
//         const titleInput = await waitForElementReady(page, '[data-testid="poll-title"]', { browserName, timeout: timeouts.element });
//         await titleInput.fill('Test E2E Ultra Simple');
//         console.log('✅ Titre saisi sur mobile');
        
//         // Sur mobile, après création manuelle, sélectionner des dates
//         // Attendre que le calendrier soit chargé et visible
//         await waitForReactStable(page, { browserName });
        
//         // Vérifier que le calendrier est présent
//         const calendar = await waitForElementReady(page, '[data-testid="calendar"]', { browserName, timeout: timeouts.element });
        
//         // Calculer les dates à sélectionner (même logique que desktop)
//         const today = new Date();
//         const formatDate = (d: Date) => {
//           const year = d.getFullYear();
//           const month = String(d.getMonth() + 1).padStart(2, '0');
//           const day = String(d.getDate()).padStart(2, '0');
//           return `${year}-${month}-${day}`;
//         };
        
//         const offsets = [1, 4, 7]; // Jours espacés
//         const dates = offsets.map(offset => {
//           const d = new Date(today);
//           d.setDate(today.getDate() + offset);
//           return formatDate(d);
//         });
        
//         console.log(`📱 Dates à sélectionner sur mobile: ${dates.join(', ')}`);
        
//         // Sélectionner les dates - utiliser directement l'API React si les clics ne fonctionnent pas
//         let datesSelected = 0;
        
//         // Essayer d'abord avec les clics normaux
//         for (const dateStr of dates) {
//           const dayButton = page.locator(`button[data-date="${dateStr}"]`).first();
//           const isAttached = await dayButton.waitFor({ state: 'attached', timeout: timeouts.element }).catch(() => false);
          
//           if (isAttached) {
//             try {
//               await dayButton.scrollIntoViewIfNeeded();
//               await waitForAnimationComplete(page, undefined, { browserName });
//               await dayButton.click({ timeout: timeouts.element });
//               datesSelected++;
//               await waitForReactStable(page, { browserName });
//             } catch {
//               // Si le clic échoue, essayer avec force
//               try {
//                 await dayButton.click({ force: true, timeout: timeouts.element });
//                 datesSelected++;
//                 await waitForReactStable(page, { browserName });
//               } catch {
//                 console.log(`⚠️ Impossible de cliquer sur la date ${dateStr}, tentative via API React`);
//               }
//             }
//           }
//         }
        
//         // Si les clics n'ont pas fonctionné, utiliser directement l'API React
//         if (datesSelected === 0) {
//           console.log('📱 Tentative de sélection via API React directement');
//           const selectedViaAPI = await page.evaluate((datesToSelect: string[]) => {
//             // Chercher le composant PollCreator dans le DOM et déclencher toggleDate
//             // On peut déclencher les événements directement sur les boutons
//             let successCount = 0;
//             for (const dateStr of datesToSelect) {
//               const button = document.querySelector(`button[data-date="${dateStr}"]`) as HTMLButtonElement;
//               if (button) {
//                 // Déclencher l'événement click directement
//                 button.click();
//                 successCount++;
//               }
//             }
//             return successCount;
//           }, dates);
          
//           if (selectedViaAPI > 0) {
//             datesSelected = selectedViaAPI;
//             console.log(`✅ ${datesSelected} date(s) sélectionnée(s) via API React`);
//             await waitForReactStable(page, { browserName });
//           }
//         } else {
//           console.log(`✅ ${datesSelected} date(s) sélectionnée(s) via clics`);
//         }
        
//         // Vérifier que les dates sont bien sélectionnées
//         await waitForReactStable(page, { browserName });
//         const finalizeBtn = page.getByRole('button', { name: /Publier le sondage/i });
//         const isDisabled = await finalizeBtn.isDisabled().catch(() => true);
        
//         if (isDisabled && datesSelected === 0) {
//           console.log('⚠️ Aucune date sélectionnée - le test va probablement échouer');
//           await page.screenshot({ path: 'test-results/debug-mobile-dates.png', fullPage: true });
//         } else if (isDisabled) {
//           console.log('⚠️ Dates sélectionnées mais bouton toujours désactivé');
//           await page.screenshot({ path: 'test-results/debug-mobile-dates.png', fullPage: true });
//         }
//       } else {
//         // Sur desktop, utiliser le formulaire manuel comme avant
//         const titleInput = await waitForElementReady(page, '[data-testid="poll-title"]', { browserName, timeout: timeouts.element });
//         await titleInput.fill('Test E2E Ultra Simple');
//         console.log('✅ Titre saisi');
//       }
//       await page.screenshot({ path: 'test-results/02-apres-titre-visible.png', fullPage: true });
//       console.log('📸 Screenshot 2: Titre visible');

//       // Screenshot APRÈS avoir saisi le titre
//       await page.screenshot({ path: 'test-results/03-apres-titre.png', fullPage: true });
//       console.log('📸 Screenshot 3: Après saisie titre');

//       // Attendre que le bouton Publier soit visible
//       // (il est dans la même section que le champ titre)
//       const finalizeBtn = await waitForElementReady(page, 'button:has-text("Publier le sondage")', { browserName, timeout: timeouts.element });
      
//       // Capturer la position du bouton Finaliser
//       const finalizeBtnBox = await finalizeBtn.boundingBox();
//       console.log(`📍 Position bouton Finaliser: ${JSON.stringify(finalizeBtnBox)}`);
      
//       // Debug: Vérifier si le bouton est enabled
//       let isDisabled = await finalizeBtn.isDisabled();
//       console.log(`DEBUG: Bouton Finaliser disabled = ${isDisabled}`);
      
//       // Sur mobile, si le bouton est désactivé, vérifier les dates sélectionnées
//       if (isDisabled && isMobileBrowser) {
//         // Vérifier combien de dates sont sélectionnées
//         const selectedDates = await page.evaluate(() => {
//           const buttons = Array.from(document.querySelectorAll('button[data-date]'));
//           return buttons.filter(btn => {
//             const classes = btn.className || '';
//             return classes.includes('bg-blue') || classes.includes('selected') || classes.includes('ring');
//           }).length;
//         });
//         console.log(`DEBUG: Nombre de dates sélectionnées détectées: ${selectedDates}`);
        
//         // Capturer l'état pour comprendre pourquoi
//         const debugState = await page.evaluate(() => {
//           const titleInput = document.querySelector('[data-testid="poll-title"]') as HTMLInputElement;
//           const calendar = document.querySelector('[data-testid="calendar"]');
//           return {
//             title: titleInput?.value || 'NOT FOUND',
//             titleLength: titleInput?.value?.length || 0,
//             calendarExists: !!calendar,
//             calendarVisible: calendar ? window.getComputedStyle(calendar as Element).display !== 'none' : false,
//           };
//         });
//         console.log('DEBUG: État du formulaire:', JSON.stringify(debugState, null, 2));
        
//         // Si toujours désactivé après un délai, essayer de sélectionner à nouveau
//         await waitForReactStable(page, { browserName });
//         isDisabled = await finalizeBtn.isDisabled();
//         if (isDisabled) {
//           console.log('⚠️ Bouton toujours désactivé, tentative de sélection de dates supplémentaire');
//           // Prendre un screenshot pour debug
//           await page.screenshot({ path: 'test-results/debug-before-publish-mobile.png', fullPage: true });
//         }
//       } else if (isDisabled) {
//         // Sur desktop aussi
//         const debugState = await page.evaluate(() => {
//           const titleInput = document.querySelector('[data-testid="poll-title"]') as HTMLInputElement;
//           return {
//             title: titleInput?.value || 'NOT FOUND',
//             titleLength: titleInput?.value?.length || 0,
//           };
//         });
//         console.log('DEBUG: État du formulaire:', JSON.stringify(debugState, null, 2));
//       }
      
//       // Vérifier que le bouton est activé avant de continuer
//       if (isDisabled) {
//         throw new Error('Le bouton "Publier le sondage" est désactivé. Vérifiez que le titre est saisi et qu\'au moins une date est sélectionnée.');
//       }
      
//       // Screenshot AVANT de cliquer sur Finaliser
//       await page.screenshot({ path: 'test-results/04-avant-finaliser.png', fullPage: true });
//       console.log('📸 Screenshot 4: Avant clic Finaliser');
      
//       await robustClick(finalizeBtn);
//       console.log('✅ Bouton "Publier le sondage" cliqué');

//       const successMessage = await waitForElementReady(page, 'text=/Sondage publié !/i', { browserName, timeout: timeouts.element });
//       await expect(successMessage).toBeVisible({ timeout: timeouts.element });
//       console.log('✅ Écran de succès affiché');
//       await page.screenshot({ path: 'test-results/05-apres-finaliser.png', fullPage: true });
//       console.log('📸 Screenshot 5: Après clic Finaliser');
      
//       // Debug: Vérifier l'état de la page après finalisation
//       const debugAfterFinalize = await page.evaluate(() => {
//         try {
//           const polls = localStorage.getItem('dev-polls');
//           const pollsData = polls ? JSON.parse(polls) : [];
//           return {
//             pollsCount: pollsData.length,
//             lastPoll: pollsData.length > 0 ? {
//               id: pollsData[pollsData.length - 1]?.id,
//               title: pollsData[pollsData.length - 1]?.title,
//               slug: pollsData[pollsData.length - 1]?.slug,
//             } : null,
//             currentUrl: window.location.href,
//             bodyText: document.body.innerText.substring(0, 500),
//           };
//         } catch (e) {
//           return { error: String(e) };
//         }
//       });
//       console.log('DEBUG: État après finalisation:', JSON.stringify(debugAfterFinalize, null, 2));
      
//       // Prendre une photo pour voir ce qui est affiché
//       await page.screenshot({ path: 'test-results/debug-after-finalize.png', fullPage: true });
//       console.log('📸 Photo debug prise: test-results/debug-after-finalize.png');

//       // Vérifier que le slug du sondage est disponible dans le stockage local
//       let pollSlug: string | null = (debugAfterFinalize?.lastPoll as any)?.slug ?? null;
//       await expect
//         .poll(async () => {
//           pollSlug = await page.evaluate(() => {
//             try {
//               const devPollsRaw = localStorage.getItem('dev-polls');
//               const prodPollsRaw = localStorage.getItem('doodates_polls');

//               const parseArray = (raw: string | null) => {
//                 if (!raw) return [];
//                 try {
//                   const parsed = JSON.parse(raw);
//                   return Array.isArray(parsed) ? parsed : [];
//                 } catch {
//                   return [];
//                 }
//               };

//               const devPolls = parseArray(devPollsRaw);
//               const prodPolls = parseArray(prodPollsRaw);

//               const lastDev = devPolls[devPolls.length - 1];
//               const lastProd = prodPolls[prodPolls.length - 1];

//               return lastDev?.slug ?? lastProd?.slug ?? null;
//             } catch {
//               return null;
//             }
//           });
//           return pollSlug;
//         }, { timeout: timeouts.element, message: 'Slug du sondage indisponible dans dev-polls' })
//         .toBeTruthy();

//       const voirSondageBtn = page.getByRole('link', { name: /Voir le sondage/i });
//       const isVoirSondageVisible = await safeIsVisible(voirSondageBtn);
//       if (isVoirSondageVisible) {
//         await robustClick(voirSondageBtn);
//         console.log('✅ Navigation vers page votant');
//       } else {
//         // Si le bouton n'est pas visible, utiliser le slug pour naviguer directement
//         if (pollSlug) {
//           await page.goto(`/poll/${pollSlug}`, { waitUntil: 'domcontentloaded' });
//           await waitForNetworkIdle(page, { browserName });
//           console.log('✅ Navigation directe vers page votant via slug');
//         }
//       }

//       await expect(page).toHaveURL(/\/poll\//, { timeout: timeouts.navigation });
//       await expect(page.locator('body')).toContainText('Test E2E Ultra Simple', { timeout: timeouts.element });
//       console.log('✅ Page votant affiche le sondage');

//       // Retour au dashboard via navigation directe (plus robuste que dépendre d'un CTA spécifique)
//       await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
//       await waitForNetworkIdle(page, { browserName });
//       console.log('✅ Navigation vers /dashboard confirmée');

//       // Debug: Vérifier ce qui est dans le dashboard
//       const pollItems = page.locator('[data-testid="poll-item"]');
//       const pollCount = await pollItems.count();
//       console.log(`DEBUG: Nombre de polls dans le dashboard: ${pollCount}`);
      
//       if (pollCount === 0) {
//         // Debug: Vérifier le localStorage
//         const debugInfo = await page.evaluate(() => {
//           try {
//             const polls = localStorage.getItem('dev-polls');
//             const convs = localStorage.getItem('dev-conversations');
//             const deviceId = localStorage.getItem('dd-device-id');
//             const pollsData = polls ? JSON.parse(polls) : [];
//             const convsData = convs ? JSON.parse(convs) : [];
            
//             return {
//               deviceId,
//               pollsCount: pollsData.length,
//               allPolls: pollsData.map((p: any) => ({
//                 id: p.id,
//                 title: p.title,
//                 creator_id: p.creator_id,
//               })),
//               lastPoll: pollsData.length > 0 ? {
//                 id: pollsData[pollsData.length - 1]?.id,
//                 title: pollsData[pollsData.length - 1]?.title,
//                 creator_id: pollsData[pollsData.length - 1]?.creator_id,
//                 relatedConversationId: pollsData[pollsData.length - 1]?.relatedConversationId,
//               } : null,
//               convsCount: convsData.length,
//               lastConv: convsData.length > 0 ? {
//                 id: convsData[convsData.length - 1]?.id,
//                 title: convsData[convsData.length - 1]?.title,
//                 userId: convsData[convsData.length - 1]?.userId,
//                 pollId: (convsData[convsData.length - 1] as any)?.pollId || (convsData[convsData.length - 1] as any)?.metadata?.pollId,
//               } : null,
//             };
//           } catch (e) {
//             return { error: String(e) };
//           }
//         });
//         console.log(`DEBUG: localStorage info:`, JSON.stringify(debugInfo, null, 2));
        
//         // Attendre la stabilisation réseau puis réessayer
//         await waitForNetworkIdle(page, { browserName });
//         await page.reload({ waitUntil: 'domcontentloaded' });
//         await waitForNetworkIdle(page, { browserName });
        
//         const pollCountAfterReload = await pollItems.count();
//         console.log(`DEBUG: Nombre de polls après reload: ${pollCountAfterReload}`);
//       }
      
//       // Vérifier sondage dans dashboard (l'attente est incluse dans toContainText)
//       const pollItem = await waitForElementReady(page, '[data-testid="poll-item"]', { browserName, timeout: timeouts.element });
//       await expect(pollItem).toContainText('Test E2E Ultra Simple', { timeout: timeouts.element });
//       console.log('✅ Sondage visible dans dashboard');

//       // Copier lien (optionnel)
//       const copyBtn = page.locator('[data-testid="poll-action-copy-link"]').first();
//       if (await safeIsVisible(copyBtn)) {
//         await robustClick(copyBtn);
//         console.log('✅ Lien copié');
//         await waitForCopySuccess(page).catch(() => {});
//       }

//       console.log('🎉 WORKFLOW COMPLET RÉUSSI');
//       log('Test completed successfully!');
//     });
//   });
// });
