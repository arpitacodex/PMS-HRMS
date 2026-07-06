"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ icon: Icon, iconBg = "bg-orange-100", iconColor = "text-[#ff8c42]", title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Icon block */}
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className={iconColor} />
        </div>
        <div>
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 mb-0.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={12} className="text-gray-400" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-xs text-gray-500 hover:text-[#ff8c42] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}