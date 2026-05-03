import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ParticleBackground from '../../components/ParticleBackground';
import Logo from '../../components/Logo';

const stats = [
  { label: 'Projects Created', value: '12K+', color: 'var(--accent-primary)' },
  { label: 'Tasks Completed', value: '180K+', color: 'var(--accent-cyan)' },
  { label: 'Active Teams', value: '3.4K+', color: 'var(--accent-pink)' },
  { label: 'Uptime', value: '99.9%', color: 'var(--accent-orange)' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to Qphoria');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="auth-left">
        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          style={{ maxWidth: 480, width: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Logo size={44} textSize="1.5rem" subtitle />
          </motion.div>

          <div>
            <h1 style={{ marginBottom: 8, lineHeight: 1.15, fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}>
              Start building<br />
              <span className="glow-text">great things.</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              Join thousands of teams using Qphoria to collaborate, track tasks, and ship products faster than ever.
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6 }} />
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Sparkle badge */}
          <motion.div
            animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 100, padding: '7px 14px', backdropFilter: 'blur(12px)', alignSelf: 'flex-start' }}
          >
            <Sparkles size={13} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>Free forever — no credit card needed</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="auth-right" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '15%', right: '8%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="auth-box"
        >
          <div className="auth-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-primary), var(--accent-pink))', borderRadius: '24px 24px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Logo size={28} showText={false} />
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Create account</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 18, fontSize: '0.85rem' }}>
              Get started in 30 seconds. Free forever.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Alex Johnson' },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@company.com' },
              ].map((field, i) => (
                <motion.div key={field.key} className="form-group" style={{ margin: 0 }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}>
                  <label className="form-label">{field.label}</label>
                  <input type={field.type} className="form-input" placeholder={field.placeholder}
                    value={(form as any)[field.key]} onChange={set(field.key)} required autoFocus={i === 0} />
                </motion.div>
              ))}

              <motion.div className="form-group" style={{ margin: 0 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters"
                    value={form.password} onChange={set('password')} required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              <motion.div className="form-group" style={{ margin: 0 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
                <label className="form-label">Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'member', label: 'Member', icon: <User size={14} />, desc: 'Join & work on projects' },
                    { value: 'admin', label: 'Admin', icon: <Shield size={14} />, desc: 'Manage everything' },
                  ].map((r) => (
                    <motion.div key={r.value} onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${form.role === r.value ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: form.role === r.value ? 'rgba(108,92,231,0.14)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                    >
                      {form.role === r.value && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gradient-primary)' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: form.role === r.value ? 'var(--accent-secondary)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.82rem' }}>{r.icon}{r.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ marginTop: 4, position: 'relative', overflow: 'hidden' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              >
                {loading ? <><div className="spinner" style={{ width: 17, height: 17 }} />Creating...</> : <><span>Create Account</span><ArrowRight size={15} /></>}
              </motion.button>
            </form>

            <div className="divider" style={{ margin: '16px 0' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>Sign in →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
