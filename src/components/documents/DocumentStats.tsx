import { FileText, FileSignature, CheckCircle, Clock } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
