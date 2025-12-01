import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, File, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '../../lib/supabase';
import { DocumentType } from '../../types/database';

interface FileWithMetadata {
  file: File;
  id: string;
  name: string;
  type: DocumentType;
  visibleToClient: boolean;
  preview?: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  onUploadComplete: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'disclosure', label: 'Disclosure' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'financing', label: 'Financing' },
  { value: 'closing', label: 'Closing' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploadModal({
  isOpen,
  onClose,
  transactionId,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const newFiles: FileWithMetadata[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const fileMetadata: FileWithMetadata = {
          file,
          id: `${Date.now()}-${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          type: 'other',
          visibleToClient: false,
        };

        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          fileMetadata.preview = preview;
        }

        return fileMetadata;
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFile = (id: string, updates: Partial<FileWithMetadata>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.includes('pdf')) return FileText;
    return File;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const fileMetadata of files) {
        const fileExt = fileMetadata.file.name.split('.').pop();
        const storagePath = `${user.id}/${transactionId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const fullPath = `documents/${storagePath}`;

        // Upload to storage (without 'documents/' prefix since bucket already defines that)
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, fileMetadata.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload ${fileMetadata.file.name}: ${uploadError.message}`);
        }

        // Create database record (with 'documents/' prefix for constraint)
        const { error: dbError } = await supabase.from('documents').insert({
          agent_id: user.id,
          transaction_id: transactionId,
          name: fileMetadata.name,
          type: fileMetadata.type,
          size_bytes: fileMetadata.file.size,
          mime_type: fileMetadata.file.type,
          storage_path: fullPath,
          visible_to_client: fileMetadata.visibleToClient,
          archived: false,
        });

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw new Error(`Failed to save ${fileMetadata.name}: ${dbError.message}`);
        }
      }

      onUploadComplete();
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Select and configure files to upload to this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-600">
                Click to select files
              </span>
              <span className="text-xs text-slate-500 mt-1">
                or drag and drop files here
              </span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700">
                Selected Files ({files.length})
              </h3>

              {files.map((fileMetadata) => {
                const Icon = getFileIcon(fileMetadata.file);
                return (
                  <div
                    key={fileMetadata.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      {fileMetadata.preview ? (
                        <img
                          src={fileMetadata.preview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                          <Icon className="w-8 h-8 text-slate-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Document Name
                          </label>
                          <Input
                            value={fileMetadata.name}
                            onChange={(e) =>
                              updateFile(fileMetadata.id, { name: e.target.value })
                            }
                            placeholder="Enter document name"
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Document Type
                            </label>
                            <select
                              value={fileMetadata.type}
                              onChange={(e) =>
                                updateFile(fileMetadata.id, {
                                  type: e.target.value as DocumentType,
                                })
                              }
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {DOCUMENT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Visibility
                            </label>
                            <select
                              value={fileMetadata.visibleToClient ? 'client' : 'agent'}
                              onChange={(e) =>
                                updateFile(fileMetadata.id, {
                                  visibleToClient: e.target.value === 'client',
                                })
                              }
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="agent">Agent Only</option>
                              <option value="client">Visible to Client</option>
                            </select>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500">
                          {fileMetadata.file.name} ({(fileMetadata.file.size / 1024).toFixed(1)} KB)
                        </div>
                      </div>

                      <button
                        onClick={() => removeFile(fileMetadata.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
