import { ESignatureStatus } from '../../types/database';

interface DocumentStatusBadgeProps {
  status: ESignatureStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className = '' }: DocumentStatusBadgeProps) {
  const statusConfig: Record<ESignatureStatus, { label: string; bgColor: string; textColor: string }> = {
    draft: { label: 'Draft', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
    sent: { label: 'Sent', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    in_progress: { label: 'In Progress', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    completed: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    declined: { label: 'Declined', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    expired: { label: 'Expired', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
    revoked: { label: 'Revoked', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
