import { LucideIcon } from 'lucide-react';

interface PanelProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status?: 'idle' | 'loading' | 'done' | 'error';
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function Panel({ icon: Icon, title, subtitle, status, children, action }: PanelProps) {
  return (
    <div className={`bg-white rounded-2xl border transition-shadow fade-up
      ${status === 'done' ? 'border-stone-200 shadow-sm' : 'border-stone-100'}
      ${status === 'loading' ? 'border-orange-100' : ''}
      ${status === 'error' ? 'border-red-100' : ''}
    `}>
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            ${status === 'done' ? 'bg-orange-50 text-orange-500' : ''}
            ${status === 'loading' ? 'bg-orange-50 text-orange-400' : ''}
            ${status === 'error' ? 'bg-red-50 text-red-400' : ''}
            ${!status || status === 'idle' ? 'bg-stone-100 text-stone-400' : ''}
          `}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 text-sm leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="ml-3">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
