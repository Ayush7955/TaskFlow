import { useState } from 'react';
import { MoreHorizontal, UserPlus, Filter, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import DropdownMenu from '../../components/DropdownMenu';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function BoardHeader() {
  const { currentBoard, members } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(currentBoard?.name || '');

  if (!currentBoard) return null;

  const handleRename = async () => {
    if (!title.trim() || title === currentBoard.name) {
      setEditing(false);
      return;
    }
    try {
      await api.patch(`/boards/${currentBoard.id}`, { name: title });
      toast.success('Board renamed');
    } catch {
      toast.error('Failed to rename board');
      setTitle(currentBoard.name);
    }
    setEditing(false);
  };

  const menuItems = [
    { label: 'Rename', icon: <Pencil className="h-4 w-4" />, onClick: () => setEditing(true) },
    {
      label: currentBoard.visibility === 'private' ? 'Make public' : 'Make private',
      icon: currentBoard.visibility === 'private' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
      onClick: async () => {
        try {
          await api.patch(`/boards/${currentBoard.id}`, {
            visibility: currentBoard.visibility === 'private' ? 'public' : 'private',
          });
          toast.success('Visibility updated');
        } catch {
          toast.error('Failed to update visibility');
        }
      },
    },
    {
      label: 'Delete board',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => toast.error('Delete from workspace settings'),
      danger: true,
    },
  ];

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-surface border-b border-border">
      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            className="font-display font-light text-xl text-ink bg-transparent border-b border-ink outline-none w-full max-w-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
          />
        ) : (
          <h1
            className="font-display font-light text-xl text-ink truncate cursor-default"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {currentBoard.name}
          </h1>
        )}
      </div>

      {/* Visibility */}
      <Badge variant={currentBoard.visibility === 'private' ? 'default' : 'info'} size="sm">
        {currentBoard.visibility === 'private' ? <EyeOff className="h-3 w-3 mr-1 inline" /> : <Eye className="h-3 w-3 mr-1 inline" />}
        {currentBoard.visibility}
      </Badge>

      {/* Members */}
      <div className="flex items-center -space-x-2">
        {(members || []).slice(0, 5).map((m) => (
          <Avatar key={m.id} name={m.name} src={m.avatar_url} size="sm" className="ring-2 ring-surface" />
        ))}
        {members?.length > 5 && (
          <div className="h-7 w-7 rounded-full bg-stone-100 ring-2 ring-surface flex items-center justify-center text-xs text-secondary font-medium">
            +{members.length - 5}
          </div>
        )}
      </div>

      {/* Actions */}
      <Button variant="ghost" size="sm">
        <UserPlus className="h-4 w-4 mr-1.5" /> Invite
      </Button>
      <Button variant="ghost" size="sm">
        <Filter className="h-4 w-4 mr-1.5" /> Filter
      </Button>
      <DropdownMenu trigger={<button className="p-1.5 rounded-lg hover:bg-stone-100"><MoreHorizontal className="h-5 w-5 text-secondary" /></button>} items={menuItems} align="right" />
    </div>
  );
}
