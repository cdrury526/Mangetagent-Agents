import { useState } from 'react';
import { BoldSignIdentity, useBoldSignIdentities } from '../../hooks/useBoldSignIdentities';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CheckCircle2, Mail, Briefcase, User, Trash2, AlertCircle, Star } from 'lucide-react';

export function SenderIdentityList() {
  const { identities, loading, error, setDefaultIdentity, deleteIdentity } = useBoldSignIdentities();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [identityToDelete, setIdentityToDelete] = useState<BoldSignIdentity | null>(null);

  const handleDeleteClick = (identity: BoldSignIdentity) => {
    setIdentityToDelete(identity);
  };

  const handleConfirmDelete = async () => {
    if (!identityToDelete) return;

    setDeletingId(identityToDelete.id);
    setDeleteError(null);

    try {
      await deleteIdentity(identityToDelete.id);
      setIdentityToDelete(null);
    } catch (err: unknown) {
      setDeleteError((err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setIdentityToDelete(null);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultIdentity(id);
    } catch (err: unknown) {
      setDeleteError((err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Loading sender identities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (identities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <User className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Sender Identities Yet</h3>
        <p className="text-slate-600 mb-4">
          Create a sender identity to start sending documents for e-signature.
        </p>
        <p className="text-sm text-slate-500">
          Click the "Add Identity" button above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{deleteError}</p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={identityToDelete !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Sender Identity"
        message={`Are you sure you want to delete the sender identity "${identityToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deletingId !== null}
      />

      {identities.map((identity) => (
        <Card key={identity.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">{identity.name}</h3>
                {identity.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
                {identity.approval_status === 'approved' && (
                  <span title="Verified">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{identity.email}</span>
                </div>

                {identity.company_name && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{identity.company_name}</span>
                    {identity.title && <span className="text-slate-400">• {identity.title}</span>}
                  </div>
                )}

                {identity.approval_status === 'pending' && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      Email verification pending. Check your inbox at <strong>{identity.email}</strong> for a verification link from BoldSign.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {!identity.is_default && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetDefault(identity.id)}
                >
                  Set as Default
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDeleteClick(identity)}
                disabled={deletingId === identity.id}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
