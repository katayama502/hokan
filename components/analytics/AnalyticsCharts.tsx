'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { INSURANCE_TYPE_LABELS } from '@/lib/utils/labels';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface Props {
  funnelData: { stage: string; label: string; count: number }[];
  monthlyRenewals: { month: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
}

export function AnalyticsCharts({ funnelData, monthlyRenewals, typeDistribution }: Props) {
  const pieData = typeDistribution.map((d) => ({
    name: INSURANCE_TYPE_LABELS[d.type as keyof typeof INSURANCE_TYPE_LABELS] ?? d.type,
    value: d.count,
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 案件ファネル */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">案件ファネル</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="label" fontSize={12} width={65} />
              <Tooltip
                formatter={(v) => [`${v}件`, '案件数']}
                contentStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 月別満期件数 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月別満期件数（今後6ヶ月）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyRenewals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip
                formatter={(v) => [`${v}件`, '満期件数']}
                contentStyle={{ fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 保険種別分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">保険種別構成</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${Math.round(percent * 100)}%`
                }
                labelLine={false}
                fontSize={11}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}件`]} contentStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
