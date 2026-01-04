import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Theme() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
            data-testid="theme-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Thème</h1>
          <p className="text-gray-600 mt-2">Personnalisez l'apparence de l'application</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thème</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Page en cours de développement...</p>
            <Button
              onClick={() => navigate("/settings")}
              className="mt-4"
              data-testid="theme-view-settings"
            >
              Voir les paramètres
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
