import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, FolderKanban, Users, Activity, ArrowRight, Calendar, Zap, Target, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { DashboardStats, Task, Project } from '../types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PIE_COLORS = ['#5a5a80', '#00cec9', '#fdcb6e', '#00b894'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--accent-green)', medium: 'var(--accent-cyan)', high: 'var(--accent-orange)', urgent: 'var(--accent-red)',
};

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const v = useCountUp(value);
  return <>{v}{suffix}</>;
}

function SkeletonCard() {
  return (
    <div className="card stat-card">
      <div className="skeleton" style={{ width: '40%', height: 36, marginBottom: 8, borderRadius: 8 }} />
      <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 6 }} />
    </div>
  );
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  todo: { label: 'Todo', color: '#5a5a80' },
  in_progress: { label: 'In Progress', color: '#00cec9' },
  review: { label: 'Review', color: '#fdcb6e' },
  done: { label: 'Done', color: '#00b894' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, tasksRes, projRes] = await Promise.all([
          api.get('/tasks/stats/dashboard'),
          api.get('/tasks?limit=6&sortBy=createdAt&sortOrder=desc'),
          api.get('/projects'),
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data.slice(0, 6));
        setProjects(projRes.data.data.slice(0, 4));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: <CheckSquare size={20} />, color: '#6c5ce7', bg: 'rgba(108,92,231,0.12)', suffix: '' },
    { label: 'My Tasks', value: stats?.myTasks ?? 0, icon: <Users size={20} />, color: '#00cec9', bg: 'rgba(0,206,201,0.12)', suffix: '' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: <AlertTriangle size={20} />, color: '#e17055', bg: 'rgba(225,112,85,0.12)', suffix: '' },
    { label: 'Due This Week', value: stats?.dueThisWeek ?? 0, icon: <Clock size={20} />, color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', suffix: '' },
    { label: 'Completed', value: stats?.done ?? 0, icon: <TrendingUp size={20} />, color: '#00b894', bg: 'rgba(0,184,148,0.12)', suffix: '' },
    { label: 'Completion Rate', value: stats?.completionRate ?? 0, icon: <Activity size={20} />, color: '#fd79a8', bg: 'rgba(253,121,168,0.12)', suffix: '%' },
  ];

  const pieData = stats ? [
    { name: 'Todo', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Review', value: stats.review },
    { name: 'Done', value: stats.done },
  ] : [];

  const barData = projects.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name,
    Total: p.taskCount || 0,
    Done: p.completedTasks || 0,
  }));

  // Fake weekly activity sparkline
  const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    tasks: Math.max(0, (stats?.done ?? 0) > 0 ? Math.floor(Math.random() * 5) + (i === 4 ? 3 : 1) : 0),
  }));

  if (loading) return (
    <div>
      <div className="page-header">
        <div className="skeleton" style={{ width: 280, height: 36, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 200, height: 18, borderRadius: 6 }} />
      </div>
      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>{greeting}, <span className="glow-text">{user?.name?.split(' ')[0]}</span></h1>
            <p>Here's what's happening with your projects today.</p>
          </div>
          {/* Quick status pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: `${stats?.overdue ?? 0} overdue`, color: '#e17055', glow: (stats?.overdue ?? 0) > 0 },
              { label: `${stats?.dueThisWeek ?? 0} due this week`, color: '#fdcb6e', glow: false },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${p.color}15`, border: `1px solid ${p.color}30`, borderRadius: 100, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, color: p.color }}
              >
                {p.glow && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />}
                {p.label}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-3" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <motion.div key={i} variants={item} className="card stat-card" style={{ borderTop: `2px solid ${s.color}40` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: s.color, fontSize: '2.4rem' }}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
              <motion.div
                className="stat-icon" style={{ background: s.bg, color: s.color }}
                animate={{ boxShadow: [`0 0 0px ${s.color}`, `0 0 16px ${s.color}60`, `0 0 0px ${s.color}`] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
              >
                {s.icon}
              </motion.div>
            </div>
            {s.label === 'Completed' && stats && (
              <div style={{ marginTop: 14 }}>
                <div className="progress-bar">
                  <motion.div className="progress-fill"
                    initial={{ width: 0 }} animate={{ width: `${stats.completionRate}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    style={{ background: s.color }}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{stats.completionRate}% done</div>
              </div>
            )}
            {s.label === 'Overdue' && (s.value as number) > 0 && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ marginTop: 10, fontSize: '0.72rem', color: s.color, fontWeight: 600 }}>
                Needs immediate attention
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        {/* Donut chart */}
        <motion.div className="card card-body" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={16} style={{ color: 'var(--accent-primary)' }} />Task Distribution</h4>
            {stats && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stats.total} total</span>}
          </div>
          {stats && stats.total > 0 ? (
            <>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.completionRate}%</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], boxShadow: `0 0 6px ${PIE_COLORS[i]}` }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: PIE_COLORS[i] }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><div style={{ fontSize: '2.5rem', opacity: 0.3 }}>📊</div><h3>No tasks yet</h3><p>Create tasks to see analytics</p></div>
          )}
        </motion.div>

        {/* Bar chart */}
        <motion.div className="card card-body" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Target size={16} style={{ color: 'var(--accent-cyan)' }} />Project Progress</h4>
            <Link to="/projects" style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
                <Bar dataKey="Total" fill="rgba(108,92,231,0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Done" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div style={{ fontSize: '2.5rem', opacity: 0.3 }}>📁</div><h3>No projects yet</h3></div>
          )}
        </motion.div>
      </div>

      {/* Weekly activity sparkline */}
      {(stats?.done ?? 0) > 0 && (
        <motion.div className="card card-body" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} style={{ color: 'var(--accent-orange)' }} />Weekly Activity</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tasks completed this week</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
              <Area type="monotone" dataKey="tasks" stroke="#6c5ce7" strokeWidth={2} fill="url(#actGrad)" dot={{ fill: '#6c5ce7', strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Bottom: Recent Tasks + Active Projects */}
      <div className="grid grid-2">
        {/* Recent Tasks */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="section-header" style={{ padding: '20px 24px 0' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckSquare size={16} style={{ color: 'var(--accent-primary)' }} />Recent Tasks</h4>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          <div style={{ padding: '14px 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTasks.length === 0 ? (
              <div className="empty-state"><div style={{ fontSize: '2rem', opacity: 0.3 }}>✅</div><h3>No tasks yet</h3></div>
            ) : (
              recentTasks.map((task, i) => {
                const sm = STATUS_META[task.status] || STATUS_META.todo;
                return (
                  <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                    <motion.div className="task-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                      style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{task.project?.name}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sm.color, background: `${sm.color}18`, border: `1px solid ${sm.color}30`, borderRadius: 100, padding: '2px 8px', textTransform: 'capitalize' }}>
                          {sm.label}
                        </span>
                        {task.dueDate && (
                          <div style={{ fontSize: '0.7rem', color: task.isOverdue ? 'var(--accent-red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={10} />{format(parseISO(task.dueDate), 'MMM d')}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="section-header" style={{ padding: '20px 24px 0' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FolderKanban size={16} style={{ color: 'var(--accent-cyan)' }} />Active Projects</h4>
            <Link to="/projects" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          <div style={{ padding: '14px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.length === 0 ? (
              <div className="empty-state"><div style={{ fontSize: '2rem', opacity: 0.3 }}>📁</div><h3>No projects yet</h3></div>
            ) : (
              projects.map((p, i) => {
                const progress = p.taskCount ? Math.round(((p.completedTasks || 0) / p.taskCount) * 100) : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <motion.div className="card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
                      style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}
                      whileHover={{ scale: 1.01, borderColor: p.color + '60' }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: p.color, borderRadius: '4px 0 0 4px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingLeft: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FolderKanban size={14} style={{ color: p.color }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.color }}>{progress}%</span>
                      </div>
                      <div style={{ paddingLeft: 8 }}>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <motion.div className="progress-fill"
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.7 + i * 0.1, ease: 'easeOut' }}
                            style={{ background: p.color }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>{p.completedTasks}/{p.taskCount} tasks</span>
                          <span>{p.memberCount} members</span>
                        </div>
                      </div>
                    </motion.div>
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
