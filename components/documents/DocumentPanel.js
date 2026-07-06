"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DocumentComponents.jsx — DocumentUploadPanel + ViewDocumentsPanel + DocRow
//
// Fixes applied vs previous version:
//  1. uploadDocs URL now passes the TARGET userId from props (not logged-in user)
//     → backend uploadUserDocuments.js now also reads req.params.userId (fixed)
//  2. deleteDoc URL uses /documents/doc/:docId (dedicated route, no clash)
//     → backend deleteUserDocument.js is now implemented (was 0 bytes)
//  3. getUserDocs passes the target userId → backend getUserDocument.js now
//     reads req.params.userId instead of req.user.id
//  4. ViewDocumentsPanel receives docs + loading correctly (no internal fetch)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";

const BASE      = "http://localhost:8080/api/auth";
const FILE_BASE = "http://localhost:8080";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : "";

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${getToken()}`,
});

const toFileUrl = (filePath) => {
  if (!filePath) return "#";
  let clean = filePath.replace(/\\/g, "/");
  clean = clean.replace(/^\/+/, "");
  clean = clean.replace(/^public\//, "");
  return `${FILE_BASE}/${clean}`;
};

const APIS = {
  // ✅ FIX 1: uploadDocs passes the target userId in the URL
  //    Backend uploadUserDocuments.js now reads req.params.userId (not req.user.id)
  uploadDocs:  (userId) => `${BASE}/upload-documents/${userId}`,

  // ✅ FIX 2: getUserDocs passes the target userId
  //    Backend getUserDocument.js now reads req.params.userId (not req.user.id)
  getUserDocs: (userId) => `${BASE}/documents/${userId}`,

  // ✅ FIX 3: Dedicated DELETE route so it doesn't clash with GET /documents/:userId
  //    Backend deleteUserDocument.js is now implemented (was 0 bytes before)
  //    Router: DELETE /api/auth/documents/doc/:docId  (defined BEFORE GET /documents/:userId)
  deleteDoc:   (docId)  => `${BASE}/documents/doc/${docId}`,
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fileAccentColor(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf")
    return { icon: "text-red-500",    bg: "bg-red-50",    border: "border-red-100"    };
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return { icon: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" };
  if (["doc", "docx"].includes(ext))
    return { icon: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   };
  return   { icon: "text-gray-400",   bg: "bg-gray-50",   border: "border-gray-100"   };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function FileIcon({ name = "", className = "w-4 h-4" }) {
  const ext = (name.split(".").pop() || "").toLowerCase();

  if (ext === "pdf")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        <text x="6.5" y="17" fontSize="5" fontWeight="bold" fill="currentColor" stroke="none">PDF</text>
      </svg>
    );

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    );

  if (["doc", "docx"].includes(ext))
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    );

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  );
}

function Spinner({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOC ROW — shows file info + VIEW button + DELETE button with confirm dialog
// ─────────────────────────────────────────────────────────────────────────────
function DocRow({ doc, onDelete }) {
  const [deleting,     setDeleting]     = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  const fileName = doc.document_name || doc.file_path?.split(/[/\\]/).pop() || "Document";
  const accent   = fileAccentColor(fileName);
  const fileUrl  = toFileUrl(doc.file_path);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(APIS.deleteDoc(doc.id), {
        method:  "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Delete failed");
      }
      onDelete?.(doc.id); // remove from parent state instantly
    } catch (err) {
      alert(err.message || "Failed to delete document");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      {/* ── Confirm dialog ── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[320px] mx-4 border border-red-100"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 text-center mb-1">Delete Document?</h3>
            <p className="text-xs text-gray-400 text-center mb-5 break-all px-2">
              "<span className="text-gray-600 font-medium">{fileName}</span>" will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-60"
              >
                {deleting ? <><Spinner /> Deleting…</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Row card ── */}
      <div
        className="group flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-sm transition-all duration-200"
        style={{ borderColor: "#f0f0f0", animation: "fadeSlideIn 0.2s ease both" }}
      >
        {/* File type icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${accent.bg} ${accent.border}`}>
          <FileIcon name={fileName} className={`w-4 h-4 ${accent.icon}`} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{fileName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {doc.file_size && (
              <span className="text-[10px] text-gray-400">{formatSize(doc.file_size)}</span>
            )}
            {doc.uploaded_at && (
              <>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">{formatDate(doc.uploaded_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* VIEW — opens file in new tab */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View document"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ff6b1a] hover:bg-orange-50 border border-transparent hover:border-orange-100 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </a>

          {/* DELETE — shows confirm dialog */}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            title="Delete document"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED LIST — renders all doc rows + header count + empty state
// ─────────────────────────────────────────────────────────────────────────────
function DocumentList({ docs = [], onDocDeleted }) {
  if (!docs.length)
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-400">No documents yet</p>
        <p className="text-xs text-gray-300">Uploaded files will appear here</p>
      </div>
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Uploaded Documents
        </p>
        <span className="text-[10px] font-semibold text-[#ff6b1a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
          {docs.length} file{docs.length !== 1 ? "s" : ""}
        </span>
      </div>
      {docs.map((doc) => (
        <DocRow key={doc.id} doc={doc} onDelete={onDocDeleted} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT UPLOAD PANEL
// Props:
//   userId       — the TARGET employee's id (NOT the logged-in user)
//   existingDocs — doc array passed down from parent (fetched via fetchUserDocs)
//   onUploaded   — called after successful upload so parent re-fetches docs
//   onDocDeleted — called with docId to remove a doc from parent state
// ─────────────────────────────────────────────────────────────────────────────
export function DocumentUploadPanel({ userId, existingDocs = [], onUploaded, onDocDeleted }) {
  const [uploading,    setUploading]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | "done" | "error"
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef(null);

  const doUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("document", f));

    try {
      // ✅ passes the target userId in the URL — backend saves docs under that user
      const res  = await fetch(APIS.uploadDocs(userId), {
        method:  "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setUploadStatus("done");
      onUploaded?.(); // tells parent to re-call fetchUserDocs(userId)
    } catch {
      setUploadStatus("error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadStatus(null), 3500);
    }
  };

  const handleFileChange = (e) => doUpload(Array.from(e.target.files));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!uploading) doUpload(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center gap-2.5",
          "w-full py-9 rounded-2xl border-2 border-dashed cursor-pointer select-none",
          "transition-all duration-200",
          uploading
            ? "border-gray-200 bg-gray-50 cursor-wait"
            : dragOver
            ? "border-[#ff6b1a] bg-orange-50/40 scale-[1.01]"
            : uploadStatus === "done"
            ? "border-emerald-300 bg-emerald-50/50"
            : uploadStatus === "error"
            ? "border-red-300 bg-red-50/50"
            : "border-gray-200 bg-white hover:border-[#ff6b1a]/60 hover:bg-orange-50/20",
        ].join(" ")}
      >
        {uploading ? (
          <>
            <Spinner className="w-6 h-6 text-[#ff6b1a]" />
            <p className="text-xs font-semibold text-gray-400">Uploading files…</p>
          </>
        ) : uploadStatus === "done" ? (
          <>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg font-bold">✓</div>
            <p className="text-xs font-bold text-emerald-600">Uploaded successfully!</p>
            <p className="text-[10px] text-emerald-400">Click to upload more</p>
          </>
        ) : uploadStatus === "error" ? (
          <>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-lg font-bold">✕</div>
            <p className="text-xs font-bold text-red-500">Upload failed — click to retry</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#ff6b1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v8m0 0l-3-3m3 3l3-3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">
                Drop files here or <span className="text-[#ff6b1a]">browse</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC, DOCX, JPG, PNG — multiple files supported</p>
            </div>
          </>
        )}
      </div>

      {/* Document list with view + delete per row */}
      <DocumentList docs={existingDocs} onDocDeleted={onDocDeleted} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW DOCUMENTS PANEL — used in the "View User" drawer Documents tab
// Props:
//   docs        — doc array passed from parent (already fetched)
//   loading     — boolean, shows spinner while fetching
//   onDocDeleted — called with docId to remove doc from parent state
// ─────────────────────────────────────────────────────────────────────────────
export function ViewDocumentsPanel({ docs = [], loading, onDocDeleted }) {
  if (loading)
    return (
      <div className="flex items-center justify-center gap-2.5 py-12 text-gray-400 text-sm">
        <Spinner className="w-4 h-4" /> Loading documents…
      </div>
    );

  return <DocumentList docs={docs} onDocDeleted={onDocDeleted} />;
}