import { FileText, Ligature as FileSignature, CheckCircle, Clock } from 'lucide-react';
import { Document, BoldSignDocument } from '../../types/database';
import { Card, CardContent } from '../ui/Card';

interface DocumentStatsProps {
  documents: Document[];
  boldSignDocuments: BoldSignDocument[];
}

export function DocumentStats({ documents, boldSignDocuments }: DocumentStatsProps) {
  const totalDocuments = documents.length;

  const documentsWithSignature = documents.filter(doc =>
    boldSignDocuments.some(bsd => bsd.document_id === doc.id)
  ).length;

  const pendingSignatures = boldSignDocuments.filter(
    bsd => bsd.status === 'sent' || bsd.status === 'in_progress'
  ).length;

  const completedSignatures = boldSignDocuments.filter(
    bsd => bsd.status === 'completed'
  ).length;

  const stats = [
    {
      label: 'Total Documents',
      value: totalDocuments,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'With E-Signature',
      value: documentsWithSignature,
      icon: FileSignature,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Pending Signature',
      value: pendingSignatures,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Signed Complete',
      value: completedSignatures,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
