import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-white">Paramètres</h1>
          <p className="text-gray-400 mt-2">Gérez vos préférences et paramètres</p>
        </div>

        <Card className="bg-[#252525] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Paramètres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Page en cours de développement...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
