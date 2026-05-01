import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Tag } from 'lucide-react';
import { Task, User } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  task?: Task;
  projectId: string;
  members: User[];
}

export default function TaskModal({ open, onClose, onSave, task, projectId, members }: Props) {
  const [form, setForm] = useState({ title: '', description: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '', tags: [] as string[], estimatedHours: '' });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title, description: task.description, assigneeId: task.assigneeId || '',
        priority: task.priority, status: task.status, dueDate: task.dueDate?.split('T')[0] || '',
        tags: task.tags || [], estimatedHours: task.estimatedHours?.toString() || '',
      });
    } else {
      setForm({ title: '', description: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '', tags: [], estimatedHours: '' });
    }
    setTagInput('');
  }, [task, open]);

  const set = (key: string) => (e: React.ChangeEvent<any>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null, assigneeId: form.assigneeId || null });
      onClose();
    } catch {}
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" style={{ maxWidth: 600 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" placeholder="What needs to be done?" value={form.title} onChange={set('title')} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Add details, context, or acceptance criteria..." value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option value="low">🟢 Low</option>
                <option value="medium">🔵 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <input type="number" min="0.5" step="0.5" className="form-input" placeholder="e.g. 4" value={form.estimatedHours} onChange={set('estimatedHours')} />
          </div>

          <div className="form-group">
            <label className="form-label"><Tag size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Tags</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="Add tag and press Enter" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={addTag}>Add</button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {form.tags.map((tag) => (
                  <div key={tag} className="chip" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>
                    {tag} <X size={10} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
