'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Files,
  Search,
  Filter,
  Upload,
  Download,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [verifyFilter, setVerifyFilter] = useState('ALL');

  // Verify modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docVerifyStatus, setDocVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [candSearch, setCandSearch] = useState('');
  const [candResults, setCandResults] = useState<any[]>([]);
  const [selectedCand, setSelectedCand] = useState<any | null>(null);
  const [uploadTypeId, setUploadTypeId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocNum, setUploadDocNum] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadDocTypes() {
      try {
        const res = await fetch('/api/document-types?isActive=true');
        const data = await res.json();
        if (data.success) {
          setDocTypes(data.data || []);
          if (data.data?.length > 0) setUploadTypeId(data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load document types', err);
      }
    }
    loadDocTypes();
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (typeFilter !== 'ALL') query.set('documentTypeId', typeFilter);
      if (verifyFilter !== 'ALL') query.set('isVerified', verifyFilter === 'VERIFIED' ? 'true' : 'false');

      const res = await fetch(`/api/documents?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, verifyFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCandSearch = async (term: string) => {
    setCandSearch(term);
    if (term.length < 2) {
      setCandResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/applicants?search=${encodeURIComponent(term)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setCandResults(data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCand || !uploadTypeId || !uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('applicantId', selectedCand.id);
      formData.append('documentTypeId', uploadTypeId);
      if (uploadDocNum) formData.append('documentNumber', uploadDocNum);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setIsUploadModalOpen(false);
        setSelectedCand(null);
        setUploadFile(null);
        setUploadDocNum('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: docVerifyStatus,
          rejectionReason: docVerifyStatus === 'REJECTED' ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerifyModalOpen(false);
        setSelectedDoc(null);
        setRejectionReason('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Verify error', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Files className="w-7 h-7 text-primary-600" />
            Candidate Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure storage, verification compliance, and tracking of migrant worker credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/document-types">
            <Button variant="outline" className="border-slate-300 text-xs">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Configure Types
            </Button>
          </Link>
          <Button onClick={() => setIsUploadModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search candidate name, ID, or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Document Types</option>
            {docTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>{dt.name}</option>
            ))}
          </select>

          <select
            value={verifyFilter}
            onChange={(e) => setVerifyFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Verification Status</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="UNVERIFIED">Pending / Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Candidate</th>
              <th className="py-3.5 px-4">Document Type</th>
              <th className="py-3.5 px-4">File Name</th>
              <th className="py-3.5 px-4">Doc # / Expiry</th>
              <th className="py-3.5 px-4">Verification Status</th>
              <th className="py-3.5 px-4">Verified By</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Files className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No documents found</p>
                  <p className="text-slate-400 mt-1">Upload a candidate document to get started.</p>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{doc.applicant.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {doc.applicant.applicantNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{doc.documentType.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{doc.fileName}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {doc.documentNumber || '—'}{' '}
                    {doc.expiryDate && (
                      <span className="block text-[10px] text-slate-400">
                        Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {doc.isVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : doc.rejectionReason ? (
                      <div>
                        <Badge variant="error">Rejected</Badge>
                        <span className="block text-[10px] text-rose-600 mt-0.5">{doc.rejectionReason}</span>
                      </div>
                    ) : (
                      <Badge variant="warning">Pending Verification</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{doc.verifiedBy?.name || '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDocVerifyStatus(doc.isVerified ? 'REJECTED' : 'VERIFIED');
                          setIsVerifyModalOpen(true);
                        }}
                        className="h-7 text-xs px-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Verify / Reject
                      </Button>
                      <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Candidate Document"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Candidate *</label>
            {selectedCand ? (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-primary-900 block">{selectedCand.fullName}</span>
                  <span className="text-primary-700">ID: {selectedCand.applicantNumber}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCand(null)} className="text-xs text-rose-600">
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Type candidate name or phone..."
                  value={candSearch}
                  onChange={(e) => handleCandSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
                {candResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {candResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCand(c);
                          setCandResults([]);
                        }}
                        className="p-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="font-semibold text-slate-800">{c.fullName}</div>
                        <div className="text-slate-500 font-mono text-[10px]">{c.applicantNumber} • {c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document Type *</label>
            <select
              value={uploadTypeId}
              onChange={(e) => setUploadTypeId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name} {dt.isRequired ? '(Required)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document #</label>
            <input
              type="text"
              value={uploadDocNum}
              onChange={(e) => setUploadDocNum(e.target.value)}
              placeholder="e.g. Passport or GAMCA Slip #"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">File (PDF, JPG, PNG) *</label>
            <input
              type="file"
              required
              onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUploading || !selectedCand || !uploadFile} className="bg-primary-600 text-white text-xs">
              {isUploading ? 'Uploading...' : 'Save Document'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verify / Reject Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify or Reject Document"
        description={selectedDoc ? `${selectedDoc.documentType.name}: ${selectedDoc.fileName}` : ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Decision</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-emerald-700">
                <input
                  type="radio"
                  name="docDecision"
                  checked={docVerifyStatus === 'VERIFIED'}
                  onChange={() => setDocVerifyStatus('VERIFIED')}
                  className="text-primary-600"
                />
                Approve & Verify
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-rose-700">
                <input
                  type="radio"
                  name="docDecision"
                  checked={docVerifyStatus === 'REJECTED'}
                  onChange={() => setDocVerifyStatus('REJECTED')}
                  className="text-rose-600"
                />
                Reject Document
              </label>
            </div>
          </div>

          {docVerifyStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify what needs correction..."
                rows={3}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleVerifySubmit}
              disabled={docVerifyStatus === 'REJECTED' && !rejectionReason.trim()}
              className={docVerifyStatus === 'VERIFIED' ? 'bg-emerald-600 text-white text-xs' : 'bg-rose-600 text-white text-xs'}
            >
              Submit Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
