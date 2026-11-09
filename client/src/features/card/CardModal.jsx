import { useEffect, useState, useRef } from 'react';
import { X, Paperclip, MessageSquare, CheckSquare, Tag, User, Calendar, Clock, Upload, Download, Trash2, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import useUiStore from '../../stores/uiStore';
import useBoardStore from '../../stores/boardStore';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatRelative, formatDate } from '../../utils/formatters';

const TABS = ['Details', 'Checklist', 'Comments', 'Attachments'];

export default function CardModal() {
  const activeCardId = useUiStore((s) => s.activeCardId);
  const closeCard = useUiStore((s) => s.closeCard);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!activeCardId) { setCard(null); return; }
    setLoading(true);
    setActiveTab('Details');
    api.get(`/cards/${activeCardId}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setCard(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
      })
      .catch(() => toast.error('Failed to load card'))
      .finally(() => setLoading(false));
  }, [activeCardId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeCard(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeCard]);

  if (!activeCardId) return null;

  const cid = card?.public_id || card?.id;

  const saveTitle = async () => {
    if (!title.trim() || title === card?.title) { setEditingTitle(false); return; }
    try {
      await api.patch(`/cards/${cid}`, { title });
      setCard((c) => ({ ...c, title }));
    } catch { toast.error('Failed to update title'); setTitle(card?.title || ''); }
    setEditingTitle(false);
  };

  const saveDescription = async () => {
    try {
      await api.patch(`/cards/${cid}`, { description });
      setCard((c) => ({ ...c, description }));
    } catch { toast.error('Failed to update description'); }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/cards/${cid}/comments`, { content: newComment });
      const comment = res.data?.data || res.data;
      setCard((c) => ({ ...c, comments: [comment, ...(c.comments || [])] }));
      setNewComment('');
    } catch { toast.error('Failed to post comment'); }
    setSubmittingComment(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/cards/${cid}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const att = res.data?.data || res.data;
      setCard((c) => ({ ...c, attachments: [...(c.attachments || []), att] }));
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
  };

  const deleteAttachment = async (attId) => {
    try {
      await api.delete(`/cards/${cid}/attachments/${attId}`);
      setCard((c) => ({ ...c, attachments: c.attachments.filter((a) => a.id !== attId) }));
    } catch { toast.error('Failed to delete attachment'); }
  };

  const toggleChecklistItem = async (checklistId, itemId, isDone) => {
    try {
      await api.patch(`/checklists/${checklistId}/items/${itemId}`, { is_checked: !isDone });
      setCard((c) => ({
        ...c,
        checklists: c.checklists.map((cl) =>
          cl.id === checklistId
            ? { ...cl, items: cl.items.map((it) => it.id === itemId ? { ...it, is_checked: !isDone } : it) }
            : cl
        ),
      }));
    } catch { toast.error('Failed to update item'); }
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCard} />

      {/* Panel */}
      <div className="relative bg-surface rounded-xl shadow-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex-1 min-w-0 mr-4">
            {editingTitle ? (
              <input
                className="w-full font-display font-light text-2xl text-ink bg-transparent border-b border-ink outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
              />
            ) : (
              <h2
                className="font-display font-light text-2xl text-ink cursor-pointer hover:text-secondary transition-colors truncate"
                onClick={() => setEditingTitle(true)}
                title="Click to edit"
              >
                {loading ? '...' : (card?.title || 'Loading...')}
              </h2>
            )}
          </div>
          <button onClick={closeCard} className="p-2 rounded-lg hover:bg-stone-100 text-muted hover:text-ink transition-colors flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : card ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left — main */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Description */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Description</p>
                <textarea
                  className="w-full text-sm font-body text-ink bg-stone-50 rounded-xl border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-ink resize-none min-h-[80px]"
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  rows={3}
                />
              </div>

              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex gap-0">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-secondary'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === 'Details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">Due Date</label>
                      <input
                        type="date"
                        defaultValue={card.due_date?.slice(0, 10)}
                        onChange={async (e) => {
                          try { await api.patch(`/cards/${cid}`, { due_date: e.target.value }); setCard((c) => ({ ...c, due_date: e.target.value })); }
                          catch { toast.error('Failed to update due date'); }
                        }}
                        className="w-full text-sm font-body text-ink bg-stone-50 rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">Priority</label>
                      <select
                        defaultValue={card.priority || ''}
                        onChange={async (e) => {
                          try { await api.patch(`/cards/${cid}`, { priority: e.target.value }); }
                          catch { toast.error('Failed to update priority'); }
                        }}
                        className="w-full text-sm font-body text-ink bg-stone-50 rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-ink appearance-none"
                      >
                        <option value="">No priority</option>
                        <option value="4">Low</option>
                        <option value="3">Medium</option>
                        <option value="2">High</option>
                        <option value="1">Critical</option>
                      </select>
                    </div>
                  </div>
                  {/* Labels */}
                  {card.labels?.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">Labels</label>
                      <div className="flex flex-wrap gap-1.5">
                        {card.labels.map((l) => (
                          <Badge key={l.id} variant="default" size="sm">{l.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Checklist' && (
                <div className="space-y-4">
                  {(card.checklists || []).map((cl) => {
                    const done = cl.items?.filter((i) => i.is_checked).length || 0;
                    const total = cl.items?.length || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={cl.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">{cl.title}</p>
                          <span className="text-xs text-muted">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-pill overflow-hidden">
                          <div className={`h-full rounded-pill transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-ink'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="space-y-1">
                          {(cl.items || []).map((item) => (
                            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={item.is_checked}
                                onChange={() => toggleChecklistItem(cl.id, item.id, item.is_checked)}
                                className="rounded border-border text-ink focus:ring-ink"
                              />
                              <span className={`text-sm font-body flex-1 ${item.is_checked ? 'line-through text-muted' : 'text-ink'}`}>
                                {item.content}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!card.checklists?.length && (
                    <p className="text-sm text-muted text-center py-8">No checklists yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'Comments' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <textarea
                      className="w-full text-sm font-body text-ink bg-stone-50 rounded-xl border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-ink resize-none"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={submitComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-1.5 text-sm font-medium bg-ink text-canvas rounded-pill hover:bg-ink-800 disabled:opacity-50 transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                  <div className="space-y-3 mt-4">
                    {(card.comments || []).map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar name={c.user?.name} src={c.user?.avatar_url} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-ink">{c.user?.name}</span>
                            <span className="text-xs text-muted">{formatRelative(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-secondary mt-0.5 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    {!card.comments?.length && (
                      <p className="text-sm text-muted text-center py-6">No comments yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Attachments' && (
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-sm text-muted hover:border-secondary hover:text-secondary transition-colors"
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Click to upload a file
                  </button>
                  <div className="space-y-2">
                    {(card.attachments || []).map((att) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-border">
                        <Paperclip className="h-4 w-4 text-muted flex-shrink-0" />
                        <span className="flex-1 text-sm text-ink truncate">{att.filename}</span>
                        <span className="text-xs text-muted">
                          {att.file_size ? `${Math.round(att.file_size / 1024)}KB` : ''}
                        </span>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-stone-200 rounded-lg text-muted hover:text-ink transition-colors">
                          <Download className="h-4 w-4" />
                        </a>
                        <button onClick={() => deleteAttachment(att.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {!card.attachments?.length && (
                      <p className="text-sm text-muted text-center py-4">No attachments yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="w-56 flex-shrink-0 border-l border-border px-4 py-4 space-y-5 overflow-y-auto bg-stone-50/50">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Members</p>
                <div className="flex flex-wrap gap-1.5">
                  {(card.assignees || []).map((u) => (
                    <Avatar key={u.id} name={u.name} src={u.avatar_url} size="sm" />
                  ))}
                </div>
                <button className="mt-2 text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors">
                  <User className="h-3 w-3" /> Add member
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {(card.labels || []).map((l) => (
                    <Badge key={l.id} variant="default" size="sm">{l.name}</Badge>
                  ))}
                </div>
                <button className="mt-2 text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors">
                  <Tag className="h-3 w-3" /> Add label
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <button className="w-full text-left text-xs text-secondary hover:text-ink px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                  Move card
                </button>
                <button className="w-full text-left text-xs text-secondary hover:text-ink px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                  Copy card
                </button>
                <button className="w-full text-left text-xs text-secondary hover:text-ink px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                  Archive
                </button>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={async () => {
                    try {
                      await api.delete(`/cards/${cid}`);
                      closeCard();
                      toast.success('Card deleted');
                    } catch { toast.error('Failed to delete card'); }
                  }}
                  className="w-full text-left text-xs text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete card
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
