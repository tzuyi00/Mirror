'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export const SecondaryNav = () => {
  const pathname = usePathname();

  const isPrivate = pathname.startsWith('/private');
  const baseUrl = isPrivate ? '/private' : '/docs';

  const links = [
    {
      text: 'Getting Started',
      url: isPrivate ? `${baseUrl}/getting-started/setup` : `${baseUrl}/getting-started/introduction`,
      active: pathname.startsWith(`${baseUrl}/getting-started`),
      showInPrivate: true,
    },
    {
      text: 'Core Concepts',
      url: isPrivate ? `${baseUrl}/core-concepts` : `${baseUrl}/core-concepts/architecture`,
      active: pathname.startsWith(`${baseUrl}/core-concepts`),
      showInPrivate: false,
    },
    {
      text: 'API Reference',
      url: isPrivate ? `${baseUrl}/api-reference/overview` : `${baseUrl}/api-reference/overview`,
      active: pathname.startsWith(`${baseUrl}/api-reference`),
      showInPrivate: true,
    },
  ];

  const filteredLinks = isPrivate ? links.filter(link => link.showInPrivate !== false) : links;

  return (
    <nav className="sticky top-14 z-40 w-full border-b border-border bg-background">
      <div className="flex items-center gap-6 px-6" style={{ backgroundColor: '#F5F5F4' }}>
        {filteredLinks.map((link) => (
          <Link
            key={link.url}
            href={link.url}
            className={`relative inline-block text-sm font-bold transition-all duration-200 py-3 px-1 ${
              link.active
                ? 'text-red-600 dark:text-red-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {link.text}
      
            {link.active && (
              <span 
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 dark:bg-red-500 rounded-t-sm"
                style={{ marginBottom: '-1px' }}
              />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};
