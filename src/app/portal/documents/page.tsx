'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

const STATUS_BADGES: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  UPLOADED: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  EXPIRED: 'bg-slate-100 text-slate-600 border border-slate-200/60',
};

export default function PortalDocumentsPage() {
  const { success, error } = useToast();
  const { language, t } = useLanguage();
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
          fileSize: 1024 * 250,
          mimeType: 'application/pdf',
          passportNumber: formData.passportNumber || undefined,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success(t('নথি সফলভাবে আপলোড হয়েছে।', 'Document uploaded successfully'));
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {t('অনুমোদন ও নথিপত্র', 'Compliance & Records')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {t('প্রয়োজনীয় নথিপত্র ও পাসপোর্ট', 'Compliance & Identity Documents')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'আপনার পাসপোর্ট, জাতীয় পরিচয়পত্র, মেডিকেল ও ট্রেড সার্টিফিকেট নিরাপদে আপলোড ও যাচাই করুন।',
              'Upload and verify your passport, biometric medical records, police clearance, and technical certificates.'
            )}
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{t('নথি আপলোড করুন', 'Upload Document')}</span>
        </button>
      </div>

      {/* Documents Grid */}
      {loading && documents.length === 0 ? (
        <LoadingState text={t('নথিপত্র যাচাই করা হচ্ছে...', 'Loading candidate documents...')} />
      ) : documents.length === 0 ? (
        <EmptyState
          title={t('এখনও কোনো নথি আপলোড করা হয়নি', 'No documents uploaded yet')}
          description={t(
            'প্রবাসী নিয়োগ প্রক্রিয়ায় অংশ নিতে আপনার পাসপোর্ট ও জাতীয় পরিচয়পত্র আপলোড করুন।',
            'Please upload your Passport and National ID to begin the formal overseas verification process.'
          )}
          action={{
            label: t('প্রথম নথি আপলোড করুন', 'Upload Initial Document'),
            onClick: () => setIsUploadOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900">
                    {doc.documentType?.name || 'Document'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      STATUS_BADGES[doc.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono truncate">
                  {doc.fileName}
                </div>

                {doc.expiryDate && (
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('মেয়াদ:', 'Expires:')} {new Date(doc.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}

                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {doc.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                {doc.status === 'VERIFIED' && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t('যাচাইকৃত', 'Verified')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clean Modal for Upload */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {t('নতুন নথি আপলোড করুন', 'Upload Verification Document')}
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('নথির ধরন *', 'Document Type *')}
                </label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
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
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('নথির নাম / শিরোনাম *', 'Document Label / File Title *')}
                </label>
                <input
                  required
                  placeholder={t('যেমন: পাসপোর্ট বায়ো পেজ বা এনআইডি', 'e.g. Current Passport Scan')}
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
              </div>

              {isPassportSelected && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    {t('পাসপোর্ট নম্বর *', 'Passport Number *')}
                  </label>
                  <input
                    required
                    placeholder="e.g. A12345678"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('মেয়াদ উত্তীর্ণের তারিখ (পাসপোর্টের জন্য প্রযোজ্য)', 'Expiry Date')}
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('মন্তব্য / প্রদানকারী কর্তৃপক্ষ', 'Notes / Issuing Authority')}
                </label>
                <input
                  placeholder={t('যেমন: ইস্যুকারী অফিস ঢাকা', 'e.g. Issued by DIP Dhaka')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors disabled:opacity-60"
                >
                  {uploading ? t('আপলোড হচ্ছে...', 'Uploading...') : t('আপলোড নিশ্চিত করুন', 'Upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
