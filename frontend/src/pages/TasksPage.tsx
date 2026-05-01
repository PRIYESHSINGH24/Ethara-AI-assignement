import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Search, CheckSquare, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Task, Project } from '../../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import TaskModal from '../../components/tasks/TaskModal';

const PRIORITY_COLOR: Record<string, string> = { low: 'var(--accent-green)', medium: 'var(--accent-cyan)', high: 'var(--accent-orange)', urgent: 'var(--accent-red)' };
const STATUS_BADGE: Record<string, string> = { todo: 'badge-purple', in_progress: 'badge-cyan', review: 'badge-orange', done: 'badge-green' };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
      setTasks(tasksRes.data.data);
      setProjects(projRes.data.data);
    } catch { toast.error('Failed to load tasks'); }
    setLoading(false);
  };

  const handleCreate = async (data: any) => {
    try {
      const res = await api.post('/tasks', data);
      setTasks((prev) => [res.data.data, ...prev]);
      toast.success('Task created!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); throw err; }
  };

  const handleUpdate = async (data: any) => {
    if (!editTask) return;
    try {
      const res = await api.put(`/tasks/${editTask.id}`, data);
      setTasks((prev) => prev.map((t) => (t.id === editTask.id ? { ...t, ...res.data.data } : t)));
      toast.success('Task updated!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); throw err; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: status as Task['status'] } : t)));
    } catch {}
  };

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject && t.projectId !== filterProject) return false;
    return true;
  });

  const myTasks = filtered.filter((t) => t.assigneeId === user?.id);
  const overdueTasks = filtered.filter((t) => t.isOverdue);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>My Tasks</h1>
          <p>{filtered.length} tasks · {myTasks.length} assigned to me · {overdueTasks.length} overdue</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(undefined); setShowModal(true); }}>
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 140 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="todo">To Do</option><option value="in_progress">In Progress</option>
          <option value="review">Review</option><option value="done">Done</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option><option value="medium">Medium</option>
          <option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || filterStatus || filterPriority || filterProject) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterProject(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckSquare size={48} /></div>
          <h3>{search || filterStatus || filterPriority ? 'No tasks match your filters' : 'No tasks yet'}</h3>
          <p>{!search && !filterStatus && !filterPriority && 'Create a task to get started'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {filtered.map((task, i) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}>
                <div className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Priority dot */}
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />

                    {/* Status checkbox */}
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${task.status === 'done' ? 'var(--accent-green)' : 'var(--border-color)'}`, background: task.status === 'done' ? 'var(--accent-green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}>
                      {task.status === 'done' && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>

                    {/* Title + project */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </div>
                      </Link>
                      {task.project && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: task.project.color }} />
                        {task.project.name}
                      </div>}
                    </div>

                    {/* Overdue */}
                    {task.isOverdue && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-red)', fontSize: '0.75rem', flexShrink: 0 }}><AlertTriangle size={12} /> Overdue</span>}

                    {/* Due date */}
                    {task.dueDate && !task.isOverdue && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{format(parseISO(task.dueDate), 'MMM d')}</span>}

                    {/* Assignee */}
                    {task.assignee && (
                      <div className="avatar avatar-sm" title={task.assignee.name} style={{ flexShrink: 0 }}>
                        {task.assignee.avatar ? <img src={task.assignee.avatar} alt={task.assignee.name} /> : task.assignee.name?.[0]}
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`badge ${STATUS_BADGE[task.status]}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>{task.status.replace('_', ' ')}</span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditTask(task); setShowModal(true); }} style={{ fontSize: '0.75rem' }}>Edit</button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(task.id)}>✕</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <TaskModal
            open={showModal}
            onClose={() => { setShowModal(false); setEditTask(undefined); }}
            onSave={editTask ? handleUpdate : handleCreate}
            task={editTask}
            projectId={editTask?.projectId || projects[0]?.id || ''}
            members={projects.flatMap((p) => p.members || [])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
