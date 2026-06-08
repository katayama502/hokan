'use client';

import { useState } from 'react';
import { Deal, DealStage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/date';
import { INSURANCE_TYPE_LABELS, DEAL_STAGE_LABELS } from '@/lib/utils/labels';
import Link from 'next/link';
import { toast } from 'sonner';

const STAGES: DealStage[] = ['lead', 'contact', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

const STAGE_COLORS: Record<DealStage, string> = {
  lead: 'border-gray-300 bg-gray-50',
  contact: 'border-blue-300 bg-blue-50',
  proposal: 'border-yellow-300 bg-yellow-50',
  negotiation: 'border-orange-300 bg-orange-50',
  closed_won: 'border-green-300 bg-green-50',
  closed_lost: 'border-red-300 bg-red-50',
};

const STAGE_HEADER_COLORS: Record<DealStage, string> = {
  lead: 'bg-gray-100 text-gray-700',
  contact: 'bg-blue-100 text-blue-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

interface Props {
  deals: Deal[];
}

export function KanbanBoard({ deals: initialDeals }: Props) {
  const [deals, setDeals] = useState(initialDeals);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const groupedDeals = STAGES.reduce<Record<DealStage, Deal[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<DealStage, Deal[]>
  );

  const handleDragStart = (dealId: string) => {
    setDraggingId(dealId);
  };

  const handleDrop = async (targetStage: DealStage) => {
    if (!draggingId) return;

    const deal = deals.find((d) => d.id === draggingId);
    if (!deal || deal.stage === targetStage) {
      setDraggingId(null);
      return;
    }

    // 楽観的更新
    setDeals((prev) =>
      prev.map((d) => (d.id === draggingId ? { ...d, stage: targetStage } : d))
    );
    setDraggingId(null);

    const res = await fetch(`/api/deals/${draggingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStage }),
    });

    if (!res.ok) {
      // ロールバック
      setDeals((prev) =>
        prev.map((d) => (d.id === draggingId ? { ...d, stage: deal.stage } : d))
      );
      toast.error('ステータスの更新に失敗しました');
    } else {
      toast.success(`「${DEAL_STAGE_LABELS[targetStage]}」に移動しました`);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageDeals = groupedDeals[stage];
        return (
          <div
            key={stage}
            className={`flex-shrink-0 w-56 rounded-lg border-2 ${STAGE_COLORS[stage]}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
          >
            {/* カラムヘッダー */}
            <div className={`flex items-center justify-between rounded-t-md px-3 py-2 ${STAGE_HEADER_COLORS[stage]}`}>
              <span className="text-sm font-semibold">
                {DEAL_STAGE_LABELS[stage]}
              </span>
              <span className="text-xs font-medium rounded-full bg-white/60 px-1.5 py-0.5">
                {stageDeals.length}
              </span>
            </div>

            {/* カード */}
            <div className="space-y-2 p-2 min-h-[120px]">
              {stageDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onDragStart={() => handleDragStart(deal.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DealCard({ deal, onDragStart }: { deal: Deal; onDragStart: () => void }) {
  const customer = deal.customer as any;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3 space-y-1.5">
        <Link
          href={`/deals/${deal.id}`}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
          onClick={(e) => e.stopPropagation()}
        >
          {deal.title}
        </Link>
        {customer && (
          <p className="text-xs text-gray-500">
            {customer.last_name} {customer.first_name} 様
          </p>
        )}
        <div className="flex items-center justify-between">
          {deal.insurance_type && (
            <Badge variant="outline" className="text-xs">
              {INSURANCE_TYPE_LABELS[deal.insurance_type]}
            </Badge>
          )}
          {deal.expected_amount && (
            <span className="text-xs font-medium text-gray-600">
              {formatCurrency(deal.expected_amount)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
