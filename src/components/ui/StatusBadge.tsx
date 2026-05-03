import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

type Status = 'loading' | 'done' | 'error' | 'idle';

const MAP: Record<Status, { icon: typeof CheckCircle2; label: string; cls: string }> = {
  loading: { icon: Clock, label: 'Spracovávam...', cls: 'text-orange-500 bg-orange-50' },
  done: { icon: CheckCircle2, label: 'Hotovo', cls: 'text-emerald-600 bg-emerald-50' },
  error: { icon: AlertCircle, label: 'Chyba', cls: 'text-red-500 bg-red-50' },
  idle: { icon: Clock, label: 'Čaká', cls: 'text-stone-400 bg-stone-100' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, label, cls } = MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <Icon size={12} className={status === 'loading' ? 'spin' : ''} />
      {label}
    </span>
  );
}
