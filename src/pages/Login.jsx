import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Label } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { LogoWordmark } from '../components/Logo';
import { apiClient } from '../services/apiClient';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('resident');
  const [flatNumber, setFlatNumber] = useState('');
  const [flatsList, setFlatsList] = useState([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (role !== 'resident') {
      setFlatsList([]);
      setFlatNumber('');
      return;
    }

    let isMounted = true;
    setFlatsLoading(true);
    apiClient.get('/api/flat/all')
      .then((res) => {
        if (!isMounted) return;
        const flats = res.flats || [];
        setFlatsList(flats);
        setFlatNumber((prev) => {
          if (!prev && flats.length > 0) {
            return flats[0]._id || flats[0].id;
          }
          return prev;
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setFlatsList([]);
      })
      .finally(() => {
        if (isMounted) setFlatsLoading(false);
      });

    return () => { isMounted = false; };
  }, [role]);

  if (user) {
    const from = location.state?.from || `/${user.role}/dashboard`;
    return <Navigate to={from} replace />;
  }

  function validateEmail(value) {
    if (!value) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Enter a valid email address';
    return '';
  }

  function validatePassword(value) {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  function validateRegister() {
    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (phone && !/^[+]?[\d\s-]{7,15}$/.test(phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }

    if (!role) errors.role = 'Role is required';

    if (role === 'resident' && !flatNumber) {
      errors.flatNumber = 'Please select a flat';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      
      if (!res.ok) {
        setError(res.error || 'Login failed. Please check credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      
      const userRole = res.user?.role || 'resident';
      navigate(`/${userRole}/dashboard`);
    } catch {
      setLoading(false);
      setError('Server connection failed. Please try again.');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    
    if (!validateRegister()) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/api/user/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        flatId: role === 'resident' ? flatNumber : null,
        phone: phone.trim() || null,
      });

      if (res.status) {
        setError('');
        if (role === 'resident') {
          setMode('login');
          setEmail(email.trim().toLowerCase());
          setPassword('');
          setConfirmPassword('');
          setName('');
          setPhone('');
          setFlatNumber('');
          setRole('resident');
          setValidationErrors({});
          setLoading(false);
          alert('Account created successfully! Please sign in with your credentials.');
        } else {
          // Auto-login for staff/guard so the redirect doesn't fail
          await login(email.trim().toLowerCase(), password);
          setLoading(false);
          alert('Account created successfully! Redirecting to your dashboard...');
          setTimeout(() => {
            navigate(`/${role}/dashboard`);
          }, 800);
        }
      } else {
        setError(res.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch {
      setLoading(false);
      setError('Server connection failed. Please try again.');
    }
  }

  const isLogin = mode === 'login';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Background Decorator Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[36rem] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Left Side: Brand & Feature Showcase */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-white lg:flex border-r border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <LogoWordmark size={32} subText="Clifton Heights Society" />
            </Link>
          </div>

          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles size={13} className="text-cyan-400" />
              Smart Residential Governance
            </div>
            
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white leading-tight">
              {isLogin ? 'Welcome back to your digital portal.' : 'Join your society portal today.'}
            </h2>
            
            <p className="mt-3 text-xs leading-6 text-slate-400">
              {isLogin 
                ? 'Effortless gate entry passes, automated monthly maintenance bills, amenity reservations, and direct communication with administrative management.'
                : 'Get instant access to maintenance bills, visitor passes, complaints, and society announcements.'
              }
            </p>

            <div className="mt-6 space-y-2.5">
              {[
                'Instant QR Guest Pass Verification',
                'Transparent Digital Maintenance Receipts',
                'Live Complaint & Service Ticket Dispatch',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-cyan-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10">
            <p className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <ShieldCheck size={15} className="text-cyan-400" />
              Role-based secure access for Residents, Guards & Admins
            </p>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="relative z-20 flex flex-col justify-center p-8 sm:p-10 bg-slate-900/50">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-400 mb-6 w-fit"
          >
            <ArrowLeft size={14} /> Back to main landing
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Sign in to portal' : 'Create your account'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {isLogin 
                ? 'Enter your credentials to access your dashboard.' 
                : 'Create a new account to access the society portal.'
              }
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="text-xs text-slate-300">
                  Email Address
                </Label>
                <input 
                  id="signin-email" 
                  type="email" 
                  autoFocus 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="e.g. resident@smartsociety.pk" 
                  required 
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <div>
                <Label htmlFor="signin-password" className="text-xs text-slate-300">
                  Password
                </Label>
                <input 
                  id="signin-password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 active:scale-[0.99]" 
                disabled={loading}
              >
                {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name" className="text-xs text-slate-300">
                  Full Name
                </Label>
                <input 
                  id="register-name" 
                  type="text" 
                  autoFocus
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Ahmed Khan" 
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="register-email" className="text-xs text-slate-300">
                  Email Address
                </Label>
                <input 
                  id="register-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="e.g. resident@smartsociety.pk" 
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="register-phone" className="text-xs text-slate-300">
                  Phone Number <span className="text-slate-500">(optional)</span>
                </Label>
                <input 
                  id="register-phone" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="e.g. +923001234567" 
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.phone ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="register-role" className="text-xs text-slate-300">
                  Role
                </Label>
                <select
                  id="register-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.role ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                >
                  <option value="resident">Resident</option>
                  <option value="staff">Staff</option>
                  <option value="guard">Guard</option>
                </select>
                {validationErrors.role && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.role}</p>
                )}
              </div>

              {role === 'resident' && (
                <div>
                  <Label htmlFor="register-flat" className="text-xs text-slate-300">
                    Flat Number
                  </Label>
                  <select
                    id="register-flat"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    disabled={flatsLoading}
                    className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.flatNumber ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                  >
                    <option value="">{flatsLoading ? 'Loading flats...' : 'Select a flat'}</option>
                    {flatsList.map((f) => {
                      const id = f._id || f.id;
                      const label = f.flatNumber || f.number || id;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {validationErrors.flatNumber && (
                    <p className="mt-1 text-xs text-red-400">{validationErrors.flatNumber}</p>
                  )}
                  {!flatsLoading && flatsList.length === 0 && (
                    <p className="mt-1 text-xs text-amber-400">No flats available in the system.</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="register-password" className="text-xs text-slate-300">
                  Password
                </Label>
                <input 
                  id="register-password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Min. 6 characters" 
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="register-confirm" className="text-xs text-slate-300">
                  Confirm Password
                </Label>
                <input 
                  id="register-confirm" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter your password" 
                  className={`mt-1 w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${validationErrors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 active:scale-[0.99]" 
                disabled={loading}
              >
                {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                {loading ? 'Creating Account…' : 'Create Account'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-[11px] text-slate-500">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setValidationErrors({}); setRole('resident'); setFlatNumber(''); }} 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setValidationErrors({}); }} 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
