'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowLeft,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Edit2,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const CHANNEL_ICONS: Record<string, any> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
  IN_APP: Bell,
};

export default function TemplatesPage() {
  const { success, error } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    channel: 'EMAIL',
    subject: '',
    content: '',
    variables: 'applicantName,jobTitle,applicationCode',
    isActive: true,
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const url = channelFilter !== 'ALL'
        ? `/api/communications/templates?channel=${channelFilter}`
        : '/api/communications/templates';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      } else {
        error(data.error || 'Failed to load templates');
      }
    } catch {
      error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [channelFilter, error]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      code: '',
      channel: 'EMAIL',
      subject: '',
      content: '',
      variables: 'applicantName,jobTitle,applicationCode',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      code: tpl.code,
      channel: tpl.channel,
      subject: tpl.subject || '',
      content: tpl.content,
      variables: tpl.variables || '',
      isActive: tpl.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingTemplate
        ? `/api/communications/templates/${editingTemplate.id}`
        : '/api/communications/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        success(editingTemplate ? 'Template updated' : 'Template created');
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        error(data.error || 'Failed to save template');
      }
    } catch {
      error('Error saving template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/communications/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        success('Template deleted');
        fetchTemplates();
      } else {
        error(data.error || 'Failed to delete');
      }
    } catch {
      error('Error deleting template');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/communications"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Communications
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            Communication Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standardize operational notifications with reusable dynamic templates for Email, SMS, WhatsApp, and In-App messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {['ALL', 'EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'].map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              channelFilter === ch
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {ch === 'ALL' ? 'All Channels' : ch}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No templates configured for this channel yet.
          </div>
        ) : (
          templates.map((tpl) => {
            const Icon = CHANNEL_ICONS[tpl.channel] || Mail;
            return (
              <div
                key={tpl.id}
                className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground">
                      <Icon className="w-3 h-3 text-primary" />
                      {tpl.channel}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{tpl.code}</span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{tpl.name}</h3>
                  {tpl.subject && (
                    <div className="text-xs font-medium text-muted-foreground mt-1 truncate">
                      Subject: {tpl.subject}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-2 bg-muted/30 p-2.5 rounded border border-border">
                    {tpl.content}
                  </p>
                  {tpl.variables && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tpl.variables.split(',').map((v: string) => (
                        <span
                          key={v}
                          className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                        >
                          {`{{${v.trim()}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(tpl)}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleDelete(tpl.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Edit Communication Template' : 'Create Communication Template'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Template Name *</label>
            <Input
              required
              placeholder="e.g. Visa Approval Notice"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Template Code *
              </label>
              <Input
                required
                disabled={!!editingTemplate}
                placeholder="e.g. VISA_APPROVED_NOTICE"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Channel *</label>
              <select
                className="w-full text-sm bg-background border border-border rounded-lg p-2"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
          </div>

          {formData.channel === 'EMAIL' && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Subject</label>
              <Input
                placeholder="e.g. SHAKIL GLOBAL MANPOWER — Visa Approval for {{applicantName}}"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Template Body Content *
            </label>
            <textarea
              rows={5}
              required
              className="w-full text-sm bg-background border border-border rounded-lg p-3 text-foreground"
              placeholder="Dear {{applicantName}}, your visa for {{jobTitle}} has been approved..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Interpolation Variables (comma-separated)
            </label>
            <Input
              placeholder="applicantName,jobTitle,applicationCode,appointmentDate"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
