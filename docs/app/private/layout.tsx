import { privateSource } from '@/lib/source';
import { TopNavbar } from '@/components/nav/TopNavbar';
import { SecondaryNav } from '@/components/nav/SecondaryNav';
import { DocsLayoutClient } from '@/components/DocsLayoutClient';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" data-private-layout>
      {/* Top full-width Navbar */}
      <TopNavbar mode="private" />
      
      {/* Second layer Category Navbar */}
      <SecondaryNav />
      
      {/* Docs Layout with Client Wrapper - Hide the original nav */}
      <DocsLayoutClient
        tree={privateSource.getPageTree()}
      >
        {children}
      </DocsLayoutClient>
    </div>
  );
}
