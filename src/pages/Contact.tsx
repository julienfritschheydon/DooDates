
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Contact = () => {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold mb-6">Contactez-nous</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Une question ? Une suggestion ? N'hésitez pas à nous contacter.
                support@doodates.com
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/">
                    <Button>Retour à l'accueil</Button>
                </Link>
            </div>
        </div>
    );
};

export default Contact;
