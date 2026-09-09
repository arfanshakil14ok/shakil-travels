'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Calendar,
  X,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';

const STATUS_BADGES: Record<string, { cls: string; labelBn: string; labelEn: string }> = {
  VERIFIED: {
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    labelBn: 'যাচাইকৃত',
    labelEn: 'Verified',
  },
  UPLOADED: {
    cls: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    labelBn: 'অপেক্ষমান',
    labelEn: 'Pending Review',
  },
  PENDING: {
    cls: 'bg-amber-50 text-amber-700 border border-amber-200/70',
    labelBn: 'অপেক্ষমান',
    labelEn: 'Pending',
  },
  UNDER_REVIEW: {
    cls: 'bg-amber-50 text-amber-700 border border-amber-200/70',
    labelBn: 'পর্যালোচনাধীন',
    labelEn: 'Under Review',
  },
  REJECTED: {
    cls: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    labelBn: 'প্রত্যাখ্যাত',
    labelEn: 'Rejected',
  },
  EXPIRED: {
    cls: 'bg-slate-100 text-slate-600 border border-slate-200/70',
    labelBn: 'মেয়াদোত্তীর্ণ',
    labelEn: 'Expired',
  },
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    documentTypeId: '',
    passportNumber: '',
    expiryDate: '',
    notes: '',
  });

  // Replace Modal
  const [replaceDoc, setReplaceDoc] = useState<any | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal
  const [deleteDoc, setDeleteDoc] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error(t('অনুগ্রহ করে একটি ফাইল নির্বাচন করুন', 'Please select a file to upload'));
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('documentTypeId', formData.documentTypeId);
      if (formData.passportNumber) data.append('passportNumber', formData.passportNumber);
      if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
      if (formData.notes) data.append('notes', formData.notes);

      const res = await fetch('/api/portal/documents', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      if (resData.success) {
        success(t('নথি সফলভাবে আপলোড হয়েছে।', 'Document uploaded successfully'));
        setIsUploadOpen(false);
        setSelectedFile(null);
        setFormData({
          documentTypeId: documentTypes[0]?.id || '',
          passportNumber: '',
          expiryDate: '',
          notes: '',
        });
        fetchDocs();
      } else {
        error(resData.error || 'Failed to upload document');
      }
    } catch {
      error('Error during document upload');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceDoc || !replaceFile) {
      error(t('অনুগ্রহ করে একটি নতুন ফাইল নির্বাচন করুন', 'Please select a new replacement file'));
      return;
    }

    setReplacing(true);
    try {
      const data = new FormData();
      data.append('file', replaceFile);

      const res = await fetch(`/api/portal/documents/${replaceDoc.id}`, {
        method: 'PUT',
        body: data,
      });

      const resData = await res.json();
      if (resData.success) {
        success(t('নথি সফলভাবে পরিবর্তন করা হয়েছে।', 'Document replaced successfully'));
        setReplaceDoc(null);
        setReplaceFile(null);
        fetchDocs();
      } else {
        error(resData.error || 'Failed to replace document');
      }
    } catch {
      error('Error during document replacement');
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/portal/documents/${deleteDoc.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        success(t('নথি মুছে ফেলা হয়েছে।', 'Document deleted successfully'));
        setDeleteDoc(null);
        fetchDocs();
      } else {
        error(data.error || 'Failed to delete document');
      }
    } catch {
      error('Error during document deletion');
    } finally {
      setDeleting(false);
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
          onClick={() => {
            setSelectedFile(null);
            setIsUploadOpen(true);
          }}
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
            onClick: () => {
              setSelectedFile(null);
              setIsUploadOpen(true);
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const badge = STATUS_BADGES[doc.status] || STATUS_BADGES.PENDING;
            const isVerified = doc.status === 'VERIFIED';
            const isRejected = doc.status === 'REJECTED';

            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {doc.documentType?.name || 'Document'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${badge.cls}`}>
                      {language === 'bn' ? badge.labelBn : badge.labelEn}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    {doc.fileName}
                  </div>

                  {/* Rejection Reason Alert */}
                  {isRejected && doc.rejectionReason && (
                    <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-rose-900">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('প্রত্যাখ্যানের কারণ:', 'Rejection Reason:')}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{doc.rejectionReason}</p>
                    </div>
                  )}

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

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>v{doc.version || 1}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors"
                      title={t('ডাউনলোড করুন', 'Download')}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('ডাউনলোড', 'Download')}</span>
                    </a>

                    <div className="flex items-center gap-1">
                      {!isVerified ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceDoc(doc);
                              setReplaceFile(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 py-1 px-2 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                            title={t('পুনরায় আপলোড / পরিবর্তন', 'Replace')}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{t('পরিবর্তন', 'Replace')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDoc(doc)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 py-1 px-2 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t('মুছে ফেলুন', 'Delete')}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t('মুছুন', 'Delete')}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('যাচাইকৃত', 'Verified')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal with Drag & Drop */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {t('নতুন নথি আপলোড করুন', 'Upload Verification Document')}
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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

              {/* Drag & Drop File Zone */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('ফাইল নির্বাচন করুন (PDF, JPG, PNG, সর্বোচ্চ ৫MB) *', 'Select File (PDF, JPG, PNG, max 5MB) *')}
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-slate-900 bg-slate-50'
                      : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5 text-emerald-800">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                      <div className="font-semibold text-xs truncate max-w-xs">{selectedFile.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <span className="text-[11px] text-slate-600 underline mt-1">
                        {t('পরিবর্তন করতে ক্লিক করুন', 'Click to replace')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                      <div className="font-medium text-xs text-slate-800">
                        {t('ফাইল এখানে ড্র্যাগ করুন বা ক্লিক করে ব্রাউজ করুন', 'Drag & drop file here or browse')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        PDF, JPG, PNG, WEBP (Max 5MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isPassportSelected && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    {t('পাসপোর্ট নম্বর', 'Passport Number')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A01234567"
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, passportNumber: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('মেয়াদ উত্তীর্ণের তারিখ (প্রযোজ্য ক্ষেত্রে)', 'Expiry Date (If applicable)')}
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('মন্তব্য (ঐচ্ছিক)', 'Notes (Optional)')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('নথি সম্পর্কিত কোনো বিশেষ তথ্য...', 'Any notes regarding this document...')}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15 resize-none"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{uploading ? t('আপলোড হচ্ছে...', 'Uploading...') : t('আপলোড করুন', 'Upload')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Document Modal */}
      {replaceDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {t('নথি পরিবর্তন করুন', 'Replace Document')}
              </h3>
              <button
                type="button"
                onClick={() => setReplaceDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-800">{replaceDoc.documentType?.name}</div>
              <div className="text-slate-500 font-mono text-[11px] truncate">{replaceDoc.fileName}</div>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {t('নতুন ফাইল নির্বাচন করুন *', 'Select New Replacement File *')}
                </label>
                <div
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50"
                >
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReplaceFile(e.target.files[0]);
                      }
                    }}
                  />
                  {replaceFile ? (
                    <div className="flex flex-col items-center gap-1 text-emerald-800">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                      <div className="font-semibold text-xs truncate max-w-xs">{replaceFile.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(replaceFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                      <div className="font-medium text-xs text-slate-800">
                        {t('ক্লিক করে নতুন ফাইল বাছাই করুন', 'Click to choose replacement file')}
                      </div>
                      <div className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 5MB)</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceDoc(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={replacing || !replaceFile}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {replacing && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{replacing ? t('আপলোড হচ্ছে...', 'Updating...') : t('নথি প্রতিস্থাপন করুন', 'Replace Document')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t('নথি মুছে ফেলতে চান?', 'Delete this document?')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('এই নথিটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?', 'This document will be permanently deleted.')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
              <div className="font-semibold text-slate-800">{deleteDoc.documentType?.name}</div>
              <div className="text-slate-500 font-mono text-[11px] truncate">{deleteDoc.fileName}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteDoc(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-xs cursor-pointer"
              >
                {t('বাতিল', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {deleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{deleting ? t('মুছে ফেলা হচ্ছে...', 'Deleting...') : t('হ্যাঁ, মুছে ফেলুন', 'Yes, Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
