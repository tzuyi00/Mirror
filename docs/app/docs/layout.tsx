import { source } from '@/lib/source';
import { TopNavbar } from '@/components/nav/TopNavbar';
import { SecondaryNav } from '@/components/nav/SecondaryNav';
import { DocsLayoutClient } from '@/components/DocsLayoutClient';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TopNavbar mode="public" />
      
      <SecondaryNav />
      
      {/* Docs Layout - Dynamically displays the sidebar based on the current path */}
      <DocsLayoutClient tree={source.getPageTree()}>
        {children}
      </DocsLayoutClient>
    </div>
  );
}
