import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  ArrowRight,
  BarChart3,
  Settings,
  Sparkles,
  MessageSquare,
  Palette,
  MousePointer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";

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
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Diagonal lines pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              rgba(139, 92, 246, 0.5) 0px,
              rgba(139, 92, 246, 0.5) 1px,
              transparent 1px,
              transparent 40px
            )`,
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/form-polls" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Form Polls</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/form-polls/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/form-polls/documentation"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                to="/form-polls/pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Tarifs
              </Link>
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                ← DooDates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className={`transition-all duration-700 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300">Propulsé par l'IA</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Des formulaires
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                qui convertissent
              </span>
            </h1>

            <p className="text-center text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Créez des sondages intelligents en quelques secondes grâce à l'IA. Analysez les
              réponses avec des graphiques clairs et actionnables.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/create/form")}
                className="group relative px-8 py-6 text-base font-medium bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  Créer un formulaire
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                Voir une démo
              </button>
            </div>
          </div>

          {/* Visual Preview */}
          <div
            className={`mt-20 transition-all duration-1000 delay-300 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl">
                {/* Form mockup */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm text-violet-400 flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-3">
                        Quel est votre niveau de satisfaction ?
                      </p>
                      <div className="flex gap-2">
                        {["😡", "😕", "😐", "🙂", "😍"].map((emoji, i) => (
                          <div
                            key={emoji}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                              i === 4
                                ? "bg-violet-500/30 border-2 border-violet-500 scale-110"
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {emoji}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm text-violet-400 flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-3">
                        Recommanderiez-vous notre service ?
                      </p>
                      <div className="flex gap-2">
                        {["Oui", "Peut-être", "Non"].map((opt, i) => (
                          <div
                            key={opt}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              i === 0
                                ? "bg-violet-500/30 border border-violet-500"
                                : "bg-white/5 text-gray-400"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
              Création <span className="text-violet-400">IA</span> + Analyse{" "}
              <span className="text-fuchsia-400">visuelle</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Décrivez ce que vous voulez collecter, l'IA génère le formulaire parfait.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Génération IA",
                desc: "Décrivez votre besoin en langage naturel. L'IA crée les questions optimales.",
                gradient: "from-violet-500 to-violet-600",
              },
              {
                icon: Palette,
                title: "Types variés",
                desc: "QCM, échelles, texte libre, matrices... Tous les formats pour vos besoins.",
                gradient: "from-fuchsia-500 to-fuchsia-600",
              },
              {
                icon: BarChart3,
                title: "Analytics live",
                desc: "Graphiques générés en temps réel. Exportez en un clic vers Excel.",
                gradient: "from-purple-500 to-purple-600",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 ${
                  featureVisible[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Chart mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl opacity-30" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-medium">Réponses par jour</span>
                  <span className="text-sm text-gray-400">7 derniers jours</span>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {[40, 65, 45, 80, 95, 70, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-500"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {["L", "M", "M", "J", "V", "S", "D"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Analysez vos résultats <span className="text-fuchsia-400">en temps réel</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Chaque réponse apparaît instantanément dans votre dashboard. Identifiez les
                tendances, filtrez par segment, et prenez des décisions data-driven.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "2.3s", label: "Temps de réponse moyen" },
                  { value: "98%", label: "Taux de complétion" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="text-2xl font-bold text-violet-400 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à collecter des insights ?</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Créez votre premier formulaire en moins de 60 secondes grâce à l'IA.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/create/form")}
            className="px-10 py-6 text-base font-medium bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 rounded-xl shadow-lg shadow-violet-500/25"
          >
            Créer mon formulaire — Gratuit
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};
