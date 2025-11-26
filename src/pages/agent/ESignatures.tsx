import { useState, useMemo } from 'react';
import { FileSignature, Grid, List, Search, Filter } from 'lucide-react';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../hooks/useAuth';
import { useBoldSignDocuments } from '../../hooks/useBoldSignDocuments';
import { useTransactions } from '../../hooks/useTransactions';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { DocumentStatusBadge } from '../../components/boldsign/DocumentStatusBadge';
import { ESignatureStatus } from '../../types/database';

type ViewMode = 'grid' | 'list';

export default function ESignatures() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { documents: boldSignDocs, loading } = useBoldSignDocuments(undefined);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ESignatureStatus | 'all'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<string>('all');

  const filteredDocuments = useMemo(() => {
    let filtered = boldSignDocs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.bold_sign_document_id.toLowerCase().includes(query) ||
        transactions.find(t => t.id === doc.transaction_id)?.name.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    if (selectedTransaction !== 'all') {
      filtered = filtered.filter(doc => doc.transaction_id === selectedTransaction);
    }

    return filtered;
  }, [boldSignDocs, searchQuery, selectedStatus, selectedTransaction, transactions]);

  const stats = useMemo(() => {
    return {
      total: boldSignDocs.length,
      pending: boldSignDocs.filter(d => d.status === 'sent' || d.status === 'in_progress').length,
      completed: boldSignDocs.filter(d => d.status === 'completed').length,
      declined: boldSignDocs.filter(d => d.status === 'declined').length,
      expired: boldSignDocs.filter(d => d.status === 'expired').length,
    };
  }, [boldSignDocs]);

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-slate-500">Loading e-signature documents...</div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">E-Signatures</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage all your documents sent for e-signature
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-600 font-medium">Credits Available</p>
              <p className={`text-lg font-bold ${
                user?.credit_balance && user.credit_balance > 100
                  ? 'text-green-600'
                  : user?.credit_balance && user.credit_balance > 20
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {user?.credit_balance || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Declined</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.declined}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Expired</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expired}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search by document ID or transaction..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ESignatureStatus | 'all')}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>

                <select
                  value={selectedTransaction}
                  onChange={(e) => setSelectedTransaction(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  {transactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileSignature className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No e-signature documents found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || selectedStatus !== 'all' || selectedTransaction !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Send your first document for e-signature from the Documents page'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => {
              const transaction = transactions.find(t => t.id === doc.transaction_id);
              return (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {doc.bold_sign_document_id}
                          </h3>
                          <DocumentStatusBadge status={doc.status} />
                        </div>

                        {transaction && (
                          <p className="text-sm text-slate-600 mb-2">
                            Transaction: <span className="font-medium">{transaction.name}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-xs text-slate-500">
                          <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                          {doc.expires_at && (
                            <span>Expires: {new Date(doc.expires_at).toLocaleDateString()}</span>
                          )}
                          {doc.completed_at && (
                            <span>Completed: {new Date(doc.completed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === 'completed' && doc.signed_pdf_storage_path && (
                          <Button size="sm" variant="secondary">
                            Download Signed
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
