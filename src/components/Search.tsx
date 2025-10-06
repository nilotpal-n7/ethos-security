// src/components/Search.tsx
"use client";
import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';

type UserSearchResult = {
  id: number;
  fullName: string | null;
  externalId: string | null;
}

type SearchProps = {
  onUserSelect: (userId: number) => void;
}

export function Search({ onUserSelect }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Debounce the search to avoid API calls on every keystroke
    const debounceTimer = setTimeout(() => {
      fetch(`/api/search?q=${query}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setIsOpen(true);
        });
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (user: UserSearchResult) => {
    setQuery(user.fullName || '');
    setIsOpen(false);
    onUserSelect(user.id);
  };

  return (
    <div className="relative w-full max-w-md">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or ID (e.g., Alice, S12345)..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
          <ul className="py-1">
            {results.slice(0, 5).map(user => (
              <li
                key={user.id}
                onClick={() => handleSelect(user)}
                className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer"
              >
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-gray-400">{user.externalId}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}