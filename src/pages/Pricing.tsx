import { useState, useEffect } from "react";
import { Check, X, Sparkles, Zap, Rocket, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { AuthModal } from "@/components/modals/AuthModal";
import { CreatePageLayout } from "@/components/layout/CreatePageLayout";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { pricingService, Price } from "@/services/pricing-service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TopNavGemini from "@/components/prototype/TopNavGemini";

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const currentTier = profile?.plan_type || "free";

  // Regional Pricing State
  const { geo } = useGeoLocation();
  const [prices, setPrices] = useState<Price[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("€");
  const [regionName, setRegionName] = useState("");

  useEffect(() => {
    const fetchPrices = async () => {
      // Default to EU/FR if no geo
      const countryCode = geo?.country || "FR";
      const regionId = await pricingService.getRegionForCountry(countryCode);
      const regionPrices = await pricingService.getPricingForRegion(regionId);

      if (regionPrices.length > 0) {
        setPrices(regionPrices);
        setCurrencySymbol(regionPrices[0].currency_symbol);
        setRegionName(regionId === "EU" ? "Europe" : regionId);
      }
    };

    fetchPrices();
  }, [geo]);

  // Helper to get price
  const getPrice = (productId: string, defaultPrice: string) => {
    const price = prices.find((p) => p.product_id === productId);
    return price ? price.amount.toString() : defaultPrice;
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(`/workspace/date?new=${Date.now()}`);
    } else {
      localStorage.setItem("doodates-return-to", `/create/date?new=${Date.now()}`);
      setAuthMode("signup");
      setShowAuthModal(true);
    }
  };

  const handleSignIn = () => {
    localStorage.setItem("doodates-return-to", "/pricing");
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  return (
    <CreatePageLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-8">
        <div className="py-12 px-4">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Un prix simple, transparent
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              De l'essai gratuit aux fonctionnalités pro, choisissez ce qui vous convient
              {regionName && (
                <span className="block text-sm mt-2 text-blue-600 dark:text-blue-400">
                  Tarifs adaptés pour : {regionName}
                </span>
              )}
            </p>

            {/* Toggle Monthly/Annual */}
            <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === "annual"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Annuel
                <span className="ml-2 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full font-semibold">
                  Économisez 10%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
            {/* Tier Gratuit */}
            <PricingCard
              icon={<Sparkles className="w-6 h-6" />}
              name="Gratuit"
              price="0"
              currency={currencySymbol}
              period=" Toujours gratuit"
              description="Utilisateurs occasionnels"
              features={[
                { text: "20 crédits IA/mois", included: true, highlight: true },
                { text: "20 sondages max", included: true },
                // { text: "Export CSV, PDF, JSON, Markdown", included: true },
                { text: "Dashboard complet", included: true },
                { text: "Partage illimité", included: true },
                // { text: "Customisation", included: false },
                // { text: "Intégrations", included: false },
                { text: "Support garanti", included: false },
              ]}
              cta={currentTier === "free" ? "Plan actuel" : "Commencer gratuitement"}
              onCTA={currentTier === "free" ? () => {} : handleGetStarted}
              highlighted={false}
              isCurrentPlan={currentTier === "free"}
            />

            {/* Tier Premium */}
            <PricingCard
              icon={<Zap className="w-6 h-6" />}
              name="Premium"
              price={
                billingCycle === "monthly"
                  ? getPrice("premium_monthly", "9")
                  : getPrice("premium_yearly", "99")
              } // Note: logic simplified for demo
              currency={currencySymbol}
              period={billingCycle === "monthly" ? "/mois" : `/an`}
              description="Utilisateurs réguliers"
              features={[
                { text: "100 crédits IA/mois", included: true, highlight: true },
                { text: "100 sondages max", included: true },
                // { text: "Export Excel + Google Sheets", included: true },
                // { text: "Customisation (couleurs, logo)", included: true },
                { text: "Support email standard", included: true },
                {
                  text: billingCycle === "annual" ? "Rollover 1200 crédits/an" : "Reset mensuel",
                  included: true,
                  highlight: billingCycle === "annual",
                },
                // { text: "Intégrations avancées", included: false },
                // { text: "White-label", included: false },
              ]}
              cta={
                currentTier === "premium"
                  ? "Plan actuel"
                  : user
                    ? "Passer en Premium"
                    : "Essayer Premium"
              }
              onCTA={
                currentTier === "premium" ? () => {} : () => handleUpgrade("premium", billingCycle)
              }
              highlighted={true}
              betaBadge={true}
              trialDays={7}
              isCurrentPlan={currentTier === "premium"}
            />

            {/* Tier Pro */}
            <PricingCard
              icon={<Rocket className="w-6 h-6" />}
              name="Pro"
              price={
                billingCycle === "monthly"
                  ? getPrice("pro_monthly", "29")
                  : getPrice("pro_yearly", "299")
              }
              currency={currencySymbol}
              period={billingCycle === "monthly" ? "/mois" : `/an`}
              description="Utilisateurs professionnels"
              features={[
                { text: "1000 crédits IA/mois", included: true, highlight: true },
                { text: "Sondages illimités", included: true, highlight: true },
                // { text: "Tous les exports", included: true },
                // { text: "Customisation complète + domaine", included: true },
                // { text: "Intégrations (Slack, API, Zapier)", included: true },
                // { text: "White-label disponible", included: true },
                { text: "Support prioritaire", included: true },
                {
                  text: billingCycle === "annual" ? "Rollover 12000 crédits/an" : "Reset mensuel",
                  included: true,
                  highlight: billingCycle === "annual",
                },
              ]}
              cta={currentTier === "pro" ? "Plan actuel" : user ? "Passer en Pro" : "Essayer Pro"}
              onCTA={currentTier === "pro" ? () => {} : () => handleUpgrade("pro", billingCycle)}
              highlighted={false}
              betaBadge={true}
              isCurrentPlan={currentTier === "pro"}
            />
          </div>

          {/* Beta Tester Banner */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Programme Beta Testeur
              </h2>
              <p className="text-gray-700 dark:text-gray-200 mb-6">
                Vous avez reçu une clé beta ? Activez-la pour obtenir{" "}
                <strong>1000 crédits/mois pendant 3 mois</strong> + toutes les fonctionnalités Pro
                gratuitement !
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/settings")}
                className="bg-white dark:bg-gray-800"
              >
                Activer ma clé beta
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* FAQ */}
          <PricingFAQ
            showAuthModal={showAuthModal}
            setShowAuthModal={setShowAuthModal}
            authMode={authMode}
          />

          {/* CTA Final */}
          <div className="max-w-4xl mx-auto text-center bg-blue-600 dark:bg-blue-700 text-white rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Prêt à créer votre premier sondage IA ?</h2>
            <p className="text-xl mb-8 opacity-90">
              Commencez gratuitement, aucune carte bancaire requise
            </p>
            <Button size="lg" variant="secondary" onClick={handleGetStarted}>
              Essayer gratuitement
            </Button>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} defaultMode={authMode} />
      </div>
    </CreatePageLayout>
  );
}

