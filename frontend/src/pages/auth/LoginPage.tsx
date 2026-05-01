import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, CheckCircle, Users, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ParticleBackground from '../../components/ParticleBackground';

const features = [
  { icon: <CheckCircle size={18} />, text: 'Task assignment & tracking', color: 'var(--accent-cyan)' },
  { icon: <Users size={18} />, text: 'Role-based team management', color: 'var(--accent-pink)' },
  { icon: <BarChart3 size={18} />, text: 'Real-time progress dashboards', color: 'var(--accent-orange)' },
];

const floatingCards = [
  { emoji: '✅', title: 'Sprint completed', sub: 'Q2 milestone delivered', color: '#00b894', delay: 0 },
  { emoji: '🔥', title: '12 tasks done today', sub: 'Team velocity +40%', color: '#6c5ce7', delay: 1.5 },
  { emoji: '👥', title: '8 members online', sub: 'Collaboration active', color: '#fd79a8', delay: 3 },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ParticleBackground />
      {/* Animated orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />

      {/* LEFT — branding */}
      <div className="auth-left">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} style={{ maxWidth: 500, width: '100%', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <motion.div className="flex items-center gap-2" style={{ marginBottom: 48 }} whileHover={{ scale: 1.02 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(108,92,231,0.5)' }}
            >
              <Zap size={24} color="white" fill="white" />
            </motion.div>
            <span className="logo-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Qphoria</span>
          </motion.div>

          <h1 style={{ marginBottom: 16, lineHeight: 1.15 }}>
            Manage teams,<br />
            <span className="glow-text">ship faster.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.8 }}>
            The modern task manager built for ambitious teams. Organize, track, and deliver — all in one place.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(10px)' }}
              >
                <div style={{ color: f.color, background: `${f.color}18`, padding: 8, borderRadius: 8, display: 'flex' }}>{f.icon}</div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{f.text}</span>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, marginLeft: 'auto', boxShadow: `0 0 8px ${f.color}` }} />
              </motion.div>
            ))}
          </div>

          {/* Floating activity cards */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
                style={{ background: 'rgba(20,20,40,0.8)', border: `1px solid ${card.color}22`, borderRadius: 14, padding: '12px 16px', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 12, width: 'fit-content' }}
              >
                <span style={{ fontSize: '1.2rem' }}>{card.emoji}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{card.title}</div>
                  <div style={{ fontSize: '0.74rem', color: card.color }}>{card.sub}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, boxShadow: `0 0 10px ${card.color}`, marginLeft: 8 }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT — form */}
      <div className="auth-right" style={{ position: 'relative', zIndex: 1 }}>
        {/* Inner orb */}
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="auth-box">
          <div className="auth-card" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Card top glow line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan), var(--accent-pink))', borderRadius: '24px 24px 0 0' }} />

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="var(--accent-secondary)" />
                </div>
                <h2 style={{ fontSize: '1.5rem' }}>Sign in</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>Welcome back! Enter your credentials to continue.</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
              <motion.div className="form-group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </motion.div>

              <motion.div className="form-group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                type="submit" className="btn btn-primary btn-full btn-lg"
                disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ marginTop: 8, position: 'relative', overflow: 'hidden' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</>
                  : <><span>Sign In</span><ArrowRight size={16} /></>}
                {!loading && (
                  <motion.div
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)', backgroundSize: '200% 100%' }}
                    animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
              </motion.button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>Sign up free →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
