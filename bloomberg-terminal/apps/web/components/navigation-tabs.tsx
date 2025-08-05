'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'spot', label: 'SPOT', path: '/' },
  { id: 'futures', label: 'FUTURES', path: '/futures' },
  { id: 'options', label: 'OPTIONS', path: '/options' },
  { id: 'funding', label: 'FUNDING', path: '/funding' },
  { id: 'defi', label: 'DEFI', path: '/defi' },
  { id: 'nfts', label: 'NFTS', path: '/nfts' },
  { id: 'news', label: 'NEWS', path: '/news' },
  { id: 'analytics', label: 'ANALYTICS', path: '/analytics' },
];

export function NavigationTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="h-full flex items-center px-6 gap-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || 
          (tab.path !== '/' && pathname.startsWith(tab.path));
        
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all duration-200",
              "border-b-2 hover:text-bloomberg-amber",
              isActive ? [
                "text-bloomberg-amber border-bloomberg-amber",
                "bg-bloomberg-black/50"
              ] : [
                "text-bloomberg-gray border-transparent",
                "hover:border-bloomberg-amber/50"
              ]
            )}
          >
            {tab.label}
          </button>
        );
      })}
      
      {/* Quick actions on the right */}
      <div className="ml-auto flex items-center gap-4">
        <button className="text-bloomberg-gray hover:text-bloomberg-amber text-sm">
          ⌘K
        </button>
        <button className="text-bloomberg-gray hover:text-bloomberg-amber text-sm">
          SETTINGS
        </button>
      </div>
    </div>
  );
}