import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  Users,
  Zap,
  Sparkles,
  CheckCircle2,
  Calendar,
  MousePointer,
  CalendarDays,
  Layers,
  Globe,
} from "lucide-react";
import { ProductButton } from "@/components/products/ProductButton";
import { Footer } from "@/components/shared/Footer";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";
import { cn } from "@/lib/utils";

// Animation staggered pour les éléments
const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < itemCount; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * delay),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [itemCount, delay]);

  return visibleItems;
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const featureVisible = useStaggeredAnimation(3, 150);
  const stepVisible = useStaggeredAnimation(3, 200);
  const [heroVisible, setHeroVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // État du menu

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Sur desktop, le menu est toujours ouvert. Sur mobile, on peut le fermer.
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="date" />

      {/* Contenu principal */}
      <div className="flex-1 text-white overflow-hidden">

        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Navigation Header - Simplifié sans liens dupliqués */}
        <header className="relative z-10 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold tracking-tight">Date Polls</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className={cn("relative z-10 pb-32", sidebarOpen ? "pt-20" : "pt-6")}>
          <div className="max-w-6xl mx-auto px-6">
            <div
              className={`transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">Planification intelligente</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Trouvez la date
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  parfaite
                </span>
              </h1>

              <p className="text-center text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                Fini les allers-retours par email. Proposez des dates, laissez voter, et notre IA
                suggère le créneau idéal.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ProductButton
                  product="date"
                  variantRole="primary"
                  size="lg"
                  onClick={() => navigate("/create/date")}
                  className="group relative px-8 py-6 text-base font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Créer un sondage
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </ProductButton>
              </div>
            </div>

            {/* Visual Preview */}
            <div
              className={`mt-20 transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
            >
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg" />
                  </div>
                  {/* Calendar mockup */}
                  <div className="grid grid-cols-7 gap-2">
                    {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                      <div key={day + i} className="text-center text-xs text-gray-400 pb-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${[4, 5, 11, 12, 18, 19].includes(i)
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : i === 11
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-white/[0.02] text-gray-400 hover:bg-white/5"
                          }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple. Rapide. <span className="text-blue-400">Intelligent.</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Tout ce dont vous avez besoin pour organiser vos événements sans friction.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: "Sélection intuitive",
                  desc: "Cliquez sur les dates, ajoutez des horaires optionnels. C'est tout.",
                  color: "blue",
                },
                {
                  icon: Users,
                  title: "Votes anonymes ou nominatifs",
                  desc: "Choisissez qui peut voir les réponses des autres participants.",
                  color: "cyan",
                },
                {
                  icon: Zap,
                  title: "Suggestion IA",
                  desc: "Notre algorithme identifie le créneau qui maximise la participation.",
                  color: "purple",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-${feature.color}-500/20 transition-all duration-500 ${featureVisible[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-8">
                  3 étapes, <span className="text-cyan-400">zéro friction</span>
                </h2>

                <div className="space-y-8">
                  {[
                    {
                      num: "01",
                      title: "Proposez des dates",
                      desc: "Sélectionnez vos options dans le calendrier. Ajoutez des horaires si besoin.",
                    },
                    {
                      num: "02",
                      title: "Partagez le lien",
                      desc: "Un lien unique à envoyer par email, Slack, WhatsApp... où vous voulez.",
                    },
                    {
                      num: "03",
                      title: "Décidez ensemble",
                      desc: "Visualisez les votes et fixez la date gagnante en un clic.",
                    },
                  ].map((step, i) => (
                    <div
                      key={step.num}
                      className={`flex gap-6 transition-all duration-500 ${stepVisible[i] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                        }`}
                      style={{ transitionDelay: `${i * 150}ms` }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
                        {step.num}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{step.title}</h4>
                        <p className="text-gray-400 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Illustration */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl opacity-30" />
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="font-medium">Réunion d'équipe - Janvier</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { date: "Lundi 13", votes: 8, percent: 100 },
                      { date: "Mardi 14", votes: 5, percent: 62 },
                      { date: "Jeudi 16", votes: 3, percent: 37 },
                    ].map((option) => (
                      <div key={option.date} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{option.date}</span>
                            <span className="text-gray-400">{option.votes} votes</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${option.percent === 100 ? "bg-green-500" : "bg-blue-500"
                                }`}
                              style={{ width: `${option.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative z-10 py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à simplifier vos planifications ?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Rejoignez des milliers d'équipes qui ont dit adieu aux emails interminables.
            </p>
            <ProductButton
              product="date"
              variantRole="primary"
              size="lg"
              onClick={() => navigate("/create/date")}
              className="px-10 py-6 text-base font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-blue-500/25"
            >
              Créer mon premier sondage — Gratuit
            </ProductButton>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};
