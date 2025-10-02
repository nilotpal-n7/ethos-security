"use client";

import { useState, useEffect } from 'react';

type User = {
  id: number;
  fullName: string | null;
}

type TimelineEvent = {
    type: string;
    timestamp: string;
    details: string;
}

export function TimelineViewer({ users }: { users: User[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedUserId) {
      setTimeline([]);
      return;
    }

    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/timeline/${selectedUserId}`);
        const data = await response.json();
        if (data.timeline) {
          setTimeline(data.timeline);
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
        setTimeline([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [selectedUserId]);

  return (
    <div>
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="p-2 border rounded-md text-lg w-full max-w-sm"
      >
        <option value="">-- Select a User --</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.fullName}
          </option>
        ))}
      </select>

      <div className="mt-8">
        {isLoading && <p>Loading timeline...</p>}
        {!isLoading && timeline.length === 0 && selectedUserId && <p>No activity found for this user.</p>}
        <ul className="space-y-4">
          {timeline.map((event, index) => (
            <li key={index} className="border-l-4 pl-4">
              <p className="font-bold">{event.type}</p>
              <p className="text-sm text-gray-700">{event.details}</p>
              <p className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
