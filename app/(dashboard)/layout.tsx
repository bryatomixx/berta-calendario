import { NameGate } from '@/components/NameGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NameGate>{children}</NameGate>;
}
