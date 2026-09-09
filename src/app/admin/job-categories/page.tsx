'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  RefreshCw,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function JobCategoriesPage() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Briefcase',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/job-categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        error(data.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      error(err.message || 'Error loading job categories');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'Briefcase',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'Briefcase',
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);

    try {
      const url = editingCategory
        ? `/api/job-categories/${editingCategory.id}`
        : '/api/job-categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        success(
          editingCategory
            ? 'Job category updated successfully'
            : 'Job category created successfully'
        );
        setIsModalOpen(false);
        fetchCategories();
      } else {
        error(data.error || 'Operation failed');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save job category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/job-categories/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        success('Category deleted successfully');
        setDeleteTarget(null);
        fetchCategories();
      } else {
        error(data.error || 'Failed to delete category');
      }
    } catch (err: any) {
      error(err.message || 'Error deleting category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.slug.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && cat.isActive) ||
      (statusFilter === 'INACTIVE' && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalVacancies = categories.reduce(
    (acc, curr) => acc + (curr._count?.jobs || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-primary-600" />
            Job Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize recruitment vacancies, occupational demand sectors, and applicant preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            className="border-slate-300 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Category
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Sectors</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-emerald-600">Active Sectors</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {categories.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-sky-600">Active Vacancies</span>
          <p className="text-2xl font-bold text-sky-700 mt-1">{totalVacancies}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search categories by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
            Loading job categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No job categories found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Category Sector</th>
                  <th className="py-3 px-4">Slug Identifier</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Open Jobs</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{cat.slug}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {cat._count?.jobs || 0} Vacancies
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="text-slate-600 hover:text-primary-700 h-8 px-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                          className="text-slate-400 hover:text-rose-600 h-8 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Job Category' : 'Create New Job Category'}
        description="Categorize demand recruitment sectors such as Construction, Healthcare, Hospitality, etc."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category Name *
            </label>
            <Input
              required
              placeholder="e.g. Construction & Infrastructure"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: editingCategory ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                }));
              }}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Slug Identifier *
            </label>
            <Input
              required
              placeholder="e.g. construction-infrastructure"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the skills, trades, and requirements for this sector..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <label htmlFor="catActive" className="text-xs font-medium text-slate-700">
              Active for vacancy posting and applicant preferences
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
            >
              {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Job Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? If there are active job vacancies associated with this category, the deletion will be rejected.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
