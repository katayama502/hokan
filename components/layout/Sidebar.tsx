'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  ClipboardList,
  BarChart2,
  UserCog,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/customers', label: '顧客管理', icon: Users },
  { href: '/contracts', label: '契約管理', icon: FileText },
  { href: '/deals', label: '案件管理', icon: Briefcase },
  { href: '/intent', label: '意向把握', icon: ClipboardList },
  { href: '/analytics', label: '分析', icon: BarChart2 },
  { href: '/staff', label: 'スタッフ', icon: UserCog },
  { href: '/events', label: 'イベント', icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-white">
      {/* ロゴ */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            IH
          </div>
          <span className="text-lg font-bold text-gray-900">InsureHub</span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
