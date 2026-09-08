'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileCheck2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const STATUS_BADGES: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPLOADED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  EXPIRED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function PortalDocumentsPage() {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentTypeId: '',
    fileName: '',
    passportNumber: '',
    expiryDate: '',
    notes: '',
  });

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data.documents);
        setDocumentTypes(data.data.documentTypes);
        if (data.data.documentTypes.length > 0 && !formData.documentTypeId) {
          setFormData((prev) => ({ ...prev, documentTypeId: data.data.documentTypes[0].id }));
        }
      } else {
        error(data.error || 'Failed to load documents');
      }
    } catch {
      error('Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  }, [error, formData.documentTypeId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const selectedType = documentTypes.find((t) => t.id === formData.documentTypeId);
      const res = await fetch('/api/portal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTypeId: formData.documentTypeId,
          fileName: formData.fileName || `${selectedType?.name || 'Document'}.pdf`,
          filePath: `/uploads/candidates/${Date.now()}_${encodeURIComponent(formData.fileName || 'document.pdf')}`,
          fileSize: 1024 * 250, // simulated size
          mimeType: 'application/pdf',
          passportNumber: formData.passportNumber || undefined,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success('Document uploaded successfully for compliance review');
        setIsUploadOpen(false);
        setFormData({
          documentTypeId: documentTypes[0]?.id || '',
          fileName: '',
          passportNumber: '',
          expiryDate: '',
          notes: '',
        });
        fetchDocs();
      } else {
        error(data.error || 'Failed to upload document');
      }
    } catch {
      error('Error during document upload');
    } finally {
      setUploading(false);
    }
  };

  const selectedTypeObj = documentTypes.find((t) => t.id === formData.documentTypeId);
  const isPassportSelected = selectedTypeObj?.code?.toUpperCase() === 'PASSPORT';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            Compliance & Identity Documents
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload and verify your passport, biometric medical records, police clearance, and technical certificates.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {loading && documents.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading candidate documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No documents uploaded yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Please upload your Passport and National ID to begin the formal overseas verification process.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-1.5" /> Upload Initial Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-foreground">
                    {doc.documentType?.name || 'Document'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      STATUS_BADGES[doc.status] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {doc.fileName}
                </div>

                {doc.expiryDate && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}

                {doc.notes && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded border border-border">
                    {doc.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                {doc.status === 'VERIFIED' && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Verification Document"
        className="max-w-md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Document Type *
            </label>
            <select
              className="w-full text-sm bg-background border border-border rounded-lg p-2.5"
              value={formData.documentTypeId}
              onChange={(e) =>
                setFormData({ ...formData, documentTypeId: e.target.value })
              }
            >
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Document Label / File Title *
            </label>
            <Input
              required
              placeholder="e.g. Current Passport Scan (Bio Page)"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
            />
          </div>

          {isPassportSelected && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Passport Number *
              </label>
              <Input
                required
                placeholder="e.g. A12345678"
                value={formData.passportNumber}
                onChange={(e) =>
                  setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })
                }
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Expiry Date (Required for Passport & Medical)
            </label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Notes / Issuing Authority
            </label>
            <Input
              placeholder="e.g. Issued by DIP Dhaka"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload for Verification'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
