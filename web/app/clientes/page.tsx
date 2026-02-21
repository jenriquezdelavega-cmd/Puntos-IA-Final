import { redirect } from 'next/navigation';

export default function ClientesPage() {
  redirect('/?clientes=1');
}
