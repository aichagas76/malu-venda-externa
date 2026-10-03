'use client';

import { User } from '@supabase/supabase-js';
import { logout } from '@/app/auth/actions';
import { useState } from 'react';

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Malu Vendas</div>

        <div className="flex items-center gap-4">
          <span className="text-gray-700">{user?.email}</span>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Menu
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                <button
                  onClick={async () => {
                    await logout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
