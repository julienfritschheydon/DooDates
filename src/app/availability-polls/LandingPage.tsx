import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Clock, Check, ArrowRight, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Navigation Header */}
            <header className="border-b border-emerald-900/20 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/availability-polls" className="text-2xl font-bold text-emerald-400">
                                DooDates3
                            </Link>
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link to="/availability-polls/dashboard" className="text-gray-400 hover:text-emerald-400 transition-colors">
                                Tableau de bord
                            </Link>
                            <Link to="/availability-polls/pricing" className="text-gray-400 hover:text-white transition-colors">
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
                            <span className="block">Synchronisez vos agendas</span>
                            <span className="block text-emerald-500">en toute simplicité</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Fini le casse-tête des emplois du temps.
                            Définissez une plage horaire et laissez chacun indiquer ses disponibilités.
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <Button
                                size="lg"
                                onClick={() => navigate("/create/availability")}
                                className="w-full sm:w-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105"
                            >
                                Créer une disponibilité
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
                            La solution idéale pour les équipes
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-emerald-900/30">
                            <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                                <CalendarDays className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Vue Semaine</h3>
                            <p className="text-gray-400">
                                Visualisez la semaine complète et sélectionnez vos créneaux libres en un glissement de souris.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-emerald-900/30">
                            <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Superposition</h3>
                            <p className="text-gray-400">
                                Voyez instantanément où les disponibilités de l'équipe se chevauchent.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-emerald-900/30">
                            <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Fuseaux Horaires</h3>
                            <p className="text-gray-400">
                                Gérez facilement les équipes internationales avec la conversion automatique des fuseaux horaires.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};
