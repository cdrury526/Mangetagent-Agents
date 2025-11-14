import { useState, useMemo } from 'react';
import { FileText, Grid, List, Search } from 'lucide-react';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useDocuments } from '../../hooks/useDocuments';
import { useBoldSignDocuments } from '../../hooks/useBoldSignDocuments';
import { useTransactions } from '../../hooks/useTransactions';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { DocumentGrid } from '../../components/documents/DocumentGrid';
import { DocumentList } from '../../components/documents/DocumentList';
import { DocumentFilters } from '../../components/documents/DocumentFilters';
import { DocumentStats } from '../../components/documents/DocumentStats';
import { Document, DocumentType, ESignatureStatus } from '../../types/database';

type ViewMode = 'grid' | 'list';

export default function Documents() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { documents: allDocs, loading: docsLoading } = useDocuments(undefined);
  const { documents: boldSignDocs } = useBoldSignDocuments(undefined);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ESignatureStatus | 'all' | 'none'>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const filteredDocuments = useMemo(() => {
    let filtered = allDocs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        transactions.find(t => t.id === doc.transaction_id)?.name.toLowerCase().includes(query)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    if (selectedTransaction !== 'all') {
      filtered = filtered.filter(doc => doc.transaction_id === selectedTransaction);
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'none') {
        filtered = filtered.filter(doc =>
          !boldSignDocs.some(bsd => bsd.document_id === doc.id)
        );
      } else {
        filtered = filtered.filter(doc =>
          boldSignDocs.some(bsd => bsd.document_id === doc.id && bsd.status === selectedStatus)
        );
      }
    }

    return filtered;
  }, [allDocs, boldSignDocs, searchQuery, selectedType, selectedTransaction, selectedStatus, transactions]);

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleSelectDocument = (id: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocuments.size} document(s)?`)) return;
    // TODO: Implement bulk delete
    setSelectedDocuments(new Set());
  };

  const handleBulkArchive = async () => {
    // TODO: Implement bulk archive
    setSelectedDocuments(new Set());
  };

  if (docsLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-500">Loading documents...</div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all your transaction documents and e-signatures
            </p>
          </div>
          <Button disabled title="Upload feature coming soon">
            <FileText className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        <DocumentStats
          documents={allDocs}
          boldSignDocuments={boldSignDocs}
        />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search documents or transactions..."
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

              <DocumentFilters
                selectedType={selectedType}
                selectedTransaction={selectedTransaction}
                selectedStatus={selectedStatus}
                transactions={transactions}
                onTypeChange={setSelectedType}
                onTransactionChange={setSelectedTransaction}
                onStatusChange={setSelectedStatus}
              />
            </div>
          </CardContent>
        </Card>

        {selectedDocuments.size > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDocuments.size} document(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkArchive}
                  >
                    Archive Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDocuments(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">
                {searchQuery || selectedType !== 'all' || selectedTransaction !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Upload documents to get started'}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <DocumentGrid
            documents={filteredDocuments}
            boldSignDocuments={boldSignDocs}
            transactions={transactions}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onSelectAll={handleSelectAll}
          />
        ) : (
          <DocumentList
            documents={filteredDocuments}
            boldSignDocuments={boldSignDocs}
            transactions={transactions}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>
    </AgentLayout>
  );
}
