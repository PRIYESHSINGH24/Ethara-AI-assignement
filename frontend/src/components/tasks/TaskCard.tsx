import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, AlertTriangle, ChevronRight, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import type { Task, User } from '../../types';
import { format, parseISO } from 'date-fns';
import { useState, useRef, useEffect } from 'react';

const PRIORITY_COLOR: Record<string, string> = { low: 'var(--accent-green)', medium: 'var(--accent-cyan)', high: 'var(--accent-orange)', urgent: 'var(--accent-red)' };

interface Props {
  task: Task;
  members: User[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  statuses: string[];
  isAdmin: boolean;
}

export default function TaskCard({ task, members, onEdit, onDelete, onStatusChange, statuses, isAdmin }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="kanban-card">
      {/* Priority stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: PRIORITY_COLOR[task.priority], borderRadius: '4px 0 0 4px' }} />

      <div style={{ paddingLeft: 4 }}>
        {/* Title + menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none', flex: 1 }}>
            <h5 style={{ fontSize: '0.88rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>{task.title}</h5>
          </Link>
          {isAdmin && (
            <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowMenu(!showMenu)} style={{ width: 24, height: 24, padding: 0 }}>
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <div className="dropdown-menu" style={{ right: 0, top: '100%', minWidth: 140 }}>
                  <div className="dropdown-item" onClick={() => { onEdit(); setShowMenu(false); }}><Edit3 size={13} /> Edit</div>
                  {statuses.filter((s) => s !== task.status).map((s) => (
                    <div key={s} className="dropdown-item" onClick={() => { onStatusChange(task.id, s); setShowMenu(false); }}>
                      <ChevronRight size={13} /> Move to {s.replace('_', ' ')}
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                  <div className="dropdown-item danger" onClick={() => { onDelete(task.id); setShowMenu(false); }}><Trash2 size={13} /> Delete</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {task.tags.slice(0, 3).map((tag) => <span key={tag} className="chip">{tag}</span>)}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {task.isOverdue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-red)', fontSize: '0.72rem' }}>
                <AlertTriangle size={11} /> Overdue
              </span>
            )}
            {task.dueDate && !task.isOverdue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                <Calendar size={11} /> {format(parseISO(task.dueDate), 'MMM d')}
              </span>
            )}
            {(task.commentCount ?? 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                <MessageSquare size={11} /> {task.commentCount}
              </span>
            )}
          </div>

          {task.assignee && (
            <div className="avatar avatar-sm" title={task.assignee.name}>
              {task.assignee.avatar ? <img src={task.assignee.avatar} alt={task.assignee.name} /> : task.assignee.name?.[0]}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
