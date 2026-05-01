import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, MessageSquare, Send, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { Task, Comment } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { AnimatePresence } from 'framer-motion';

const PRIORITY_COLOR: Record<string, string> = { low: 'var(--accent-green)', medium: 'var(--accent-cyan)', high: 'var(--accent-orange)', urgent: 'var(--accent-red)' };
const STATUS_COLOR: Record<string, string> = { todo: '#5a5a80', in_progress: 'var(--accent-cyan)', review: 'var(--accent-orange)', done: 'var(--accent-green)' };

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { if (id) loadTask(); }, [id]);

  const loadTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.data);
    } catch { toast.error('Task not found'); navigate('/tasks'); }
    setLoading(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!task) return;
    try {
      await api.put(`/tasks/${task.id}`, { status });
      setTask((prev) => prev ? { ...prev, status: status as Task['status'] } : prev);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const postComment = async () => {
    if (!comment.trim() || !task) return;
    setPosting(true);
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { content: comment.trim() });
      setTask((prev) => prev ? { ...prev, comments: [...(prev.comments || []), res.data.data] } : prev);
      setComment('');
    } catch { toast.error('Failed to post comment'); }
    setPosting(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!task) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="grid grid-2" style={{ gap: 24, alignItems: 'start' }}>
          {/* Main content */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card card-body">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: PRIORITY_COLOR[task.priority], fontWeight: 700, textTransform: 'uppercase' }}>{task.priority} Priority</span>
                    {task.isOverdue && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 600 }}><AlertTriangle size={12} />Overdue</span>}
                  </div>
                  <h2 style={{ fontSize: '1.5rem', lineHeight: 1.3 }}>{task.title}</h2>
                </div>

                {/* Status selector */}
                <select className="form-select" style={{ width: 160 }} value={task.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Description */}
              {task.description && (
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </div>
              )}

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Project', value: task.project?.name, icon: <Tag size={14} />, color: task.project?.color },
                  { label: 'Assignee', value: task.assignee?.name || 'Unassigned', icon: <User size={14} /> },
                  { label: 'Due Date', value: task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—', icon: <Calendar size={14} /> },
                  { label: 'Est. Hours', value: task.estimatedHours ? `${task.estimatedHours}h` : '—', icon: <Clock size={14} /> },
                  { label: 'Created', value: format(parseISO(task.createdAt), 'MMM d, yyyy'), icon: <Calendar size={14} /> },
                  { label: 'Created By', value: task.creator?.name, icon: <User size={14} /> },
                ].map((m) => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 6 }}>
                      {m.icon}{m.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: m.color || 'var(--text-primary)' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                  {task.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
                </div>
              )}

              <div className="divider" />

              {/* Comments */}
              <div>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} /> Comments ({task.comments?.length || 0})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <AnimatePresence>
                    {task.comments?.map((c) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 10 }}>
                        <div className="avatar avatar-sm">{c.user?.avatar ? <img src={c.user.avatar} alt={c.user.name} /> : c.user?.name?.[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.user?.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{format(parseISO(c.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.6 }}>{c.content}</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {(!task.comments || task.comments.length === 0) && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 20 }}>No comments yet. Be the first!</div>
                  )}
                </div>

                {/* Comment input */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div className="avatar avatar-sm">{user?.name?.[0]}</div>
                  <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <textarea
                      className="form-textarea" placeholder="Add a comment..."
                      value={comment} onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                      style={{ minHeight: 72, flex: 1 }}
                    />
                    <motion.button className="btn btn-primary btn-icon" onClick={postComment} disabled={posting || !comment.trim()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {posting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={16} />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
