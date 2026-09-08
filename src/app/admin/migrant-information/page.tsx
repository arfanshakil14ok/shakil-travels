'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { MIGRANT_CATEGORIES } from '@/lib/validations/migrant';

export default function AdminMigrantInformationPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'BEFORE_TRAVEL',
    summary: '',
    content: '',
    officialSource: '',
    officialSourceUrl: '',
    status: 'PUBLISHED',
  });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        category: categoryFilter,
        status: 'ALL',
      });
      const res = await fetch(`/api/migrant-information?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch advisories');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, error]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'BEFORE_TRAVEL',
      summary: '',
      content: '',
      officialSource: '',
      officialSourceUrl: '',
      status: 'PUBLISHED',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      summary: item.summary || '',
      content: item.content || '',
      officialSource: item.officialSource || '',
      officialSourceUrl: item.officialSourceUrl || '',
      status: item.status || 'PUBLISHED',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/migrant-information/${editingItem.id}`
        : '/api/migrant-information';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        success(editingItem ? 'Advisory updated' : 'Advisory published');
        setIsModalOpen(false);
        fetchItems();
      } else {
        error(data.error || 'Failed to save advisory');
      }
    } catch (err: any) {
      error(err.message || 'Error saving advisory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/migrant-information/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        success('Advisory deleted');
        setDeleteTarget(null);
        fetchItems();
      } else {
        error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      error(err.message || 'Error deleting advisory');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Migrant Information & Worker Advisories</h1>
              <p className="text-sm text-slate-500">
                14-category pre-departure, airport guide, worker rights, and scam prevention articles.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Advisory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search advisory title, summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
        >
          <option value="ALL">All 14 Categories</option>
          {MIGRANT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Official Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading advisories...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No advisories found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      {item.summary && <div className="text-xs text-slate-400 line-clamp-1">{item.summary}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline">{item.category.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {item.officialSourceUrl ? (
                        <a
                          href={item.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {item.officialSource || 'Official Source'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">{item.officialSource || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.status === 'PUBLISHED' ? 'success' : item.status === 'DRAFT' ? 'warning' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Advisory Article' : 'Create Migrant Advisory'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Title *</label>
            <Input
              placeholder="e.g. Essential BMET Clearance & Smart Card Verification"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              >
                {MIGRANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Publish Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Summary (1-2 sentences)</label>
            <textarea
              rows={2}
              placeholder="Brief summary shown on overview lists..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Detailed Content *</label>
            <textarea
              rows={6}
              placeholder="Detailed instructions, official guidance, emergency contacts, warning points..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Source Name</label>
              <Input
                placeholder="e.g. BMET / Ministry of Expatriates' Welfare"
                value={formData.officialSource}
                onChange={(e) => setFormData({ ...formData, officialSource: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Source URL</label>
              <Input
                placeholder="https://www.bmet.gov.bd/..."
                value={formData.officialSourceUrl}
                onChange={(e) => setFormData({ ...formData, officialSourceUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Advisory'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Migrant Advisory"
        message={`Are you sure you want to delete ${deleteTarget?.title}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
