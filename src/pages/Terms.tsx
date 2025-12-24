import React from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, Gavel, Scale, AlertTriangle, ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/shared/Footer";

export const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
            <TopNav />
            <div className="pt-24 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-900/40 rounded-full mb-6 ring-1 ring-blue-700/50">
                        <Scale className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Conditions Générales d'Utilisation
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Les règles qui régissent l'utilisation de nos services DooDates.
                    </p>
                    <div className="mt-4 text-sm text-gray-500 font-medium">
                        Dernière mise à jour : 10 Décembre 2025
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-12">

                    {/* Section 1: Objet */}
                    <section className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <FileText className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Objet</h2>
                                <p className="text-gray-300 leading-relaxed">
                                    Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services du site DooDates. Tout accès et/ou utilisation du site suppose l'acceptation et le respect de l'ensemble des termes des présentes conditions et leur acceptation inconditionnelle.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Services */}
                    <section className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <Shield className="w-6 h-6 text-purple-400 mt-1 shrink-0" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Description des Services</h2>
                                <p className="text-gray-300 leading-relaxed mb-4">
                                    DooDates fournit des outils de planification collaborative, de création de sondages, de formulaires et de quiz, assistés par une Intelligence Artificielle.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                    <li>Planification de réunions et d'événements</li>
                                    <li>Création de sondages de vote</li>
                                    <li>Génération de formulaires intelligents</li>
                                    <li>Quiz interactifs</li>
                                    <li>Assistant IA pour la rédaction et l'organisation</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Responsabilités */}
                    <section className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1 shrink-0" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Responsabilités</h2>
                                <div className="space-y-4 text-gray-300 leading-relaxed">
                                    <p>
                                        L'utilisateur est responsable de l'utilisation qu'il fait des informations et outils mis à disposition sur le site. Il s'engage à ne pas utiliser les services à des fins illégales ou nuisibles.
                                    </p>
                                    <p>
                                        DooDates s'efforce d'assurer la fiabilité et la mise à jour des informations diffusées sur le site, mais ne garantit pas l'absence d'erreurs ou d'omissions.
                                    </p>
                                    <p>
                                        L'utilisation de l'IA (Gemini) est soumise à des limitations inhérentes à la technologie (hallucinations possibles, erreurs factuelles). L'utilisateur doit vérifier les informations générées.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Propriété Intellectuelle */}
                    <section className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <Gavel className="w-6 h-6 text-green-400 mt-1 shrink-0" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Propriété Intellectuelle</h2>
                                <p className="text-gray-300 leading-relaxed mb-3">
                                    L'ensemble des éléments du site (textes, graphismes, logiciels, logos, sons, marques, etc.) est la propriété exclusive de DooDates ou de ses partenaires.
                                </p>
                                <p className="text-gray-300 leading-relaxed">
                                    Toute reproduction ou représentation, totale ou partielle, sans l'accord de DooDates, est interdite et constituerait une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer Link */}
                <div className="mt-16 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Retour à l'accueil
                    </Link>
                </div>

            </div>
            <Footer />
        </div>
    );
};

export default Terms;
