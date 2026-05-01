import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Users, Settings, Trash2, UserPlus, X, CheckSquare, Clock, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { Project, Task, User, ActivityLog } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#5a5a80' },
  { key: 'in_progress', label: 'In Progress', color: '#00cec9' },
  { key: 'review', label: 'Review', color: '#fdcb6e' },
  { key: 'done', label: 'Done', color: '#00b894' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'board' | 'members' | 'activity'>('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) { loadAll(); } }, [id]);

  const loadAll = async () => {
    try {
      const [projRes, tasksRes, usersRes, actRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`),
        api.get('/auth/users'),
        api.get(`/projects/${id}/activity`),
      ]);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data);
      setAllUsers(usersRes.data.data);
      setActivity(actRes.data.data);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    setLoading(false);
  };

  const isAdmin = user?.role === 'admin' || project?.members?.find((m) => m.id === user?.id)?.projectRole === 'admin';

  const handleCreateTask = async (data: any) => {
    try {
      const res = await api.post('/tasks', { ...data, projectId: id });
      setTasks((prev) => [res.data.data, ...prev]);
      toast.success('Task created!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); throw err; }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editTask) return;
    try {
      const res = await api.put(`/tasks/${editTask.id}`, data);
      setTasks((prev) => prev.map((t) => (t.id === editTask.id ? { ...t, ...res.data.data } : t)));
      toast.success('Task updated!');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); throw err; }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t)));
    } catch { toast.error('Failed to update status'); }
  };

  const handleAddMember = async () => {
    if (!addMemberId) return;
    try {
      await api.post(`/projects/${id}/members`, { userId: addMemberId, role: addMemberRole });
      toast.success('Member added!');
      setShowAddMember(false);
      setAddMemberId('');
      loadAll();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      loadAll();
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!project) return null;

  const nonMembers = allUsers.filter((u) => !project.members?.find((m) => m.id === u.id));

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={15} /> Back to Projects
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: project.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: project.color }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem' }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{project.description}</p>}
            </div>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEditTask(undefined); setShowTaskModal(true); }}>
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: tasks.length, color: 'var(--accent-primary)' },
          { label: 'Todo', value: tasks.filter((t) => t.status === 'todo').length, color: '#5a5a80' },
          { label: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, color: 'var(--accent-cyan)' },
          { label: 'Review', value: tasks.filter((t) => t.status === 'review').length, color: 'var(--accent-orange)' },
          { label: 'Done', value: tasks.filter((t) => t.status === 'done').length, color: 'var(--accent-green)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, maxWidth: 320 }}>
        {[{ key: 'board', label: 'Kanban Board' }, { key: 'members', label: 'Members' }, { key: 'activity', label: 'Activity' }].map((t) => (
          <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{col.label}</span>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>{colTasks.length}</span>
                </div>
                <div className="kanban-cards">
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} members={project.members || []}
                        onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        statuses={COLUMNS.map((c) => c.key)}
                        isAdmin={!!isAdmin}
                      />
                    ))}
                  </AnimatePresence>
                  {colTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>No tasks</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: 600 }}>
          {isAdmin && (
            <div style={{ marginBottom: 20 }}>
              {!showAddMember ? (
                <button className="btn btn-secondary" onClick={() => setShowAddMember(true)}><UserPlus size={16} /> Add Member</button>
              ) : (
                <div className="card card-body" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label className="form-label">Select User</label>
                    <select className="form-select" value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}>
                      <option value="">Choose user...</option>
                      {nonMembers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <label className="form-label">Role</label>
                    <select className="form-select" value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value)}>
                      <option value="member">Member</option><option value="admin">Admin</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleAddMember}>Add</button>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowAddMember(false)}><X size={16} /></button>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {project.members?.map((m) => (
              <motion.div key={m.id} layout className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar">
                  {m.avatar ? <img src={m.avatar} alt={m.name} /> : m.name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
                <span className={`badge ${m.projectRole === 'admin' ? 'badge-purple' : 'badge-cyan'}`}>{m.projectRole || 'member'}</span>
                {isAdmin && m.id !== user?.id && (
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleRemoveMember(m.id)}><Trash2 size={14} /></button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      {activeTab === 'activity' && (
        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activity.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Activity size={40} /></div><h3>No activity yet</h3></div>
          ) : activity.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div className="avatar avatar-sm">{log.user?.name?.[0] || '?'}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user?.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}> {log.details}</span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{format(parseISO(log.createdAt), 'MMM d, HH:mm')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskModal
            open={showTaskModal}
            onClose={() => { setShowTaskModal(false); setEditTask(undefined); }}
            onSave={editTask ? handleUpdateTask : handleCreateTask}
            task={editTask}
            projectId={id!}
            members={project.members || []}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
