'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Eye,
  Pencil,
  CircleCheck,
  CircleX,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { UserCreateDialog } from '@/components/admin/user-create-dialog';
import { UserEditDialog } from '@/components/admin/user-edit-dialog';
import { UserViewDialog } from '@/components/admin/user-view-dialog';

export default function UsersManagementPage() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Status toggle confirmation
  const [toggleUser, setToggleUser] = useState<any | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedRole) params.append('roleId', selectedRole);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load staff users');
      }

      setUsers(data.data.users || []);
      if (data.data.roles) {
        setRoles(data.data.roles);
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedStatus, error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!toggleUser) return;
    setIsToggling(true);

    try {
      const res = await fetch(`/api/users/${toggleUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toggleUser.name,
          email: toggleUser.email,
          phone: toggleUser.phone,
          roleId: toggleUser.roleId,
          isActive: !toggleUser.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change user status');
      }

      success(
        `User ${toggleUser.name} has been ${
          !toggleUser.isActive ? 'activated' : 'deactivated'
        }.`
      );
      setToggleUser(null);
      fetchUsers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsToggling(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {item.name ? item.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 block truncate">{item.name}</span>
            <span className="text-xs text-slate-400 truncate">{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item) => <span className="text-xs text-slate-600">{item.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (item) => (
        <Badge
          variant={
            item.role?.name === 'SUPER_ADMIN'
              ? 'gold'
              : item.role?.name === 'ADMIN'
              ? 'navy'
              : 'neutral'
          }
          size="sm"
        >
          {item.role?.name || 'VIEWER'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'error'} size="sm">
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.lastLoginAt, true)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{formatDate(item.createdAt, false)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* View Action */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={`View profile of ${item.name}`}
            tooltip="View Details"
            onClick={() => setViewingUser(item)}
            className="text-slate-500 hover:text-navy-900"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </IconButton>

          {/* Edit Action */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={`Edit staff member ${item.name}`}
            tooltip="Edit User"
            onClick={() => setEditingUser(item)}
            className="text-slate-500 hover:text-navy-900"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </IconButton>

          {/* Activate / Deactivate Toggle */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={
              item.isActive
                ? `Deactivate account for ${item.name}`
                : `Activate account for ${item.name}`
            }
            tooltip={item.isActive ? 'Deactivate User' : 'Activate User'}
            onClick={() => setToggleUser(item)}
            className={
              item.isActive
                ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
            }
          >
            {item.isActive ? (
              <CircleX className="w-4 h-4" aria-hidden="true" />
            ) : (
              <CircleCheck className="w-4 h-4" aria-hidden="true" />
            )}
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              System Access Control
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff & User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign database-backed roles, create recruitment staff, and toggle account activation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          >
            Add New Staff
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <div className="w-48">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-900"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive Accounts</option>
          </select>
        </div>

        {(selectedRole || selectedStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole('');
              setSelectedStatus('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main DataTable */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Search staff by name, email, or phone..."
          emptyMessage="No staff accounts found matching your query."
        />
      </div>

      {/* Create Dialog */}
      <UserCreateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        roles={roles}
        onSuccess={() => {
          success('Staff account created successfully.');
          fetchUsers();
        }}
      />

      {/* Edit Dialog */}
      <UserEditDialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        roles={roles}
        onSuccess={() => {
          success('Staff account updated successfully.');
          fetchUsers();
        }}
      />

      {/* View Dialog */}
      <UserViewDialog
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
      />

      {/* Confirm Deactivate/Activate Dialog */}
      <ConfirmDialog
        isOpen={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={handleToggleStatus}
        isLoading={isToggling}
        variant={toggleUser?.isActive ? 'destructive' : 'primary'}
        title={
          toggleUser?.isActive
            ? `Deactivate ${toggleUser?.name}?`
            : `Activate ${toggleUser?.name}?`
        }
        description={
          toggleUser?.isActive
            ? `Deactivating ${toggleUser?.name} will immediately revoke their access to the system. They will not be able to log in.`
            : `Activating ${toggleUser?.name} will restore their login access with their current role permissions.`
        }
        confirmLabel={toggleUser?.isActive ? 'Deactivate User' : 'Activate User'}
      />
    </div>
  );
}
