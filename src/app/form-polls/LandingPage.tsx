import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Check, ArrowRight, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Navigation Header */}
            <header className="border-b border-violet-900/20 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/form-polls" className="text-2xl font-bold text-violet-400">
                                DooDates2
                            </Link>
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link to="/form-polls/dashboard" className="text-gray-400 hover:text-violet-400 transition-colors">
                                Tableau de bord
                            </Link>
                            <Link to="/form-polls/pricing" className="text-gray-400 hover:text-white transition-colors">
                                Tarifs
                            </Link>
                            <Link to="/docs" className="text-gray-400 hover:text-white transition-colors">
                                Documentation
                            </Link>
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                Accueil DooDates
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                            <span className="block">Créez des formulaires</span>
                            <span className="block text-violet-500">puissants et intuitifs</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Collectez des avis, des inscriptions ou des feedbacks.
                            Analysez les réponses en temps réel avec des graphiques clairs.
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <Button
                                size="lg"
                                onClick={() => navigate("/create/form")}
                                className="w-full sm:w-auto flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105"
                            >
                                Créer un formulaire
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-[#1a1a1a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-white">
                            Tout ce dont vous avez besoin
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-violet-900/30">
                            <div className="w-12 h-12 bg-violet-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Settings className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">100% Personnalisable</h3>
                            <p className="text-gray-400">
                                Choix multiples, texte libre, échelles de notation... Adaptez chaque question à votre besoin.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-violet-900/30">
                            <div className="w-12 h-12 bg-violet-900/30 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Analyses Visuelles</h3>
                            <p className="text-gray-400">
                                Visualisez les tendances en un coup d'œil grâce à des graphiques générés automatiquement.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-violet-900/30">
                            <div className="w-12 h-12 bg-violet-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Check className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Facile à remplir</h3>
                            <p className="text-gray-400">
                                Une interface fluide pour vos répondants, sur mobile comme sur ordinateur.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};
