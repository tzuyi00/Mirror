'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Book, Lock } from 'lucide-react';

export const TopNavbar = ({ mode }: { mode: 'public' | 'private' }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-14 items-center px-6" style={{ backgroundColor: '#F5F5F4' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity"> 
            <span className="font-bold text-lg">Me 2</span>
          </Link>
          
          {/* Mode Badge */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-border">
            <span className="text-xs font-semibold px-2 py-1 rounded-full" 
              style={{
                backgroundColor: mode === 'public' ? '#e8f5e9' : '#f3e5f5',
                color: mode === 'public' ? '#2e7d32' : '#6a1b9a'
              }}
            >
              {mode === 'public' ? 'PUBLIC' : 'PRIVATE'}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <nav className="flex items-center gap-6">
          {mode === 'private' && (
            <Link
              href="/docs"
              className="text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5 text-muted-foreground"
            >
              <Book className="size-4" />
              <span>Go Public</span>
            </Link>
          )}

          {mode === 'public' && (
            <Link
              href="/private"
              className="text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5 text-muted-foreground"
            >
              <Lock className="size-4" />
              <span>Go Private</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
