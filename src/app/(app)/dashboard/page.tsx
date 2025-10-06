// src/app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { BackgroundDate } from "@/components/BackgroundDate";

export default function DashboardPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [backgroundDate, setBackgroundDate] = useState<string>("");

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setBackgroundDate("");
  };

  return (
    // Add a classic background gradient
    <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-gray-100 min-h-screen">
      <BackgroundDate dateString={backgroundDate} />
      <Header onUserSelect={handleUserSelect} />
      <main className="relative z-0 container mx-auto px-6 pt-24 pb-12">
        {selectedUserId ? (
          <Timeline userId={selectedUserId} onMonthChange={setBackgroundDate} />
        ) : (
          <div className="flex items-center justify-center h-[70vh]">
            <p className="text-gray-500 text-xl">Search for an entity to view their activity timeline</p>
          </div>
        )}
      </main>
    </div>
  );
}