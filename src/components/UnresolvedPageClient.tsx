// src/components/UnresolvedPageClient.tsx
"use client"; // This marks the component as a Client Component

import { Header } from "@/components/Header";
import { UnresolvedClient } from "@/components/UnresolvedClient";

// Define the type for the card data prop
type Card = { id: string; userId: number | null };

export function UnresolvedPageClient({ cards }: { cards: Card[] }) {
  // All state and handlers live in the Client Component
  // In this case, the Header search doesn't need to do anything,
  // so we pass an empty function.
  const handleUserSelect = () => {};

  return (
    <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-gray-100 min-h-screen">
      {/* A Client Component can safely pass function props to another Client Component */}
      <Header onUserSelect={handleUserSelect} />
      <main className="container mx-auto px-6 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-6">Unresolved Entities</h1>
        <p className="text-lg text-gray-400 mb-8">
          The following card IDs were found in swipe logs but are not linked to a known user. 
          Click on a card to predict its owner.
        </p>
        <UnresolvedClient cards={cards} />
      </main>
    </div>
  );
}