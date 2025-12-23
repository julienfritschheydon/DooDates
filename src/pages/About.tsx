
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold mb-6">À propos de DooDates</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                DooDates est la solution complète pour planifier vos événements, créer des sondages et gérer vos disponibilités.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/">
                    <Button>Retour à l'accueil</Button>
                </Link>
            </div>
        </div>
    );
};

export default About;
