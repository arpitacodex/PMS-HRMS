"use client";

import { useState } from 'react';
import { Eye, EyeOff, Mail, User, Lock, X, Phone, MapPin, Briefcase, Shield, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const STEPS = [
  { id: 1, label: 'Account',    icon: User },
  { id: 2, label: 'Personal',   icon: Phone },
  { id: 3, label: 'Address',    icon: MapPin },
];

// ── tiny layout helpers ────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function IconWrap({ children }) {
  return (
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {children}
    </div>
  );
}

export default function SignupPage() {
  const [isOpen, setIsOpen]             = useState(true);
  const [step, setStep]                 = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [errors, setErrors]             = useState({});

  const [formData, setFormData] = useState({
    // ACCOUNT
    email: '', second_email: '', password_hash: '', status: 'active',
    // PERSONAL
    first_name: '', last_name: '', phone: '', second_phone: '',
    date_of_birth: '', gender: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    // ADDRESS
    present_address: '', permanent_address: '',
    city: '', state: '', country: '', postal_code: '',

    // department_id: '', designation_id: '', reporting_to: '',
    // joining_date: '', confirmation_date: '',
    // employment_type: '', work_location: '', company_email: '', role_id: '',
 
    // pan_number: '', aadhar_number: '', bank_account_number: '',
    // bank_name: '', bank_ifsc_code: '', uan_number: '',
    // pf_account_number: '', esi_number: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
  };

  const ic = (field) =>
    `w-full px-3 py-2 bg-gray-50 border rounded-lg outline-none text-gray-900 text-sm transition-all ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  const iic = (field) =>
    `w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-lg outline-none text-gray-900 text-sm transition-all ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  const Err = ({ field }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-0.5">{errors[field]}</p> : null;

  const onFocus = (e) => (e.target.style.borderColor = '#0ab39c');
  const onBlur  = (e) => (e.target.style.borderColor = errors[e.target.name] ? '#f87171' : '#e5e7eb');

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!formData.email.trim()) e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
      if (!formData.password_hash.trim()) e.password_hash = 'Required';
      else if (formData.password_hash.length < 6) e.password_hash = 'Min 6 characters';
    }
    if (s === 2) {
      if (!formData.first_name.trim()) e.first_name = 'Required';
      if (!formData.last_name.trim())  e.last_name  = 'Required';
      if (!formData.phone.trim())      e.phone      = 'Required';
      else if (!/^[0-9]{10}$/.test(formData.phone)) e.phone = '10 digits';
      if (!formData.gender)            e.gender     = 'Required';
    }
    if (s === 4) {
      if (!formData.joining_date) e.joining_date = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 5)); };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Please login as Admin or HR first.'); setLoading(false); return; }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) { setError(data?.message || 'Registration failed'); return; }
      setSuccess('User registered successfully! Redirecting...');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch { setError('Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-3">
          <Field label="Email" required>
            <div className="relative">
              <IconWrap><Mail size={14} style={{ color:'#0ab39c' }} /></IconWrap>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={iic('email')} placeholder="primary@email.com" />
            </div><Err field="email" />
          </Field>
          <Field label="Secondary Email">
            <div className="relative">
              <IconWrap><Mail size={14} style={{ color:'#0ab39c' }} /></IconWrap>
              <input type="email" name="second_email" value={formData.second_email} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={iic('second_email')} placeholder="Optional" />
            </div>
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <IconWrap><Lock size={14} style={{ color:'#0ab39c' }} /></IconWrap>
              <input type={showPassword ? 'text' : 'password'} name="password_hash"
                value={formData.password_hash} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={iic('password_hash')} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-500">
                {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div><Err field="password_hash" />
          </Field>
          <Field label="Status">
            <select name="status" value={formData.status} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur} className={ic('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      );

      case 2: return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <div className="relative">
                <IconWrap><User size={14} style={{ color:'#0ab39c' }} /></IconWrap>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                  onFocus={onFocus} onBlur={onBlur} className={iic('first_name')} placeholder="First name" />
              </div><Err field="first_name" />
            </Field>
            <Field label="Last Name" required>
              <div className="relative">
                <IconWrap><User size={14} style={{ color:'#0ab39c' }} /></IconWrap>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                  onFocus={onFocus} onBlur={onBlur} className={iic('last_name')} placeholder="Last name" />
              </div><Err field="last_name" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" required>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('phone')} placeholder="10-digit number" />
              <Err field="phone" />
            </Field>
            <Field label="Alt Phone">
              <input type="tel" name="second_phone" value={formData.second_phone} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('second_phone')} placeholder="Optional" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth">
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('date_of_birth')} />
            </Field>
            <Field label="Gender" required>
              <select name="gender" value={formData.gender} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select><Err field="gender" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency Contact Name">
              <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name}
                onChange={handleChange} onFocus={onFocus} onBlur={onBlur}
                className={ic('emergency_contact_name')} placeholder="Contact name" />
            </Field>
            <Field label="Emergency Contact Phone">
              <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone}
                onChange={handleChange} onFocus={onFocus} onBlur={onBlur}
                className={ic('emergency_contact_phone')} placeholder="Contact phone" />
            </Field>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-3">
          <Field label="Present Address">
            <textarea name="present_address" value={formData.present_address} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur} className={ic('present_address')} rows={2}
              placeholder="Current residential address" />
          </Field>
          <Field label="Permanent Address">
            <textarea name="permanent_address" value={formData.permanent_address} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur} className={ic('permanent_address')} rows={2}
              placeholder="Permanent address" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('city')} placeholder="City" />
            </Field>
            <Field label="State">
              <input type="text" name="state" value={formData.state} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('state')} placeholder="State" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country">
              <input type="text" name="country" value={formData.country} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('country')} placeholder="Country" />
            </Field>
            <Field label="Postal Code">
              <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange}
                onFocus={onFocus} onBlur={onBlur} className={ic('postal_code')} placeholder="PIN / ZIP" />
            </Field>
          </div>
        </div>
      );
     default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

          <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex animate-fadeIn" style={{ maxHeight:'95vh' }}>
            <button onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 z-20">
              <X size={20} className="text-gray-500" />
            </button>

            {/* ── Left Panel ── */}
            <div className="hidden md:flex md:w-[38%] p-10 flex-col justify-between relative overflow-hidden"
              style={{ background:'linear-gradient(135deg, #0ab39c 0%, #405189 100%)' }}>
              <div className="absolute top-8 left-8 grid grid-cols-6 gap-2">
                {[...Array(24)].map((_,i)=><div key={i} className="w-1 h-1 bg-white/30 rounded-full"/>)}
              </div>
              <div className="absolute bottom-10 right-8 grid grid-cols-5 gap-2">
                {[...Array(20)].map((_,i)=><div key={i} className="w-1 h-1 bg-white/30 rounded-full"/>)}
              </div>
              <div className="absolute top-5 right-5 w-20 h-20 border-4 border-white/20 rounded-full"/>
              <div className="absolute bottom-5 right-5 flex">
                <div className="w-24 h-24 border-8 border-white/20 rounded-full"/>
                <div className="w-16 h-16 border-8 border-white/10 rounded-full -ml-10"/>
              </div>

              <div className="relative z-10 text-white mt-6">
                <h1 className="text-2xl font-bold leading-snug mb-1">REGISTER<br/>TO YOUR ACCOUNT</h1>
                <p className="text-white/75 text-xs">Complete all 3 steps to register.</p>
              </div>

              {/* Step list */}
              <div className="relative z-10 space-y-2.5 mb-6">
                {STEPS.map(s => {
                  const done    = step > s.id;
                  const current = step === s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        done    ? 'bg-white text-teal-600' :
                        current ? 'bg-white/30 border-2 border-white text-white' :
                                  'bg-white/10 text-white/40'
                      }`}>
                        {done ? <Check size={12}/> : s.id}
                      </div>
                      <p className={`text-sm font-medium transition-all ${
                        current ? 'text-white' : done ? 'text-white/80' : 'text-white/40'
                      }`}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="w-full md:w-[62%] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-7 pt-6 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{STEPS[step-1].label} Details</h2>
                    <p className="text-xs text-gray-400">Step {step} of {STEPS.length}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {STEPS.map(s => (
                      <div key={s.id} className="h-1.5 w-7 rounded-full transition-all"
                        style={{ background: s.id <= step ? '#0ab39c' : '#e5e7eb' }}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form body */}
              <div className="flex-1 overflow-y-auto px-7 py-5">
                {error && (
                  <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-3 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex gap-2">
                    <span>✅</span><span>{success}</span>
                  </div>
                )}
                {renderStep()}
              </div>

              {/* Footer nav */}
              <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <button onClick={prevStep} disabled={step === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={14}/> Previous
                </button>

                <span className="text-xs text-gray-400 font-medium">{step} / {STEPS.length}</span>

                {step < STEPS.length ? (
                  <button onClick={nextStep}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
                    style={{ background:'linear-gradient(135deg, #0ab39c 0%, #405189 100%)' }}>
                    Next <ChevronRight size={14}/>
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background:'linear-gradient(135deg, #0ab39c 0%, #405189 100%)' }}>
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg> Registering...
                      </>
                    ) : <><Check size={14}/> Register</>}
                  </button>
                )}
              </div>

              <p className="text-center text-xs text-gray-500 pb-3">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold hover:underline" style={{ color:'#0ab39c' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .animate-fadeIn { animation:fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}