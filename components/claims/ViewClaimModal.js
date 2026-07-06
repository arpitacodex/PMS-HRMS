"use client";

import { X, FileText, Calendar, DollarSign, User, Tag, Briefcase, MessageSquare } from "lucide-react";
import { StatusBadge, fmt, fmtDate } from "./claimUtils";


export default function ViewClaimModal({ claim, onClose }) {
  const BASE_URL = "http://localhost:8080";

const receiptUrl = claim?.receipt_path
  ? `${BASE_URL}/${claim.receipt_path
      .replace(/\\/g, "/")
      .replace(/^public\//, "")
      .replace(/^\//, "")}`
  : "";
  if (!claim) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <FileText size={20} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-black dark:text-white">Claim #{claim.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDate(claim.applied_at || claim.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={claim.status} />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Tag} label="Claim Type" value={claim.claim_type?.name || `Type #${claim.claim_type_id}`} />
              <DetailRow icon={DollarSign} label="Amount" value={fmt(claim.amount)} highlight />
              <DetailRow icon={Calendar} label="Claim Date" value={fmtDate(claim.claim_date)} />
              <DetailRow icon={Briefcase} label="Project" value={claim.project?.name || "—"} />
              {claim.user && (
                <DetailRow
                  icon={User}
                  label="Employee"
                  value={`${claim.user.first_name || ""} ${claim.user.last_name || ""}`.trim() || "—"}
                />
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{claim.description || "—"}</p>
            </div>
{claim.review_comments && (
  <div
    className={`rounded-xl p-4 
      ${
        claim.status === "approved"
          ? "bg-emerald-50 border-emerald-100"
          : claim.status === "rejected"
          ? "bg-rose-50 border-rose-100"
          : "bg-amber-50 border-amber-100"
      }
    `}
  >
    <div className="flex items-center gap-1.5 mb-1.5">
      <MessageSquare
        size={13}
        className={
          claim.status === "approved"
            ? "text-emerald-600"
            : claim.status === "rejected"
            ? "text-rose-600"
            : "text-amber-600"
        }
      />

      <p
        className={`text-xs font-semibold uppercase tracking-wider
          ${
            claim.status === "approved"
              ? "text-emerald-600"
              : claim.status === "rejected"
              ? "text-rose-600"
              : "text-amber-600"
          }
        `}
      >
        Review Comments
      </p>
    </div>

    <p
      className={`text-sm
        ${
          claim.status === "approved"
            ? "text-emerald-800"
            : claim.status === "rejected"
            ? "text-rose-800"
            : "text-amber-800"
        }
      `}
    >
      {claim.review_comments}
    </p>
  </div>
)}

            {/* {claim.receipt_path && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Receipt</p>
                <a
                  href={`http://localhost:8080/${claim.receipt_path.replace(/\\/g, "/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 font-medium transition-colors"
                >
                  <FileText size={14} />
                  View Receipt
                </a>
              </div>
            )} */}

{receiptUrl && (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
      Receipt
    </p>

    <a
      href={receiptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 font-medium"
    >
      <FileText size={14} />
      View Receipt
    </a>
  </div>
)}

            

            {/* Timeline */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline</p>
              {[
                { label: "Applied",  date: claim.applied_at || claim.created_at },
                { label: "Reviewed", date: claim.reviewed_at },
                { label: "Paid",     date: claim.paid_at },
              ].filter((t) => t.date).map((t) => (
                <div key={t.label} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-slate-500 w-16 shrink-0">{t.label}</span>
                  <span className="text-slate-700">{fmtDate(t.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-slate-400" />
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-sm font-semibold ${highlight ? "text-orange-600" : "text-slate-700"}`}>{value || "—"}</p>
    </div>
  );
}