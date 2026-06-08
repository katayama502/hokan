'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface Props {
  defaultSearch?: string;
}

export function CustomerSearch({ defaultSearch = '' }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`/customers?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch('');
    router.push('/customers');
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="氏名・メールで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-9"
        />
      </div>
      <Button onClick={handleSearch}>検索</Button>
      {defaultSearch && (
        <Button variant="ghost" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
