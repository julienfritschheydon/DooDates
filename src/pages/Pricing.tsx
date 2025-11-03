import { useState } from "react";
import { Check, X, Sparkles, Zap, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/create");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Un prix simple, transparent
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          De l'essai gratuit aux fonctionnalités pro, choisissez ce qui vous convient
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
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              -10%
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
          period="Toujours gratuit"
          description="Découvrez DooDates et créez vos premiers sondages IA"
          features={[
            { text: "20 crédits IA/mois", included: true, highlight: true },
            { text: "20 sondages max", included: true },
            { text: "Export CSV, PDF, JSON, Markdown", included: true },
            { text: "Dashboard complet", included: true },
            { text: "Partage illimité", included: true },
            { text: "Customisation", included: false },
            { text: "Intégrations", included: false },
            { text: "Support garanti", included: false },
          ]}
          cta="Commencer gratuitement"
          onCTA={handleGetStarted}
          highlighted={false}
        />

        {/* Tier Premium */}
        <PricingCard
          icon={<Zap className="w-6 h-6" />}
          name="Premium"
          price={billingCycle === "monthly" ? "9" : "8.25"}
          period={billingCycle === "monthly" ? "/mois" : "/mois (99€/an)"}
          description="Pour les utilisateurs réguliers et professionnels"
          features={[
            { text: "100 crédits IA/mois", included: true, highlight: true },
            { text: "100 sondages max", included: true },
            { text: "Export Excel + Google Sheets", included: true },
            { text: "Customisation (couleurs, logo)", included: true },
            { text: "Support email sous 7 jours", included: true },
            {
              text: billingCycle === "annual" ? "Rollover 1200 crédits/an" : "Reset mensuel",
              included: true,
              highlight: billingCycle === "annual",
            },
            { text: "Intégrations avancées", included: false },
            { text: "White-label", included: false },
          ]}
          cta={user ? "Passer en Premium" : "Essayer Premium"}
          onCTA={() => handleUpgrade("premium", billingCycle)}
          highlighted={true}
        />

        {/* Tier Pro */}
        <PricingCard
          icon={<Rocket className="w-6 h-6" />}
          name="Pro"
          price={billingCycle === "monthly" ? "29" : "24.90"}
          period={billingCycle === "monthly" ? "/mois" : "/mois (299€/an)"}
          description="Usage intensif pour agences et entreprises"
          features={[
            { text: "1000 crédits IA/mois", included: true, highlight: true },
            { text: "Sondages illimités", included: true, highlight: true },
            { text: "Tous les exports", included: true },
            { text: "Customisation complète + domaine", included: true },
            { text: "Intégrations (Slack, API, Zapier)", included: true },
            { text: "White-label disponible", included: true },
            { text: "Support prioritaire sous 2 jours", included: true },
            {
              text: billingCycle === "annual" ? "Rollover 12000 crédits/an" : "Reset mensuel",
              included: true,
              highlight: billingCycle === "annual",
            },
          ]}
          cta={user ? "Passer en Pro" : "Essayer Pro"}
          onCTA={() => handleUpgrade("pro", billingCycle)}
          highlighted={false}
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

      {/* Credit Packs */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Besoin de crédits supplémentaires ?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <CreditPackCard credits={50} price={3} />
          <CreditPackCard credits={100} price={5} highlighted />
          <CreditPackCard credits={500} price={20} />
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
          Packs valables 6 mois après achat
        </p>
      </div>

      {/* FAQ */}
      <PricingFAQ />

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
  );
}

// ================================================
// Composant Card
// ================================================

interface PricingCardProps {
  icon: React.ReactNode;
  name: string;
  price: string;
  period: string;
  description: string;
  features: Array<{ text: string; included: boolean; highlight?: boolean }>;
  cta: string;
  onCTA: () => void;
  highlighted?: boolean;
}

function PricingCard({
  icon,
  name,
  price,
  period,
  description,
  features,
  cta,
  onCTA,
  highlighted,
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h3>
      </div>

      <div className="mb-4">
        <span className="text-5xl font-bold text-gray-900 dark:text-white">{price}€</span>
        <span className="text-gray-600 dark:text-gray-400">{period}</span>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>

      <Button className="w-full mb-6" variant={highlighted ? "default" : "outline"} onClick={onCTA}>
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
// Composant Credit Pack
// ================================================

function CreditPackCard({
  credits,
  price,
  highlighted,
}: {
  credits: number;
  price: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 text-center transition-transform hover:scale-105 ${
        highlighted
          ? "ring-2 ring-blue-600 dark:ring-blue-500"
          : "border border-gray-200 dark:border-gray-700"
      }`}
    >
      {highlighted && (
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
          Meilleur rapport
        </div>
      )}
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{credits} crédits</div>
      <div className="text-2xl text-gray-900 dark:text-white mb-4">{price}€</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {(price / credits).toFixed(3)}€/crédit
      </div>
      <Button variant="outline" className="w-full" disabled>
        Bientôt disponible
      </Button>
    </div>
  );
}

// ================================================
// FAQ Component
// ================================================

function PricingFAQ() {
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
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm cursor-pointer group"
          >
            <summary className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {faq.q}
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
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
