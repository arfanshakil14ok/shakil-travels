'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Eye, RefreshCw, Filter } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { AuditLogDetailDialog } from '@/components/admin/audit-log-detail-dialog';

export default function AdminAuditLogsPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [viewingLog, setViewingLog] = useState<any | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedAction) params.append('action', selectedAction);
      if (selectedEntity) params.append('entity', selectedEntity);
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
  }, [selectedAction, selectedEntity, error]);

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
            item.action.includes('FAILED')
              ? 'text-rose-600'
              : item.action.includes('SUCCESS')
              ? 'text-emerald-700'
              : item.action.includes('DELETED') || item.action.includes('DEACTIVATED')
              ? 'text-amber-700'
              : 'text-navy-900'
          }`}
        >
          {item.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      sortable: true,
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.entity}
        </Badge>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 text-xs">
            {item.user?.name || 'System Actor'}
          </span>
          <span className="text-[10px] text-slate-400">{item.user?.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">{item.ipAddress || '127.0.0.1'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.createdAt, true)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      className: 'text-right',
      render: (item) => (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={`View audit log details for ${item.action}`}
          tooltip="View Details"
          onClick={() => setViewingLog(item)}
          className="text-slate-500 hover:text-navy-900"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Immutable Security Journal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Full compliance record of authentication events, user role edits, and setting modifications.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <div className="w-48">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            <option value="SETTING_UPDATED">SETTING_UPDATED</option>
            <option value="SYSTEM_INIT">SYSTEM_INIT</option>
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
            aria-label="Filter by entity"
          >
            <option value="">All Entities</option>
            <option value="AUTH">AUTH</option>
            <option value="USER">USER</option>
            <option value="SETTING">SETTING</option>
            <option value="DATABASE">DATABASE</option>
          </select>
        </div>

        {(selectedAction || selectedEntity) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAction('');
              setSelectedEntity('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Audit Log DataTable */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          searchPlaceholder="Search audit logs by action, IP, or user..."
          emptyMessage="No audit logs recorded matching this query."
        />
      </div>

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        isOpen={!!viewingLog}
        onClose={() => setViewingLog(null)}
        log={viewingLog}
      />
    </div>
  );
}
