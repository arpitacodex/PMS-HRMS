"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, AlertCircle, Loader2 } from "lucide-react";
import { authFetch, API_CLAIMS, API_CLAIM_TYPES } from "./claimUtils";

const EMPTY = {
  claim_type_id: "",
  project_id: "",
  claim_date: "",
  amount: "",
  description: "",
};

export default function ClaimDrawer({ open, onClose, onSuccess, editData = null, projects = [] }) {
  const [form, setForm]           = useState(EMPTY);
  const [claimTypes, setClaimTypes] = useState([]);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [serverErr, setServerErr] = useState("");
  const fileRef                   = useRef();
  const isEdit                    = !!editData;

  // Fetch claim types for dropdown
  useEffect(() => {
    authFetch(`${API_CLAIM_TYPES}/`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setClaimTypes(d.data.filter((c) => c.is_active)); })
      .catch(() => {});
  }, []);

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setForm({
        claim_type_id: editData.claim_type_id ?? "",
        project_id:    editData.project_id    ?? "",
        claim_date:    editData.claim_date?.slice(0, 10) ?? "",
        amount:        editData.amount        ?? "",
        description:   editData.description   ?? "",
      });
      setFile(null);
      setPreview(null);
    } else {
      setForm(EMPTY);
      setFile(null);
      setPreview(null);
    }
    setErrors({});
    setServerErr("");
  }, [editData, open]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.claim_type_id) e.claim_type_id = "Select a claim type";
    if (!form.claim_date)    e.claim_date    = "Date is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerErr("");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (file) fd.append("receipt", file);

    try {
      const url = isEdit
        ? `${API_CLAIMS}/edit/${editData.id}`
        : `${API_CLAIMS}/apply`;
      const method = isEdit ? "PUT" : "POST";

      const res  = await authFetch(url, { method, body: fd });
      const data = await res.json();

      if (data.success) {
        onSuccess(data.data, isEdit ? "edit" : "create");
        onClose();
      } else {
        setServerErr(data.message || "Something went wrong");
      }
    } catch {
      setServerErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedType = claimTypes.find((c) => String(c.id) === String(form.claim_type_id));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit Claim" : "Apply for Claim"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Update your pending claim details" : "Submit a new reimbursement claim"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {serverErr && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-600 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {serverErr}
            </div>
          )}

          {/* Claim Type */}
          <Field label="Claim Type" error={errors.claim_type_id} required>
            <select
              value={form.claim_type_id}
              onChange={(e) => set("claim_type_id", e.target.value)}
              className={inputCls(errors.claim_type_id)}
            >
              <option value="">Select type…</option>
              {claimTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} — max ₹{Number(ct.max_amount).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
            {selectedType && (
              <p className="text-xs text-slate-400 mt-1">
                {selectedType.description}
                {selectedType.requires_document && (
                  <span className="ml-2 text-amber-600 font-medium">• Receipt required</span>
                )}
              </p>
            )}
          </Field>

          {/* Project (optional) */}
          <Field label="Project" hint="Optional">
            <select
              value={form.project_id}
              onChange={(e) => set("project_id", e.target.value)}
              className={inputCls()}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          {/* Date + Amount row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Claim Date" error={errors.claim_date} required>
              <input
                type="date"
                value={form.claim_date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("claim_date", e.target.value)}
                className={inputCls(errors.claim_date)}
              />
            </Field>
            <Field label="Amount (₹)" error={errors.amount} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="0"
                  className={`${inputCls(errors.amount)} pl-7`}
                />
              </div>
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" error={errors.description} required>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Briefly describe this expense…"
              className={`${inputCls(errors.description)} resize-none`}
            />
          </Field>

          {/* Receipt Upload */}
          <Field label="Receipt / Document" hint={selectedType?.requires_document ? "Required" : "Optional"}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/40 transition-all group"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {preview ? (
                <img src={preview} alt="preview" className="max-h-32 mx-auto rounded-lg object-contain" />
              ) : file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Upload size={16} className="text-orange-500" />
                  {file.name}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload size={20} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                  <p className="text-xs text-slate-400">
                    Drop file or <span className="text-orange-500 font-medium">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-300">JPG, PNG, PDF up to 5MB</p>
                </div>
              )}
              {(file || editData?.receipt_path) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            {!file && editData?.receipt_path && (
              <p className="text-xs text-slate-400 mt-1">
                Current: <span className="text-slate-600 font-medium">{editData.receipt_path.split("\\").pop().split("/").pop()}</span>
              </p>
            )}
          </Field>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-orange-200"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Update Claim" : "Submit Claim"}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── tiny form helpers ─────────────────────────────────────────────────────────
function Field({ label, children, error, hint, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
        {hint && <span className="ml-1 text-[10px] font-normal normal-case text-slate-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 outline-none transition-all
   placeholder:text-slate-300 hover:border-slate-300
   focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white
   ${err ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;