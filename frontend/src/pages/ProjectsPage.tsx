import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderKanban, Users, CheckSquare, Trash2, Edit3, X, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { Project } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const COLORS = ['#6C5CE7','#00CEC9','#FD79A8','#FDCB6E','#00B894','#E17055','#74B9FF','#A29BFE'];

function ProjectModal({ open, onClose, onSave, project }: { open: boolean; onClose: () => void; onSave: (data: any) => Promise<void>; project?: Project }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) setForm({ name: project.name, description: project.description, color: project.color, priority: project.priority, dueDate: project.dueDate || '' });
    else setForm({ name: '', description: '', color: COLORS[0], priority: 'medium', dueDate: '' });
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); onClose(); } catch {}
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{project ? 'Edit Project' : 'New Project'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <div key={c} onClick={() => setForm((p) => ({ ...p, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', boxShadow: form.color === c ? `0 0 12px ${c}` : 'none', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (project ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch { toast.error('Failed to load projects'); }
    setLoading(false);
  };

  const handleCreate = async (data: any) => {
    try {
      await api.post('/projects', data);
      toast.success('Project created!');
      fetchProjects();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to create project'); throw err; }
  };

  const handleEdit = async (data: any) => {
    if (!editProject) return;
    try {
      await api.put(`/projects/${editProject.id}`, data);
      toast.success('Project updated!');
      fetchProjects();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update'); throw err; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <motion.button className="btn btn-primary" onClick={() => { setEditProject(undefined); setShowModal(true); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Plus size={18} /> New Project
          </motion.button>
        )}
      </div>

      <div className="search-bar" style={{ marginBottom: 24, maxWidth: 400 }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderKanban size={48} /></div>
          <h3>No projects found</h3>
          <p>{search ? 'Try a different search' : user?.role === 'admin' ? 'Create your first project to get started' : 'Ask an admin to add you to a project'}</p>
          {!search && user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Project</button>}
        </div>
      ) : (
        <motion.div className="grid grid-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AnimatePresence>
            {filtered.map((p, i) => {
              const progress = p.taskCount ? Math.round(((p.completedTasks || 0) / p.taskCount) * 100) : 0;
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                  className="card" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                  {/* Color accent top */}
                  <div style={{ height: 4, background: p.color, position: 'absolute', top: 0, left: 0, right: 0 }} />

                  <div className="card-body" style={{ paddingTop: 28 }} onClick={() => navigate(`/projects/${p.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FolderKanban size={18} style={{ color: p.color }} />
                        </div>
                        <div>
                          <h5 style={{ margin: 0 }}>{p.name}</h5>
                          <span className={`badge badge-${p.priority === 'urgent' ? 'red' : p.priority === 'high' ? 'orange' : p.priority === 'medium' ? 'cyan' : 'green'}`} style={{ fontSize: '0.65rem', marginTop: 2 }}>{p.priority}</span>
                        </div>
                      </div>
                      {user?.role === 'admin' && (
                        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditProject(p); setShowModal(true); }}><Edit3 size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>

                    {p.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={13} />{p.completedTasks}/{p.taskCount} tasks</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} />{p.memberCount} members</span>
                      {p.dueDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{format(parseISO(p.dueDate), 'MMM d')}</span>}
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: p.color }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progress}% complete</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <ProjectModal open={showModal} onClose={() => { setShowModal(false); setEditProject(undefined); }} onSave={editProject ? handleEdit : handleCreate} project={editProject} />
        )}
      </AnimatePresence>
    </div>
  );
}
