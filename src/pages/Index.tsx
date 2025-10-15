import React, { useEffect } from "react";
import TopNav from "../components/TopNav";
import ChatInterface from "../components/ChatInterface";

const Index = () => {
  useEffect(() => {
    // Correction focus Android - approche multi-étapes
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Scroll immédiat
    scrollToTop();

    // Scroll après rendu initial
    setTimeout(scrollToTop, 50);

    // Scroll après chargement complet (pour PWA)
    setTimeout(scrollToTop, 200);

    // Scroll après stabilisation Android
    setTimeout(scrollToTop, 500);

    // Écouter les changements de focus/visibilité pour PWA
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(scrollToTop, 100);
      }
    };

    const handleFocus = () => {
      setTimeout(scrollToTop, 100);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="w-full max-w-4xl mx-auto pt-20">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
