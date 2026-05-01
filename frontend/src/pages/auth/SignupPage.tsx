import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
      toast.success('Account created! Welcome to Qphoria 🎉');
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
      <div className="auth-left">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 480, width: '100%' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 40 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Qphoria</span>
          </div>

          <h1 style={{ marginBottom: 16 }}>Start building<br /><span className="glow-text">great things.</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.7 }}>
            Join thousands of teams using Qphoria to collaborate, track tasks, and ship products faster than ever.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Projects Created', value: '12K+' },
              { label: 'Tasks Completed', value: '180K+' },
              { label: 'Active Teams', value: '3.4K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 20px', backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="auth-right">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="auth-box">
          <div className="auth-card">
            <h2 style={{ marginBottom: 8 }}>Create account</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>Free forever. No credit card needed.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="Alex Johnson" value={form.name} onChange={set('name')} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ value: 'member', label: 'Member', icon: <User size={16} />, desc: 'Join projects' },
                    { value: 'admin', label: 'Admin', icon: <Shield size={16} />, desc: 'Manage everything' }].map((r) => (
                    <div key={r.value} onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${form.role === r.value ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: form.role === r.value ? 'rgba(108,92,231,0.12)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: form.role === r.value ? 'var(--accent-secondary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>
                        {r.icon}{r.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating account...</> : 'Create Account →'}
              </motion.button>
            </form>

            <div className="divider" />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Already have an account?{' '}<Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
