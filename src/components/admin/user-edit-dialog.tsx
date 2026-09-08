'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Pencil } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

export interface UserEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  roles: RoleOption[];
  onSuccess: () => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  isOpen,
  onClose,
  user,
  roles,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRoleId(user.roleId || user.role?.id || '');
      setIsActive(user.isActive ?? true);
      setPassword('');
      setError(null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          password: password || undefined,
          roleId,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Staff Member"
      description={`Update account details and role for ${user?.name || 'Staff'}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Pencil className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Full Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Reset Password"
          type="password"
          placeholder="Leave blank to keep existing password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Only fill this field if you wish to reset their password."
        />

        <Select
          label="System Role"
          required
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} - {r.description}
            </option>
          ))}
        </Select>

        <div className="pt-2">
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Account Active"
            description="Deactivated users are immediately barred from logging in."
          />
        </div>
      </form>
    </Modal>
  );
};
