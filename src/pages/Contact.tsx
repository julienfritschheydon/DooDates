import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Footer } from "@/components/shared/Footer";

const Contact = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header/Nav Space */}
            <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="font-bold text-white">D</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                DooDates
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-32 text-center relative z-10 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                    <span className="text-sm text-purple-400 font-medium">Contact</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
                    Une question ?{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Écrivez-nous
                    </span>
                </h1>
                <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Notre équipe est là pour vous aider à tirer le meilleur parti de DooDates.
                    N'hésitez pas à nous contacter pour toute suggestion ou assistance.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-xl mx-auto backdrop-blur-sm mb-12">
                    <p className="text-2xl font-bold text-white mb-2">support@doodates.com</p>
                    <p className="text-gray-400 text-sm">Nous vous répondrons dans les meilleurs délais</p>
                </div>

                <div className="flex justify-center gap-4">
                    <Link to="/">
                        <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            Retour à l'accueil
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
};

export default Contact;
