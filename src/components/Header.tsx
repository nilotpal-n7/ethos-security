// src/components/Header.tsx
"use client";

import { Book, Bell, UserCircle } from "lucide-react";
import { Search } from "./Search";
import Link from "next/link";
import { signOut } from "next-auth/react";

type HeaderProps = {
  onUserSelect: (userId: number) => void;
};

export function Header({ onUserSelect }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/dashboard">
          <div className="text-xl font-bold text-white">
            Campus Security
          </div>
        </Link>

        <Search onUserSelect={onUserSelect} />

        <div className="flex items-center gap-4">
          {/* 1. Book icon now links to the /unresolved page */}
          <Link href="/unresolved" className="text-gray-400 hover:text-white" title="Unresolved Entities">
            <Book size={20} />
          </Link>

          {/* 2. Bell icon now links to the /alert page */}
          <Link href="/alert" className="text-gray-400 hover:text-white" title="Alerts">
            <Bell size={20} />
          </Link>

          {/* 3. User icon now triggers signOut on click */}
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-white"
            title="Log Out"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}