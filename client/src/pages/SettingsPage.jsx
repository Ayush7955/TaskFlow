import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Save,
  UserPlus,
  LogOut,
  Trash2,
  Shield,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import useWorkspaceStore from '../stores/workspaceStore';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Textarea } from '../components/Input';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';

/* ──────────────────── Profile Section ──────────────────── */
function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setAvatarPreview(user?.avatar || '');
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="font-display font-light text-xl text-ink mb-6">
        Profile
      </h3>

      <div className="flex items-start gap-6">
        {/* Avatar upload */}
        <div className="relative group shrink-0">
          <Avatar name={name} src={avatarPreview} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Upload avatar"
          >
            <Camera size={16} className="text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-4">
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            value={user?.email || ''}
            disabled
            className="opacity-60"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          <Save size={16} />
          Save changes
        </Button>
      </div>
    </Card>
  );
}

/* ──────────────────── Workspace Section ──────────────────── */
function WorkspaceSection() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const user = useAuthStore((s) => s.user);

  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;
  const isOwnerOrAdmin =
    currentWorkspace?.owner === (user?._id || user?.id) ||
    currentWorkspace?.role === 'owner' ||
    currentWorkspace?.role === 'admin';

  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [wsDescription, setWsDescription] = useState(
    currentWorkspace?.description || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWsName(currentWorkspace?.name || '');
    setWsDescription(currentWorkspace?.description || '');
  }, [currentWorkspace]);

  const handleSave = async () => {
    if (!wsName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        name: wsName.trim(),
        description: wsDescription.trim(),
      });
      toast.success('Workspace updated');
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwnerOrAdmin) return null;

  return (
    <Card>
      <h3 className="font-display font-light text-xl text-ink mb-6">
        Workspace
      </h3>

      <div className="space-y-4">
        <Input
          label="Workspace name"
          value={wsName}
          onChange={(e) => setWsName(e.target.value)}
        />
        <Textarea
          label="Description"
          value={wsDescription}
          onChange={(e) => setWsDescription(e.target.value)}
          placeholder="What does this workspace focus on?"
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          <Save size={16} />
          Save changes
        </Button>
      </div>
    </Card>
  );
}

/* ──────────────────── Members Section ──────────────────── */
function MembersSection() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const {
    members,
    fetchWorkspaceMembers,
    inviteMember,
    removeMember,
  } = useWorkspaceStore();
  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Enter an email address');
      return;
    }
    setIsInviting(true);
    try {
      await inviteMember(workspaceId, inviteEmail.trim(), inviteRole);
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('member');
      setInviteOpen(false);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this workspace?`)) return;
    try {
      await removeMember(workspaceId, memberId);
      toast.success(`${memberName} removed`);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const roleVariant = (role) => {
    if (role === 'owner') return 'warning';
    if (role === 'admin') return 'info';
    return 'default';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-light text-xl text-ink">Members</h3>
        <Button variant="ghost" size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} />
          Invite
        </Button>
      </div>

      {/* Members list */}
      <div className="divide-y divide-border">
        {members.map((member) => {
          const memberId = member._id || member.id || member.userId;
          const memberName = member.name || member.email || 'Unknown';
          return (
            <div
              key={memberId}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Avatar name={memberName} src={member.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-ink truncate">
                  {memberName}
                </p>
                {member.email && (
                  <p className="text-xs text-muted font-body truncate">
                    {member.email}
                  </p>
                )}
              </div>
              <Badge variant={roleVariant(member.role)} size="sm">
                <span className="inline-flex items-center gap-1">
                  {member.role === 'owner' && <Shield size={10} />}
                  {member.role || 'member'}
                </span>
              </Badge>
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(memberId, memberName)}
                  className="text-muted hover:text-red-600 transition-colors duration-150 p-1"
                  aria-label={`Remove ${memberName}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-muted font-body py-4 text-center">
            No members found
          </p>
        )}
      </div>

      {/* Invite modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        size="sm"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block font-body text-sm text-secondary mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-ink font-body text-sm focus:ring-2 focus:ring-ink focus:border-transparent outline-none transition-colors duration-150"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isInviting}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ──────────────────── Danger Zone ──────────────────── */
function DangerZone() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const isOwner =
    currentWorkspace?.owner === (user?._id || user?.id) ||
    currentWorkspace?.role === 'owner';

  const handleLeave = () => {
    if (
      !window.confirm(
        'Are you sure you want to leave this workspace? This action cannot be undone.'
      )
    )
      return;
    toast.success('Left workspace');
    logout();
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        'Are you absolutely sure you want to delete this workspace? All boards, cards, and data will be permanently deleted.'
      )
    )
      return;
    toast.success('Workspace deleted');
    logout();
  };

  return (
    <Card className="border border-red-200">
      <h3 className="font-display font-light text-xl text-red-700 mb-4">
        Danger Zone
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-body font-medium text-ink">
              Leave workspace
            </p>
            <p className="text-xs text-muted font-body mt-0.5">
              Remove yourself from this workspace
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleLeave}>
            <LogOut size={14} />
            Leave
          </Button>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between pt-4 border-t border-red-100">
            <div>
              <p className="text-sm font-body font-medium text-ink">
                Delete workspace
              </p>
              <p className="text-xs text-muted font-body mt-0.5">
                Permanently delete this workspace and all its data
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ──────────────────── Settings Page ──────────────────── */
export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display font-light text-3xl text-ink">Settings</h1>
      <ProfileSection />
      <WorkspaceSection />
      <MembersSection />
      <DangerZone />
    </div>
  );
}
