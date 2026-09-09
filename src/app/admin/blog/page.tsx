'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

export default function BlogAdminPage() {
  const { success, error } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    isPublished: true,
  });

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter !== 'ALL') query.set('status', statusFilter);

      const res = await fetch(`/api/blog?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.items || []);
      } else {
        error(data.error || 'Failed to fetch articles');
      }
    } catch (err: any) {
      error(err.message || 'Error loading articles');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, error]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      isPublished: post.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSubmitting(true);

    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        success(editingPost ? 'Article updated successfully' : 'Article published successfully');
        setIsModalOpen(false);
        fetchPosts();
      } else {
        error(data.error || 'Failed to save article');
      }
    } catch (err: any) {
      error(err.message || 'Error saving article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (post: any) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        success(post.isPublished ? 'Article moved to drafts' : 'Article published live');
        fetchPosts();
      } else {
        error(data.error || 'Failed to update publication status');
      }
    } catch (err: any) {
      error(err.message || 'Error updating status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/blog/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        success('Article deleted successfully');
        setDeleteTarget(null);
        fetchPosts();
      } else {
        error(data.error || 'Failed to delete article');
      }
    } catch (err: any) {
      error(err.message || 'Error deleting article');
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-600" />
            Overseas News & Articles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish government recruitment notices, visa quota updates, legal advisories, and migrant stories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPosts}
            className="border-slate-300 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Article
          </Button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Articles</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{posts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-emerald-600">Published Live</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-amber-600">Drafts</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{draftCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search articles by title, excerpt or content..."
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
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
            Loading articles...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No articles found</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "New Article" to publish news or advisories</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Article Title</th>
                  <th className="py-3 px-4">Slug Identifier</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                      <div className="flex items-center gap-2.5">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="line-clamp-1">{post.title}</div>
                          {post.excerpt && (
                            <div className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {post.excerpt}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{post.slug}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        title="Click to toggle publish status"
                      >
                        <Badge variant={post.isPublished ? 'success' : 'neutral'}>
                          {post.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(post)}
                          className="text-slate-600 hover:text-primary-700 h-8 px-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(post)}
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

      {/* Create / Edit Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Edit Overseas Article' : 'Compose New Article'}
        description="Publish recruitment announcements, policy briefings, and destination country guidance."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Article Title *
            </label>
            <Input
              required
              placeholder="e.g. Bangladesh-Singapore Manpower Quota 2026: Official Guidelines"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  title,
                  slug: editingPost ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                }));
              }}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              URL Slug *
            </label>
            <Input
              required
              placeholder="e.g. singapore-manpower-quota-2026"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Short Summary / Excerpt
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary appearing on social cards, previews, and listings..."
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Article Content * (Markdown Supported)
            </label>
            <textarea
              required
              rows={7}
              placeholder="Write article content here..."
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cover Image URL
            </label>
            <Input
              placeholder="e.g. https://images.unsplash.com/... or /images/news.jpg"
              value={formData.coverImage}
              onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="postPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <label htmlFor="postPublished" className="text-xs font-medium text-slate-700">
              Publish immediately to public website
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
              {submitting ? 'Saving...' : editingPost ? 'Save Changes' : 'Publish Article'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
