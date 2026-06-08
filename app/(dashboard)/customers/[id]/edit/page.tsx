import { auth } from '@/lib/auth/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Customer } from '@/types';

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) return null;

  const supabase = createSupabaseServerClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', session.user.organization_id)
    .single();

  if (error || !customer) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: '顧客管理', href: '/customers' },
          { label: `${customer.last_name} ${customer.first_name}`, href: `/customers/${customer.id}` },
          { label: '編集' },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-900">顧客情報編集</h1>
      <CustomerForm customer={customer as Customer} />
    </div>
  );
}
