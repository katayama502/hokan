'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertTriangle className="h-10 w-10 text-yellow-500" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">エラーが発生しました</h2>
        <p className="text-sm text-gray-500 mt-1">
          {error.message ?? 'ページの読み込みに失敗しました'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-1">Digest: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        再試行
      </Button>
    </div>
  );
}
