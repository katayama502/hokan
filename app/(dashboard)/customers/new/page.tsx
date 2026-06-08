import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: '顧客管理', href: '/customers' },
          { label: '新規顧客登録' },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-900">新規顧客登録</h1>
      <CustomerForm />
    </div>
  );
}
