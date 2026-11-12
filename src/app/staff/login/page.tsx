import { redirect } from 'next/navigation';

export default function StaffLoginPage() {
  redirect('/login?redirect=/staff/dashboard');
}
