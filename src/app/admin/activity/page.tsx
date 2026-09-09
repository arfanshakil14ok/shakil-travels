'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Eye, RefreshCw, Filter, Search, Calendar, User, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { AuditLogDetailDialog } from '@/components/admin/audit-log-detail-dialog';

export default function AdminActivityPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedActorType, setSelectedActorType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingLog, setViewingLog] = useState<any | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedAction) params.append('action', selectedAction);
      if (selectedEntity) params.append('entity', selectedEntity);
      if (selectedActorType && selectedActorType !== 'ALL') params.append('actorType', selectedActorType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('search', searchTerm);
      params.append('pageSize', '50');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setLogs(data.data.logs || []);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, selectedEntity, selectedActorType, startDate, endDate, searchTerm, error]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: Column<any>[] = [
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (item) => (
        <span
          className={`font-semibold font-mono text-xs ${
            item.action.includes('REJECTED') || item.action.includes('DELETED') || item.action.includes('FAILED')
              ? 'text-rose-600'
              : item.action.includes('VERIFIED') || item.action.includes('SUCCESS') || item.action.includes('RECORDED')
              ? 'text-emerald-700'
              : item.action.includes('UPLOADED') || item.action.includes('REPLACED')
              ? 'text-blue-700'
              : item.action.includes('VOID')
              ? 'text-amber-700'
              : 'text-slate-800'
          }`}
        >
          {item.action}
        </span>
      ),
    },
    {
      key: 'actorType',
      header: 'Actor Type',
      render: (item) => {
        const type = item.actorType || (item.applicantId && !item.userId ? 'APPLICANT' : 'STAFF');
        return (
          <Badge
            variant={type === 'STAFF' ? 'primary' : type === 'APPLICANT' ? 'success' : 'neutral'}
            size="sm"
          >
            {type}
          </Badge>
        );
      },
    },
    {
      key: 'actor',
      header: 'Actor / Candidate',
      render: (item) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-slate-800 text-xs truncate">
            {item.user?.name || item.applicant?.fullName || 'System Actor'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {item.user?.email || item.applicant?.applicantNumber || item.ipAddress || 'Internal'}
          </span>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.entity}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="text-xs text-slate-600 max-w-xs truncate block" title={item.description || ''}>
          {item.description || item.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (item) => (
        <span className="font-mono text-xs text-slate-500">{item.ipAddress || '127.0.0.1'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(item.createdAt, true)}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Details',
      className: 'text-right',
      render: (item) => (
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setViewingLog(item)}
          tooltip="View Entry State & Metadata"
          aria-label={`View audit log details for ${item.action}`}
        >
          <Eye className="w-4 h-4" />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Audit & Compliance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            System & User Activity Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, append-only security logs of candidate portal interactions, admin actions, and financial transactions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchLogs}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Log
        </Button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Search Term */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Search Keywords</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Action, description, name..."
              className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          {/* Actor Type */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Actor Type</label>
            <select
              value={selectedActorType}
              onChange={(e) => setSelectedActorType(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            >
              <option value="ALL">All Actors</option>
              <option value="STAFF">Staff / Admin</option>
              <option value="APPLICANT">Candidate / Applicant</option>
              <option value="SYSTEM">System / Automated</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Entity</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            >
              <option value="">All Entities</option>
              <option value="DOCUMENT">Document</option>
              <option value="APPLICANT">Applicant</option>
              <option value="APPLICATION">Application</option>
              <option value="INVOICE">Invoice</option>
              <option value="PAYMENT">Payment</option>
              <option value="INTERVIEW">Interview</option>
              <option value="VISA_APPLICATION">Visa Application</option>
              <option value="USER">Staff User</option>
            </select>
          </div>

          {/* Date Range - From */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          {/* Date Range - To */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No activity logs found matching the current filters."
      />

      {/* Audit Log Detail Dialog */}
      <AuditLogDetailDialog
        isOpen={!!viewingLog}
        onClose={() => setViewingLog(null)}
        log={viewingLog}
      />
    </div>
  );
}
