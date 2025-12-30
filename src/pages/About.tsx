import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/shared/Footer";
import { Calendar, CheckCircle2, Users, Zap, Heart, Shield, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
      <TopNav />

      {/* Hero Section */}
      <div className="pt-32 pb-16 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          À propos de DooDates
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Nous réinventons la planification d'événements pour la rendre simple, intelligente et
          collaborative.
        </p>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="bg-gray-800/50 rounded-2xl p-8 md:p-12 border border-gray-700/50 shadow-sm backdrop-blur-sm max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center shrink-0 ring-1 ring-blue-700/50">
              <Rocket className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-white mb-4">Notre Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Dans un monde où le temps est précieux, DooDates a pour mission d'éliminer les
                frictions de l'organisation. Que ce soit pour une réunion d'équipe, un dîner entre
                amis ou un événement complexe, notre outil boosté par l'IA vous aide à trouver le
                moment parfait, sans les centaines d'emails.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nos Valeurs Grid */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Nos Valeurs</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Simplicité */}
          <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700 hover:bg-gray-800/50 transition-colors">
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Simplicité Radicale</h3>
            <p className="text-gray-400">
              Nous croyons que les outils puissants doivent rester intuitifs. Pas de configuration
              complexe, juste de l'efficacité.
            </p>
          </div>

          {/* Collaboration */}
          <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700 hover:bg-gray-800/50 transition-colors">
            <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Collaboration Humaine</h3>
            <p className="text-gray-400">
              La technologie doit rapprocher les gens, pas les éloigner. Nous facilitons le
              consensus et la prise de décision collective.
            </p>
          </div>

          {/* Innovation */}
          <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700 hover:bg-gray-800/50 transition-colors">
            <div className="w-12 h-12 bg-amber-900/30 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Innovation Utile</h3>
            <p className="text-gray-400">
              L'IA n'est pas un gadget chez nous. Elle est au service de votre productivité pour
              automatiser les tâches fastidieuses.
            </p>
          </div>
        </div>
      </div>

      {/* Stats / Story */}
      <div className="container mx-auto px-4 py-12 mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">L'Histoire de DooDates</h2>
            <p className="text-gray-300 leading-relaxed">
              Né d'une frustration commune face aux chaînes d'emails interminables pour fixer une
              simple date, DooDates a commencé comme un projet passionné.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Aujourd'hui, nous aidons des milliers d'équipes et de groupes d'amis à se retrouver.
              Nous restons fidèles à notre promesse initiale :{" "}
              <strong>Organiser moins, vivre plus.</strong>
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-blue-300">
                <Heart className="w-5 h-5" /> Code & Passion
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <Shield className="w-5 h-5" /> Privacy First
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-10 h-10 text-blue-500" />
                <div>
                  <div className="font-bold text-white">DooDates Meeting</div>
                  <div className="text-sm text-gray-500">Créé il y a 2 min</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                <div className="h-2 bg-gray-700 rounded w-full"></div>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800"
                    ></div>
                  ))}
                </div>
                <div className="text-green-400 font-bold text-sm">Date trouvée ! 🚀</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-8">
          Prêt à simplifier votre organisation ?
        </h2>
        <div className="flex justify-center gap-4">
          <Link to="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
