'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { UserPlus } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

export interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleOption[];
  onSuccess: () => void;
}

export const UserCreateDialog: React.FC<UserCreateDialogProps> = ({
  isOpen,
  onClose,
  roles,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          password,
          roleId: roleId || roles[0]?.id,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      onSuccess();
      onClose();
      // Reset state
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
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
      title="Create New Staff Member"
      description="Add a new administrator, recruiter, or accounts staff member."
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Staff
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Full Name"
          required
          placeholder="e.g. Mahbub Alam"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="mahbub@shakilglobal.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+880 1711-XXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Initial Password"
          type="password"
          required
          placeholder="Minimum 8 characters (1 uppercase, 1 digit)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Must be at least 8 characters with letters and numbers."
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
            description="Active accounts can sign in to the platform."
          />
        </div>
      </form>
    </Modal>
  );
};
