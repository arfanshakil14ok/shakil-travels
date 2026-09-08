'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, Shield, Calendar, Clock, UserRound } from 'lucide-react';

export interface UserViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const UserViewDialog: React.FC<UserViewDialogProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Member Profile"
      description="Detailed user record and assigned system permissions."
      maxWidth="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Avatar & Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user.name ? user.name.slice(0, 2).toUpperCase() : <UserRound className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'gold' : 'navy'}>
                {user.role?.name}
              </Badge>
              <Badge variant={user.isActive ? 'success' : 'error'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{user.phone || 'No phone recorded'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Role Description: {user.role?.description || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last Login: {formatDate(user.lastLoginAt, true)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Account Created: {formatDate(user.createdAt, true)}</span>
          </div>
        </div>

        {/* User ID Internal System info */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-500 break-all">
          <span className="font-semibold block text-slate-700">Internal System UUID:</span>
          {user.id}
        </div>
      </div>
    </Modal>
  );
};
