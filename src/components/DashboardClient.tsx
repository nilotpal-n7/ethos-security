// src/components/DashboardClient.tsx
"use client";

import { useState } from "react";
import { EntitySidebar } from "./EntitySidebar";
import { Timeline } from "./Timeline";

type User = {
  id: number;
  fullName: string | null;
  role: string | null;
  externalId: string | null;
};

export function DashboardClient({ users }: { users: User[] }) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <>
      <EntitySidebar
        users={users}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
      />
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-semibold mb-4">Activity Timeline</h2>
        {selectedUserId ? (
          <Timeline userId={selectedUserId} />
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-200 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">Select an entity to view their timeline</p>
          </div>
        )}
      </main>
    </>
  );
}