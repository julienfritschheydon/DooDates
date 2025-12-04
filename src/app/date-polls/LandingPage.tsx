import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Check, ArrowRight, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";


export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Navigation Header */}
            <header className="border-b border-blue-900/20 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/date-polls" className="text-2xl font-bold text-blue-400">
                                DooDates1
                            </Link>
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link to="/date-polls/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors">
                                Tableau de bord
                            </Link>
                            <Link to="/date-polls/pricing" className="text-gray-400 hover:text-white transition-colors">
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
                            <span className="block">Planifiez vos événements</span>
                            <span className="block text-blue-500">sans les allers-retours</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Trouvez la date parfaite pour vos réunions, dîners ou événements d'équipe.
                            Laissez les participants voter et notre IA vous suggérer le meilleur créneau.
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <Button
                                size="lg"
                                onClick={() => navigate("/create/date")}
                                className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105"
                            >
                                Créer un sondage
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
                            Pourquoi utiliser nos Sondages de Dates ?
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-blue-900/30">
                            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Simple & Rapide</h3>
                            <p className="text-gray-400">
                                Créez un sondage en quelques secondes. Sélectionnez les dates, partagez le lien, et c'est parti.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-blue-900/30">
                            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Collaboratif</h3>
                            <p className="text-gray-400">
                                Invitez autant de participants que vous le souhaitez. Tout le monde voit les disponibilités des autres.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-xl shadow-sm border border-blue-900/30">
                            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Intelligent</h3>
                            <p className="text-gray-400">
                                Notre algorithme met en avant les meilleures options pour maximiser la présence.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-16 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Comment ça marche ?
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Proposez des dates</h4>
                                        <p className="text-gray-400">Sélectionnez plusieurs options dans le calendrier.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Partagez le lien</h4>
                                        <p className="text-gray-400">Envoyez le lien unique à vos participants par email ou messagerie.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Validez la meilleure option</h4>
                                        <p className="text-gray-400">Visualisez les résultats et fixez la date finale en un clic.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-900/10 rounded-2xl p-8 h-80 flex items-center justify-center border border-blue-900/30">
                            <Calendar className="w-32 h-32 text-blue-400/30" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Footer */}
            <Footer />
        </div>
    );
};
