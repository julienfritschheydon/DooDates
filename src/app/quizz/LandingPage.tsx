import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Brain,
  ArrowRight,
  Users,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  MousePointer,
  Target,
  Trophy,
  Camera,
  Mic,
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
  const [sidebarOpen, setSidebarOpen] = useState(true); // Menu ouvert par défaut

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="quizz" />
      
      {/* Contenu principal */}
      <div className="flex-1 text-white overflow-hidden">
        
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
        {/* Hexagon pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23f59e0b' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header - Simplifié sans liens dupliqués */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Quizz</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={cn("relative z-10 pb-32", sidebarOpen ? "pt-20" : "pt-6")}>
        <div className="max-w-6xl mx-auto px-6">
          <div
            className={`transition-all duration-700 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300">Aide aux devoirs intelligente</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Fichier → Quiz
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                en 3 secondes
              </span>
            </h1>

            <p className="text-center text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Importez une photo ou un PDF de devoir, l'IA génère un quiz interactif. Votre enfant répond,
              reçoit un feedback immédiat et un score encourageant.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ProductButton
                product="quizz"
                variantRole="primary"
                size="lg"
                onClick={() => navigate("/quizz/create")}
                className="group relative px-8 py-6 text-base font-medium bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 text-black"
              >
                <Camera className="w-5 h-5" />
                Créer un quiz
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </ProductButton>
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
                {/* Quiz mockup */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-400">Question 3/5</span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">
                    Combien font 2 dizaines et 3 unités ?
                  </h3>
                  <p className="text-sm text-gray-400">Importé automatiquement du fichier</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {["23", "32", "5", "203"].map((answer, i) => (
                    <div
                      key={answer}
                      className={`p-4 rounded-xl text-center font-medium transition-all ${
                        i === 0
                          ? "bg-amber-500/20 border-2 border-amber-500 text-amber-300"
                          : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {answer}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">Correct ! 2 dizaines = 20, + 3 unités = 23</span>
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
              L'aide aux devoirs <span className="text-amber-400">réinventée</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Plus besoin de corriger à la main. L'IA fait le travail, vous profitez du temps gagné.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: "Fichier → Questions",
                desc: "Importez une photo ou un PDF de devoir. L'IA extrait et transforme en questions interactives.",
                gradient: "from-amber-500 to-amber-600",
              },
              {
                icon: Mic,
                title: "Dictée vocale",
                desc: "Votre enfant peut répondre en parlant. Parfait pour les plus jeunes.",
                gradient: "from-yellow-500 to-yellow-600",
              },
              {
                icon: Trophy,
                title: "Feedback motivant",
                desc: "Score en %, messages d'encouragement, confettis sur bon score. L'apprentissage devient fun !",
                gradient: "from-orange-500 to-orange-600",
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

      {/* How it works */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ça <span className="text-yellow-400">marche ?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                num: "1",
                emoji: "📄",
                title: "Importez un devoir",
                desc: "Ajoutez une photo ou un fichier PDF de l'exercice à réviser.",
              },
              {
                num: "2",
                emoji: "🤖",
                title: "L'IA analyse",
                desc: "Gemini Vision extrait les questions et génère les réponses.",
              },
              {
                num: "3",
                emoji: "✏️",
                title: "L'enfant répond",
                desc: "Interface simple, une question à la fois, avec feedback immédiat.",
              },
              {
                num: "4",
                emoji: "🏆",
                title: "Célébration !",
                desc: "Score final, message d'encouragement, confettis si > 75%.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`text-center transition-all duration-500 ${
                  stepVisible[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4">{step.emoji}</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-sm font-bold mx-auto mb-4 text-black">
                  {step.num}
                </div>
                <h4 className="font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Use case */}
      <section className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Illustration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur-3xl opacity-30" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">
                    👧
                  </div>
                  <div>
                    <div className="font-medium">Léa, 8 ans</div>
                    <div className="text-sm text-gray-400">Quiz de maths - CE2</div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Combien font 7 × 8 ? → 56 </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm">45 + 27 = ? → 72 </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm">100 - 36 = ? → 64 </span>
                  </div>
                </div>

                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                  <div className="text-3xl font-bold text-amber-400 mb-1">100%</div>
                  <div className="text-sm text-gray-300">
                    🏆 Exceptionnel ! Tu es une championne !
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transformez les devoirs en <span className="text-amber-400">moment ludique</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Plus de stress pour corriger. Plus de "j'ai pas envie de faire mes devoirs".
                L'interface gamifiée motive les enfants à apprendre en s'amusant.
              </p>
              <div className="space-y-4">
                {[
                  "Création en 30 secondes depuis un fichier de devoir",
                  "Feedback immédiat après chaque réponse",
                  "Validation IA pour les réponses complexes",
                  "Fonctionne sur téléphone et tablette",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-gray-300">{item}</span>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à révolutionner les devoirs ?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Importez, générez, faites jouer. C'est aussi simple que ça.
          </p>
          <ProductButton
            product="quizz"
            variantRole="primary"
            size="lg"
            onClick={() => navigate("/quizz/create")}
            className="px-10 py-6 text-base font-medium bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 rounded-xl shadow-lg shadow-amber-500/25 text-black"
          >
            <Camera className="w-5 h-5 mr-2" />
            Créer mon premier quiz  — Gratuit
          </ProductButton>
        </div>
      </section>

        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
