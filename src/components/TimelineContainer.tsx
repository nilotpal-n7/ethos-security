// Example: src/components/TimelineContainer.tsx
"use client";

import { useState } from "react";
import { Timeline } from "./Timeline"; // Assuming your timeline code is in this file

export function TimelineContainer({ userId }: { userId: number }) {
  // State to hold the date filter values
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeMonth, setActiveMonth] = useState(""); // For the month indicator

  return (
    <div className="w-full">
      {/* --- NEW: Filter UI Section --- */}
      <div className="p-4 mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg flex flex-col sm:flex-row items-center gap-4">
        <p className="font-semibold text-gray-300">Filter by Date & Time:</p>
        <div className="flex items-center gap-2">
          <label htmlFor="from-date" className="text-sm text-gray-400">From:</label>
          <input
            type="datetime-local"
            id="from-date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md p-1 text-white text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="to-date" className="text-sm text-gray-400">To:</label>
          <input
            type="datetime-local"
            id="to-date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md p-1 text-white text-sm"
          />
        </div>
      </div>

      {/* The Timeline component with filter props passed down */}
      <Timeline
        userId={userId}
        onMonthChange={setActiveMonth}
        from={from || null}
        to={to || null}
      />
    </div>
  );
}