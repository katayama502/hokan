import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth/config';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-60">
          <Header />
          <main className="flex-1 pt-16">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
