import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => (
  <footer className="bg-[#0a0a0a] border-t border-gray-800 py-6 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
      <div className="flex space-x-4 mb-4 md:mb-0">
        <Link to="/about" className="hover:text-white transition-colors">
          À propos
        </Link>
        <Link to="/contact" className="hover:text-white transition-colors">
          Contact
        </Link>
        <Link to="/terms" className="hover:text-white transition-colors">
          CGU
        </Link>
        <Link to="/privacy" className="hover:text-white transition-colors">
          Confidentialité
        </Link>
      </div>
      <p className="text-sm">© {new Date().getFullYear()} DooDates – Tous droits réservés.</p>
    </div>
  </footer>
);
