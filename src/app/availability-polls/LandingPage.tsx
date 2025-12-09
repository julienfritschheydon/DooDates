import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  Users,
  CalendarDays,
  Sparkles,
  Globe,
  Layers,
  MousePointer,
} from "lucide-react";
import { ProductButton } from "@/components/products/ProductButton";
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
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.8) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] -translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px] translate-y-1/3 translate-x-1/3" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/availability-polls" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Availability</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/availability-polls/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/availability-polls/documentation"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                to="/availability-polls/pricing"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Synchronisation intelligente</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Vos agendas,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                enfin synchronisés
              </span>
            </h1>

            <p className="text-center text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Définissez une plage, partagez le lien. Chacun indique ses disponibilités et vous
              voyez instantanément les créneaux communs.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ProductButton
                product="availability"
                variantRole="primary"
                size="lg"
                onClick={() => navigate("/create/availability")}
                className="group relative px-8 py-6 text-base font-medium bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  Créer une disponibilité
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </ProductButton>
            </div>
          </div>

          {/* Visual Preview - Weekly Grid */}
          <div
            className={`mt-20 transition-all duration-1000 delay-300 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 shadow-2xl">
                {/* Week grid mockup */}
                <div className="grid grid-cols-8 gap-2">
                  {/* Header */}
                  <div className="text-xs text-gray-500"></div>
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-400 pb-2">
                      {day}
                    </div>
                  ))}
                  {/* Time slots */}
                  {["9h", "10h", "11h", "12h", "14h", "15h", "16h", "17h"].map((time, timeIdx) => (
                    <React.Fragment key={time}>
                      <div className="text-xs text-gray-500 flex items-center">{time}</div>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        // Simulated availability data
                        const isAvailable =
                          (timeIdx < 4 && dayIdx < 5) || // Morning weekdays
                          (timeIdx >= 4 && dayIdx >= 1 && dayIdx <= 3); // Afternoon Tue-Thu
                        const isOverlap =
                          (timeIdx === 2 && dayIdx === 2) ||
                          (timeIdx === 3 && dayIdx === 2) ||
                          (timeIdx === 4 && dayIdx === 2);
                        return (
                          <div
                            key={`${time}-${dayIdx}`}
                            className={`h-8 rounded transition-all ${
                              isOverlap
                                ? "bg-emerald-500/40 border border-emerald-500"
                                : isAvailable
                                  ? "bg-emerald-500/15"
                                  : "bg-white/[0.02]"
                            }`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-4 h-4 rounded bg-emerald-500/15" />
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-4 h-4 rounded bg-emerald-500/40 border border-emerald-500" />
                    <span>Créneau commun</span>
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
              Conçu pour les <span className="text-emerald-400">équipes modernes</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Que vous soyez 2 ou 200, trouvez le créneau idéal sans effort.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Vue semaine intuitive",
                desc: "Sélectionnez vos créneaux en glissant sur la grille. Simple comme un calendrier.",
                gradient: "from-emerald-500 to-emerald-600",
              },
              {
                icon: Layers,
                title: "Superposition visuelle",
                desc: "Les créneaux communs apparaissent en surbrillance. Impossible de les rater.",
                gradient: "from-teal-500 to-teal-600",
              },
              {
                icon: Globe,
                title: "Fuseaux horaires",
                desc: "Équipes internationales ? Chacun voit la grille dans son fuseau horaire local.",
                gradient: "from-cyan-500 to-cyan-600",
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

      {/* Use Cases */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Idéal pour <span className="text-teal-400">toutes les situations</span>
              </h2>

              <div className="space-y-6">
                {[
                  {
                    emoji: "👥",
                    title: "Réunions d'équipe",
                    desc: "Trouvez le créneau où tout le monde est disponible.",
                  },
                  {
                    emoji: "🎓",
                    title: "Cours & Tutorat",
                    desc: "Partagez vos disponibilités avec vos étudiants.",
                  },
                  {
                    emoji: "💼",
                    title: "Entretiens",
                    desc: "Laissez les candidats choisir parmi vos créneaux libres.",
                  },
                ].map((useCase) => (
                  <div key={useCase.title} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                      {useCase.emoji}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">{useCase.title}</h4>
                      <p className="text-gray-400 text-sm">{useCase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl opacity-30" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">5 participants</span>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Marie", slots: 12, color: "emerald" },
                    { name: "Thomas", slots: 8, color: "teal" },
                    { name: "Julie", slots: 15, color: "cyan" },
                    { name: "Lucas", slots: 10, color: "green" },
                    { name: "Emma", slots: 11, color: "emerald" },
                  ].map((person) => (
                    <div key={person.name} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full bg-${person.color}-500/20 flex items-center justify-center text-sm font-medium text-${person.color}-400`}
                      >
                        {person.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{person.name}</span>
                          <span className="text-gray-400">{person.slots} créneaux</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-${person.color}-500`}
                            style={{ width: `${(person.slots / 15) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                  <span className="text-sm text-emerald-400">✓ 3 créneaux communs trouvés</span>
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
            Synchronisez vos équipes aujourd'hui
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Fini le ping-pong d'emails. En quelques clics, trouvez le créneau parfait.
          </p>
          <ProductButton
            product="availability"
            variantRole="primary"
            size="lg"
            onClick={() => navigate("/create/availability")}
            className="px-10 py-6 text-base font-medium bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-lg shadow-emerald-500/25"
          >
            Créer ma disponibilité Gratis
          </ProductButton>
        </div>
      </section>

      <Footer />
    </div>
  );
};
