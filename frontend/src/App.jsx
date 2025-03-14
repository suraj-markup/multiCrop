// src/App.js
import React from "react";
import ImageMultipleRegions from "./components/ImageMultipleRegions";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold">Multi-Region Crop/Select</h1>
        </div>
      </header>
      <main className="mt-4">
        <ImageMultipleRegions />
      </main>
    </div>
  );
}

export default App;
