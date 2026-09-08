'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { History, Globe, Laptop, User } from 'lucide-react';

export interface AuditLogDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
}

export const AuditLogDetailDialog: React.FC<AuditLogDetailDialogProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!log) return null;

  const parseJson = (val: string | null) => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  };

  const oldParsed = parseJson(log.oldValue);
  const newParsed = parseJson(log.newValue);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log Entry Details"
      description="Immutable security inspection and event audit trail record."
      maxWidth="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Dismiss
        </Button>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Event Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">{log.action}</span>
            <Badge variant="navy">{log.entity}</Badge>
            {log.entityId && (
              <span className="font-mono text-slate-500 text-[11px]">ID: {log.entityId}</span>
            )}
          </div>
          <span className="text-slate-500">{formatDate(log.createdAt, true)}</span>
        </div>

        {/* Actor and Network Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Actor:</span>
              <span className="font-semibold text-slate-800 truncate block">
                {log.user?.name || 'System Actor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Client IP:</span>
              <span className="font-mono text-slate-800 truncate block">
                {log.ipAddress || '127.0.0.1'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Client Agent:</span>
              <span className="text-slate-700 truncate block" title={log.userAgent || ''}>
                {log.userAgent ? log.userAgent.slice(0, 30) + '...' : 'Browser'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Comparison */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">State Modifications (Old vs New):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Old Value */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 text-[11px]">
                Previous State (Old)
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 overflow-x-auto text-[11px] font-mono max-h-56">
                {oldParsed ? JSON.stringify(oldParsed, null, 2) : 'null'}
              </pre>
            </div>

            {/* New Value */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 text-[11px]">
                Resulting State (New)
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 overflow-x-auto text-[11px] font-mono max-h-56">
                {newParsed ? JSON.stringify(newParsed, null, 2) : 'null'}
              </pre>
            </div>
          </div>
        </div>

        {/* System Identifier */}
        <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
          Audit Entry ID: {log.id}
        </div>
      </div>
    </Modal>
  );
};
