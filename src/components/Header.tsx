// src/components/Header.tsx
"use client";
import { Book, Bell, UserCircle } from "lucide-react";
import { Search } from "./Search";

type HeaderProps = {
  onUserSelect: (userId: number) => void;
}

export function Header({ onUserSelect }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="text-xl font-bold text-white">Campus Security</div>
        
        {/* Use the Search component and pass the selection handler */}
        <Search onUserSelect={onUserSelect} />

        <div className="flex items-center gap-4">
          <a href="https://www.iitg.ac.in/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
            <Book size={20} />
          </a>
          <button className="text-gray-400 hover:text-white"><Bell size={20} /></button>
          <button className="text-gray-400 hover:text-white"><UserCircle size={24} /></button>
        </div>
      </div>
    </header>
  );
}