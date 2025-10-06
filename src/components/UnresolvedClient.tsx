// src/components/UnresolvedClient.tsx
"use client";

import { useState } from "react";
import { CreditCard, Loader2, ArrowRight } from "lucide-react";

type Card = { id: string; userId: number | null };
type Prediction = {
  score: number;
  evidence: string[];
  user: { id: number; fullName: string | null; externalId: string | null; };
};

export function UnresolvedClient({ cards }: { cards: Card[] }) {
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCardSelect = async (card: Card) => {
        setSelectedCard(card);
        setIsLoading(true);
        setPredictions([]);
        try {
            const response = await fetch(`/api/predict/owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'card', id: card.id }),
            });
            if (!response.ok) throw new Error(`API responded with status ${response.status}`);
            const data = await response.json();
            if (data.predictions) setPredictions(data.predictions);
        } catch (error) {
            console.error("Failed to fetch predictions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 h-fit">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Unowned Cards ({cards.length})</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {cards.map((card) => (
                        <button key={card.id} onClick={() => handleCardSelect(card)} className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors ${selectedCard?.id === card.id ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}>
                            <CreditCard className="text-gray-400" />
                            <span className="font-mono">{card.id}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:col-span-2">
                {!selectedCard && (<div className="flex items-center justify-center h-full bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg"><p className="text-gray-500">Select a card to see predictions</p></div>)}
                {isLoading && (<div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>)}
                {!isLoading && selectedCard && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Predictions for <span className="text-blue-400 font-mono">{selectedCard.id}</span></h2>
                        {predictions.length > 0 ? (
                            <div className="space-y-6">
                                {predictions.map((p, index) => (
                                    <div key={p.user.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${index === 0 ? 'text-green-400' : 'text-yellow-400'}`}>{index === 0 ? 'Top Candidate' : `Candidate #${index + 1}`}</span>
                                                <h3 className="text-xl font-semibold text-white">{p.user.fullName} ({p.user.externalId})</h3>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className="text-3xl font-bold text-white">{(p.score * 100).toFixed(1)}%</p>
                                                <p className="text-xs text-gray-400">Confidence</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 border-t border-gray-600 pt-4">
                                            <h4 className="font-semibold text-gray-300 mb-2">Explainability (Evidence):</h4>
                                            <ul className="space-y-2 text-sm">
                                                {p.evidence.map((e, i) => (<li key={i} className="flex items-start gap-2 text-gray-400"><ArrowRight size={14} className="text-blue-500 mt-1 flex-shrink-0"/><span>{e}</span></li>))}
                                            </ul>
                                        </div>
                                        <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Confirm & Link to User</button>
                                    </div>
                                ))}
                            </div>
                        ) : (<p className="text-gray-500">No likely candidates found.</p>)}
                    </div>
                )}
            </div>
        </div>
    );
}