// ================================================
// Composant Card
// ================================================

interface PricingCardProps {
  icon: React.ReactNode;
  name: string;
  price: string;
  currency?: string;
  period: string;
  description: string;
  features: Array<{ text: string; included: boolean; highlight?: boolean }>;
  cta: string;
  onCTA: () => void;
  highlighted?: boolean;
  betaBadge?: boolean;
  trialDays?: number;
  isCurrentPlan?: boolean;
}

function PricingCard({
  icon,
  name,
  price,
  currency = "€",
  period,
  description,
  features,
  cta,
  onCTA,
  highlighted,
  betaBadge,
  trialDays,
  isCurrentPlan,
}: PricingCardProps) {
  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-transform hover:scale-105 ${
        highlighted ? "ring-4 ring-blue-600 dark:ring-blue-500" : ""
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          Le plus populaire
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h3>
          {betaBadge && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-semibold">
              Bêta
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-5xl font-bold text-gray-900 dark:text-white">
          {price}
          {currency}
        </span>
        <span className="text-gray-600 dark:text-gray-400">{period}</span>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>

      <Button
        className="w-full mb-6"
        variant={isCurrentPlan ? "secondary" : highlighted ? "default" : "outline"}
        onClick={onCTA}
        disabled={isCurrentPlan}
      >
        {cta}
      </Button>

      <div className="space-y-3">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            <span
              className={`${
                feature.included
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
              } ${feature.highlight ? "font-semibold" : ""}`}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================
// FAQ Component
// ================================================

interface PricingFAQProps {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: "signin" | "signup";
}

function PricingFAQ({ showAuthModal, setShowAuthModal, authMode }: PricingFAQProps) {
  const faqs = [
    {
      q: "Qu'est-ce qu'un crédit IA ?",
      a: "1 crédit = 1 action IA (message chat, query analytics, ou 1/5 de simulation). Utilisez-les comme vous voulez ! Vous gardez le contrôle total de votre budget.",
    },
    {
      q: "Les crédits expirent ?",
      a: "Oui, chaque mois pour les plans mensuels. Mais avec un abonnement annuel, vos crédits s'accumulent sur 12 mois ! Parfait pour les pics d'activité.",
    },
    {
      q: "Puis-je changer de plan ?",
      a: "Oui, à tout moment ! Upgrade immédiat, downgrade effectif à la fin de la période en cours. Aucun engagement.",
    },
    {
      q: "Que se passe-t-il si je dépasse ?",
      a: "Pas de surcharge surprise ! Vous pouvez acheter des packs de crédits additionnels ou upgrader votre plan. Vous gardez le contrôle.",
    },
    {
      q: "Y a-t-il des frais cachés ?",
      a: "Aucun ! Ce que vous voyez est ce que vous payez. Pas de frais de setup, pas de frais par réponse, pas de frais par export. Transparence totale.",
    },
    {
      q: "Comment fonctionne le programme beta ?",
      a: "Les beta testeurs reçoivent une clé d'accès pour 1000 crédits/mois pendant 3 mois + toutes les fonctionnalités Pro. Après 3 mois, conversion automatique vers le plan Gratuit avec offre exclusive Premium à -50%.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
        Questions fréquentes
      </h2>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            value={`item-${idx}`}
            className="bg-white dark:bg-gray-800 rounded-lg px-6 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-gray-900 dark:text-white text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// ================================================
// Helper Function
// ================================================

function handleUpgrade(tier: "premium" | "pro", cycle: "monthly" | "annual") {
  // TODO: Implémenter Stripe checkout
  console.log(`Upgrade to ${tier} ${cycle}`);
  alert(`Fonctionnalité de paiement bientôt disponible !\n\nTier: ${tier}\nCycle: ${cycle}`);
}
