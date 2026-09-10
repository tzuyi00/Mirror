'use client';

import { usePathname } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { getFlattenedPageTree, source } from '@/lib/source';
import { useMemo } from 'react';

interface DocsLayoutClientProps {
  children: React.ReactNode;
  tree: ReturnType<typeof source.getPageTree>;
}

export function DocsLayoutClient({ children, tree: initialTree }: DocsLayoutClientProps) {
  const pathname = usePathname();
  
  // Use useMemo to ensure the tree is recalculated when pathname changes
  const tree = useMemo(() => getFlattenedPageTree(pathname, initialTree), [pathname, initialTree]);

  return (
    <DocsLayout
      key={pathname} // Add key to force re-render when path changes
      tree={tree}
      nav={{
        enabled: false,
      }}
      sidebar={{
        defaultOpenLevel: 0,
      }}
    >
      {children}
    </DocsLayout>
  );
}
