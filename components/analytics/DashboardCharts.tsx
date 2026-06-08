'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface FunnelDataItem {
  stage: string;
  label: string;
  count: number;
}

interface Props {
  funnelData: FunnelDataItem[];
}

export function DashboardCharts({ funnelData }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">案件ファネル</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" fontSize={12} />
            <YAxis type="category" dataKey="label" fontSize={12} width={60} />
            <Tooltip
              formatter={(value) => [`${value}件`, '案件数']}
              contentStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
