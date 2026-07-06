
"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import Image from "next/image";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function LoginPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!formData.email || !formData.password) {
    setError("Email and password are required.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login failed.");
      return;
    }

 if (data.token && data.user) {
  // Clear old data first
  localStorage.clear();

  // Save fresh login data
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", String(data.user.id));
  localStorage.setItem("user", JSON.stringify(data.user));

  const role =
    data.user.roles?.[0]?.name ||
    data.user.role ||
    "employee";

  localStorage.setItem("role", role.toLowerCase());

  console.log("Logged User:", data.user);
  console.log("Token Payload:", JSON.parse(atob(data.token.split(".")[1])));

  // Redirect LAST
  window.location.href = "/dashboard";
} else {
  setError("Invalid login response.");
}

  } catch {
    setError("Network error. Try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --orange:        #F47C20;
          --orange-dark:   #D9650E;
          --orange-light:  #FF9A4D;
          --orange-glow:   rgba(244,124,32,0.18);
          --orange-soft:   rgba(244,124,32,0.08);
          --teal:          #0ab39c;
          --teal-dark:     #089b86;
          --navy:          #0f1623;
          --white:         #ffffff;
          --text:          #1a2235;
          --text-muted:    #6b7a99;
          --text-light:    #9aa3b8;
          --border:        #e2e8f0;
          --bg:            #f0f4fa;
          --error:         #e05252;
          --shadow-card:   0 24px 64px rgba(15,22,35,0.18), 0 4px 16px rgba(15,22,35,0.10);
          --shadow-btn:    0 4px 20px rgba(244,124,32,0.40);
          --shadow-input:  0 0 0 3px rgba(244,124,32,0.12);
        }

        .login-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: rgba(244,124,32,0.07);
          top: -150px; right: -100px;
          animation: blobDrift1 14s ease-in-out infinite;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: rgba(10,179,156,0.07);
          bottom: -100px; left: -80px;
          animation: blobDrift2 18s ease-in-out infinite;
        }
        .blob-3 {
          width: 280px; height: 280px;
          background: rgba(244,124,32,0.05);
          bottom: 20%; right: 20%;
          animation: blobDrift3 22s ease-in-out infinite;
        }

        .backdrop {
          position: fixed; inset: 0; z-index: 5;
          background: rgba(10,16,28,0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .card-wrap {
          position: relative; z-index: 10;
          width: 100%; max-width: 920px;
          padding: 20px;
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .card {
          display: flex;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
          background: var(--white);
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 14px; right: 14px;
          z-index: 20;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.15);
          color: var(--white);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          backdrop-filter: blur(4px);
        }
        .close-btn:hover { background: rgba(255,255,255,0.28); transform: scale(1.08); }

        /* LEFT PANEL */
        .left-panel {
          display: none;
          width: 42%;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 44px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #1a2e20 0%, #0f2018 35%, #0a1a2e 70%, #0f1623 100%);
        }
        @media (min-width: 768px) { .left-panel { display: flex; } }

        .left-panel::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(10,179,156,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 85%, rgba(244,124,32,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 60% 50%, rgba(244,124,32,0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        .deco-ring {
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          border: 1px solid rgba(244,124,32,0.15);
          pointer-events: none;
        }
        .deco-ring::after {
          content: '';
          position: absolute; inset: 20px;
          border-radius: 50%;
          border: 1px dashed rgba(10,179,156,0.2);
          animation: spin 25s linear infinite;
        }

        .deco-ring2 {
          position: absolute;
          bottom: -80px; left: -80px;
          width: 260px; height: 260px;
          border-radius: 50%;
          border: 1px solid rgba(10,179,156,0.1);
          pointer-events: none;
        }

        .left-line {
          width: 40px; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--orange), var(--teal));
          margin-bottom: 18px;
        }

        .left-content { position: relative; z-index: 1; }

        .left-logo-wrap {
          margin-bottom: 32px;
          display: flex; align-items: center;
        }
        .left-logo-bg {
          width: 80px; height: 80px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(244,124,32,0.1);
          overflow: hidden;
        }

        .left-title {
          font-size: 2rem; font-weight: 700;
          color: var(--white);
          line-height: 1.2; margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .left-title span { color: #FF9A4D; }

        .left-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.04em; line-height: 1.5;
        }

        .left-features { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .feat {
          display: flex; align-items: center; gap: 12px;
          opacity: 0;
          animation: featIn 0.45s ease forwards;
        }
        .feat:nth-child(1) { animation-delay: 0.4s; }
        .feat:nth-child(2) { animation-delay: 0.55s; }
        .feat:nth-child(3) { animation-delay: 0.7s; }

        .feat-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .feat-icon.orange { background: rgba(244,124,32,0.15); border: 1px solid rgba(244,124,32,0.25); }
        .feat-icon.teal   { background: rgba(10,179,156,0.12); border: 1px solid rgba(10,179,156,0.22); }

        .feat-text { font-size: 0.78rem; color: rgba(255,255,255,0.55); line-height: 1.4; }
        .feat-text strong { display: block; color: rgba(255,255,255,0.85); font-weight: 600; margin-bottom: 1px; }

        .left-footer {
          position: relative; z-index: 1;
          font-size: 0.68rem; color: rgba(255,255,255,0.2);
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        /* RIGHT PANEL */
        .right-panel {
          flex: 1;
          display: flex; flex-direction: column;
          padding: 48px 44px 40px;
          background: var(--white);
          position: relative;
        }

        .right-top {
          text-align: center;
          margin-bottom: 28px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--border);
        }
        .right-logo-wrap {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .right-greeting {
          font-size: 1.3rem; font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .right-sub { font-size: 0.8rem; color: var(--text-muted); }

        .step-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--orange-soft);
          border: 1px solid rgba(244,124,32,0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 0.68rem; font-weight: 600;
          color: var(--orange-dark);
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 18px;
        }
        .step-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--orange);
          animation: pulse 2s ease-in-out infinite;
        }

        .error-box {
          background: #fff5f5;
          border: 1px solid rgba(224,82,82,0.25);
          border-left: 3px solid var(--error);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8rem; color: var(--error);
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }

        .field { margin-bottom: 18px; }
        .field-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .field-label {
          font-size: 0.75rem; font-weight: 600;
          color: var(--text);
          letter-spacing: 0.03em; text-transform: uppercase;
        }
        .field-forgot {
          font-size: 0.75rem; color: var(--teal);
          text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .field-forgot:hover { color: var(--orange); }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          display: flex; pointer-events: none; color: var(--text-light);
        }
        .field-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid var(--border);
          border-radius: 11px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem; color: var(--text);
          background: #f8faff; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: var(--text-light); }
        .field-input:focus {
          border-color: var(--orange);
          background: #fff;
          box-shadow: var(--shadow-input);
        }
        .field-input.pr { padding-right: 44px; }

        .input-icon-right {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-light); padding: 2px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .input-icon-right:hover { color: var(--orange); }

        .pw-hint { display: flex; gap: 4px; margin-top: 6px; }
        .pw-bar {
          height: 3px; flex: 1; border-radius: 2px;
          background: var(--border);
          transition: background 0.3s;
        }

        .remember-row {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: 22px;
        }
        .remember-check {
          width: 18px; height: 18px;
          border: 1.5px solid var(--border);
          border-radius: 5px; cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background: #f8faff; position: relative;
          transition: border-color 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .remember-check:checked { background: var(--orange); border-color: var(--orange); }
        .remember-check:checked::after {
          content: '';
          position: absolute; top: 2px; left: 5px;
          width: 5px; height: 8px;
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(45deg);
        }
        .remember-label { font-size: 0.82rem; color: var(--text-muted); cursor: pointer; }

        .submit-btn {
          width: 100%; padding: 13.5px;
          border: none; border-radius: 11px;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem; font-weight: 700;
          letter-spacing: 0.04em; color: #fff;
          position: relative; overflow: hidden;
          background: linear-gradient(110deg, var(--orange-dark) 0%, var(--orange) 50%, var(--orange-light) 100%);
          box-shadow: var(--shadow-btn);
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(244,124,32,0.50);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-shimmer {
          position: absolute;
          top: 0; left: -100%; width: 55%; height: 100%;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
          animation: shimmer 2.8s ease-in-out infinite;
        }
        .btn-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-arrow { transition: transform 0.2s; }
        .submit-btn:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }

        .dot-loader { display: inline-flex; gap: 4px; align-items: center; }
        .dot-loader span {
          width: 5px; height: 5px; border-radius: 50%; background: #fff;
          animation: dotPop 1s ease-in-out infinite;
        }
        .dot-loader span:nth-child(2) { animation-delay: 0.15s; }
        .dot-loader span:nth-child(3) { animation-delay: 0.3s; }

        .divider {
          display: flex; align-items: center; gap: 10px;
          margin: 20px 0 0;
        }
        .div-line { flex: 1; height: 1px; background: var(--border); }
        .div-text { font-size: 0.7rem; color: var(--text-light); letter-spacing: 0.08em; white-space: nowrap; }

        .security-row {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .security-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.68rem; color: var(--text-light);
          letter-spacing: 0.04em;
        }
        .security-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--teal);
          animation: pulse 2s ease-in-out infinite;
        }
        .sep { color: var(--border); font-size: 10px; }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes featIn {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes blobDrift1 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(-30px,30px); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(25px,-25px); }
        }
        @keyframes blobDrift3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px,20px) scale(1.1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { left: -100%; }
          60%,100% { left: 130%; }
        }
        @keyframes dotPop {
          0%,80%,100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <div className="login-root">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />

        {isLoginOpen && (
          <>
            <div className="backdrop" />

            <div className="card-wrap">
              <div className="card">

                {/* Close */}
                <button className="close-btn" onClick={() => setIsLoginOpen(false)}>
                  <X size={15} />
                </button>

                {/* LEFT */}
                <div className="left-panel">
                  <div className="deco-ring" />
                  <div className="deco-ring2" />

                  <div className="left-content">
                    <div className="left-logo-wrap">
                      <div className="left-logo-bg">
                        <Image src="/logo.png" alt="Codex" width={56} height={56} style={{ objectFit: "contain" }} />
                      </div>
                    </div>
                    <div className="left-line" />
                    <div className="left-title">Codex<br /><span>Technolife</span></div>
                    <div className="left-sub">Pvt Ltd &nbsp;·&nbsp; Secure access to your dashboard</div>
                  </div>

                  <div className="left-features">
                    <div className="feat">
                      <div className="feat-icon orange">🔒</div>
                      <div className="feat-text">
                        <strong>Enterprise Security</strong>
                        256-bit encrypted sessions
                      </div>
                    </div>
                    <div className="feat">
                      <div className="feat-icon teal">📊</div>
                      <div className="feat-text">
                        <strong>Real-time Dashboard</strong>
                        Live analytics & reporting
                      </div>
                    </div>
                    <div className="feat">
                      <div className="feat-icon orange">⚡</div>
                      <div className="feat-text">
                        <strong>Fast Access</strong>
                        Instant workspace loading
                      </div>
                    </div>
                  </div>

                  <div className="left-footer">© 2025 Codex Technolife Pvt Ltd</div>
                </div>

                {/* RIGHT */}
                <div className="right-panel">
                  <div className="right-top">
                    <div className="right-logo-wrap">
                      <Image src="/codex-logo.png" alt="Codex" width={160} height={50} style={{ objectFit: "contain" }} />
                    </div>
                    <div className="right-greeting">Welcome back 👋</div>
                    <div className="right-sub">Sign in to continue to your dashboard</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                    <div className="step-badge">
                      <span className="step-badge-dot" />
                      Secure Login Portal
                    </div>
                  </div>

                  {error && (
                    <div className="error-box"><span>⚠</span> {error}</div>
                  )}

                  {/* Email */}
                  <div className="field">
                    <div className="field-top">
                      <label className="field-label">Email Address</label>
                    </div>
                    <div className="input-wrap">
                      <span className="input-icon"><Mail size={15} /></span>
                      <input
                        type="email" name="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="Enter your email"
                        className="field-input" autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="field">
                    <div className="field-top">
                      <label className="field-label">Password</label>
                      <a href="#" className="field-forgot">Forgot password?</a>
                    </div>
                    <div className="input-wrap">
                      <span className="input-icon"><Lock size={15} /></span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password} onChange={handleChange}
                        placeholder="••••••••••"
                        className="field-input pr" autoComplete="current-password"
                      />
                      <button type="button" className="input-icon-right"
                        onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="pw-hint">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="pw-bar" style={{
                          background: formData.password.length > i * 3
                            ? i < 2 ? "#F47C20" : "#0ab39c"
                            : undefined
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Remember */}
                  <div className="remember-row">
                    <input type="checkbox" name="remember" id="remember"
                      checked={formData.remember} onChange={handleChange}
                      className="remember-check" />
                    <label htmlFor="remember" className="remember-label">Keep me signed in</label>
                  </div>

                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={loading} className="submit-btn">
                    <span className="btn-shimmer" />
                    <span className="btn-inner">
                      {loading
                        ? <>Signing in <span className="dot-loader"><span /><span /><span /></span></>
                        : <>Sign In <span className="btn-arrow">→</span></>
                      }
                    </span>
                  </button>

                  <div className="divider">
                    <div className="div-line" />
                    <div className="div-text">PROTECTED BY CODEX SECURITY</div>
                    <div className="div-line" />
                  </div>

                  <div className="security-row">
                    <div className="security-badge"><span className="security-dot" />SSL Encrypted</div>
                    <span className="sep">·</span>
                    <div className="security-badge"><span className="security-dot" />SOC 2 Compliant</div>
                    <span className="sep">·</span>
                    <div className="security-badge"><span className="security-dot" />GDPR Ready</div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}