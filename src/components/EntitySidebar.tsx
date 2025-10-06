// src/components/EntitySidebar.tsx
import { User } from "lucide-react";

type AppUser = {
  id: number;
  fullName: string | null;
  role: string | null;
  externalId: string | null;
};

type EntitySidebarProps = {
  users: AppUser[];
  selectedUserId: number | null;
  onSelectUser: (id: number) => void;
};

export function EntitySidebar({ users, selectedUserId, onSelectUser }: EntitySidebarProps) {
  return (
    <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Entities</h2>
      </div>
      <nav className="p-2 space-y-1">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={`w-full text-left flex items-center p-3 rounded-lg transition-colors ${
              selectedUserId === user.id
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className={`text-sm ${
                selectedUserId === user.id 
                ? "text-blue-200" 
                : "text-gray-500 dark:text-gray-400"
              }`}>
                {user.externalId}
              </p>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}