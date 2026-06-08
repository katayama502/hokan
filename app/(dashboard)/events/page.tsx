import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, Globe, Users, Calendar } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

const EVENT_STATUS_LABELS = {
  draft: '下書き',
  published: '公開中',
  cancelled: 'キャンセル',
  completed: '終了',
};

async function getEvents(organizationId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, description, location, is_online, online_url,
      start_at, end_at, capacity, status, public_token,
      event_participants(id)
    `)
    .eq('organization_id', organizationId)
    .order('start_at', { ascending: true });

  if (error) return [];
  return (data ?? []).map((e: any) => ({
    ...e,
    participant_count: e.event_participants?.length ?? 0,
  }));
}

export default async function EventsPage() {
  const session = await auth();
  if (!session) return null;

  const events = await getEvents(session.user.organization_id);
  const upcoming = events.filter((e: any) => e.status !== 'completed' && e.status !== 'cancelled');
  const past = events.filter((e: any) => e.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">セミナー・イベント管理</h1>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            イベント作成
          </Link>
        </Button>
      </div>

      {/* 開催予定 */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">開催予定</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">開催予定のイベントはありません</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event: any) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-500">
                          {formatDateTime(event.start_at)}
                          {event.end_at && ` 〜 ${formatDateTime(event.end_at).split(' ')[1]}`}
                        </span>
                        <Badge
                          variant={event.status === 'published' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          {event.is_online ? (
                            <Globe className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          {event.is_online ? 'オンライン' : event.location ?? '場所未定'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          申込 {event.participant_count}名
                          {event.capacity && ` / 定員 ${event.capacity}名`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/events/${event.id}`}>詳細</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 終了済み */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">終了済み</h2>
          <div className="space-y-2">
            {past.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-gray-50 text-sm"
              >
                <div>
                  <span className="font-medium text-gray-700">{event.title}</span>
                  <span className="text-gray-400 ml-2">{formatDateTime(event.start_at)}</span>
                </div>
                <span className="text-gray-400">参加 {event.participant_count}名</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
