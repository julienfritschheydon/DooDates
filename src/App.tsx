import React from "react";
import { Routes, Route } from "react-router-dom";
import { ProductApp } from "./app/ProductApp";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<ProductApp />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
