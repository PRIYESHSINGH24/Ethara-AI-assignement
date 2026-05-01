import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, FolderKanban, Users, Activity, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { DashboardStats, Task, Project } from '../types';
import { format, isPast, parseISO } from 'date-fns';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PIE_COLORS = ['#5a5a80', '#00cec9', '#fdcb6e', '#00b894'];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--accent-green)', medium: 'var(--accent-cyan)', high: 'var(--accent-orange)', urgent: 'var(--accent-red)',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes, projRes] = await Promise.all([
          api.get('/tasks/stats/dashboard'),
          api.get('/tasks?limit=5'),
          api.get('/projects'),
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data.slice(0, 6));
        setProjects(projRes.data.data.slice(0, 4));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const pieData = stats ? [
    { name: 'Todo', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Review', value: stats.review },
    { name: 'Done', value: stats.done },
  ] : [];

  const barData = projects.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    Total: p.taskCount || 0,
    Done: p.completedTasks || 0,
  }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: <CheckSquare size={20} />, color: 'var(--accent-primary)', bg: 'rgba(108,92,231,0.12)' },
    { label: 'My Tasks', value: stats?.myTasks ?? 0, icon: <Users size={20} />, color: 'var(--accent-cyan)', bg: 'rgba(0,206,201,0.12)' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: <AlertTriangle size={20} />, color: 'var(--accent-red)', bg: 'rgba(225,112,85,0.12)' },
    { label: 'Due This Week', value: stats?.dueThisWeek ?? 0, icon: <Clock size={20} />, color: 'var(--accent-orange)', bg: 'rgba(253,203,110,0.12)' },
    { label: 'Completed', value: stats?.done ?? 0, icon: <TrendingUp size={20} />, color: 'var(--accent-green)', bg: 'rgba(0,184,148,0.12)' },
    { label: 'Completion Rate', value: `${stats?.completionRate ?? 0}%`, icon: <Activity size={20} />, color: 'var(--accent-pink)', bg: 'rgba(253,121,168,0.12)' },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="glow-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p>Here's what's happening with your projects today.</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-3" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <motion.div key={i} variants={item} className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            </div>
            {typeof s.value === 'number' && stats && s.label === 'Completed' && (
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <div className="progress-fill" style={{ width: `${stats.completionRate}%` }} />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Charts + Recent Tasks */}
      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        {/* Task Distribution Pie */}
        <motion.div className="card card-body" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <h4 style={{ marginBottom: 20 }}>Task Distribution</h4>
          {stats && (stats.total > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No tasks yet</h3><p>Create tasks to see analytics</p></div>
          )}
        </motion.div>

        {/* Project Progress Bar Chart */}
        <motion.div className="card card-body" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <h4 style={{ marginBottom: 20 }}>Project Progress</h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={16}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="Total" fill="rgba(108,92,231,0.3)" radius={[4,4,0,0]} />
                <Bar dataKey="Done" fill="var(--accent-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📁</div><h3>No projects yet</h3></div>
          )}
        </motion.div>
      </div>

      {/* Recent Tasks + Projects */}
      <div className="grid grid-2">
        {/* Recent Tasks */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="section-header" style={{ padding: '20px 24px 0' }}>
            <h4>Recent Tasks</h4>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">✅</div><h3>No tasks yet</h3></div>
            ) : (
              recentTasks.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                  <div className="task-row">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project?.name}</div>
                    </div>
                    {task.dueDate && (
                      <div style={{ fontSize: '0.75rem', color: task.isOverdue ? 'var(--accent-red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Calendar size={12} />
                        {format(parseISO(task.dueDate), 'MMM d')}
                      </div>
                    )}
                    <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'cyan' : task.status === 'review' ? 'orange' : 'purple'}`} style={{ fontSize: '0.68rem' }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="section-header" style={{ padding: '20px 24px 0' }}>
            <h4>Active Projects</h4>
            <Link to="/projects" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projects.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📁</div><h3>No projects yet</h3></div>
            ) : (
              projects.map((p) => {
                const progress = p.taskCount ? Math.round(((p.completedTasks || 0) / p.taskCount) * 100) : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.completedTasks}/{p.taskCount} tasks</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%`, background: p.color }} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
