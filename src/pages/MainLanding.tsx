import React from "react";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle2, FileText, ArrowRight, Sparkles, Brain } from "lucide-react";

export default function MainLanding() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="font-bold text-white">D</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                DooDates
                            </span>
                        </div>

                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">La suite complète de planification</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        Planifiez <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">simplement</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Une suite d'outils puissants pour organiser vos réunions, collecter des informations et gérer vos disponibilités.
                    </p>
                </div>

                {/* Product Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {/* Date Polls */}
                    <Link
                        to="/date-polls"
                        className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">Sondages de Dates</h3>
                            <p className="text-gray-400 text-sm mb-4 min-h-[3rem]">
                                Trouvez la date parfaite pour vos réunions et événements en un clin d'œil.
                            </p>
                            <div className="flex items-center text-sm font-medium text-purple-400 group-hover:translate-x-1 transition-transform">
                                Découvrir <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Form Polls */}
                    <Link
                        to="/form-polls"
                        className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">Formulaires</h3>
                            <p className="text-gray-400 text-sm mb-4 min-h-[3rem]">
                                Créez des formulaires intelligents pour collecter des avis et des informations.
                            </p>
                            <div className="flex items-center text-sm font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
                                Découvrir <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Availability Polls */}
                    <Link
                        to="/availability-polls"
                        className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-green-400 transition-colors">Disponibilités</h3>
                            <p className="text-gray-400 text-sm mb-4 min-h-[3rem]">
                                Partagez vos disponibilités et laissez les autres réserver des créneaux.
                            </p>
                            <div className="flex items-center text-sm font-medium text-green-400 group-hover:translate-x-1 transition-transform">
                                Découvrir <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Quizz - Aide aux Devoirs */}
                    <Link
                        to="/quizz"
                        className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Brain className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-yellow-400 transition-colors">Quizz</h3>
                            <p className="text-gray-400 text-sm mb-4 min-h-[3rem]">
                                Créez des quiz éducatifs pour aider vos enfants dans leurs devoirs.
                            </p>
                            <div className="flex items-center text-sm font-medium text-yellow-400 group-hover:translate-x-1 transition-transform">
                                Découvrir <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 mt-20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                    <p>© 2025 DooDates. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
