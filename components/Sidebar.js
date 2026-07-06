"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Bell, Users, Building2, ShoppingBag,
  Gavel, Handshake, Lightbulb, FolderKanban, LayoutGrid,
  CheckCircle2, XCircle, ListTodo, Bug, Star, GitPullRequest,
  Activity, MessageSquare, CalendarDays, Megaphone,
  Umbrella, AlignLeft, Scale, Receipt, FileCheck,
  BadgeDollarSign, Wallet, History, Zap, RefreshCw,
  CreditCard, SlidersHorizontal, Package, UserCheck,
  CalendarRange, TrendingUp, BarChart3, ChevronRight,
  ChevronDown, Settings, LogOut, X, Tags, ClipboardList,
  PlusCircle, ListChecks, Tag, User, Shield, Layers,
  Mail, KeyRound,
} from "lucide-react";

const API_AUTH = "http://localhost:8080/api/auth";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole  = () => (typeof window !== "undefined" ? localStorage.getItem("role") : "");
const r = () => (getRole() || "").toLowerCase();

// ── Role checks ──────────────────────────────────────────────────────────────
const isAdmin          = () => r() === "admin";
const isProjectManager = () => r() === "project_manager";
const isTeamLead       = () => r() === "team_lead";
const isSalesManager   = () => r() === "sales_manager";
const isSales          = () => r() === "sales";
const isHRManager      = () => r() === "hr_manager";
const isHR             = () => r() === "hr";
const isAccountsManager= () => r() === "accounts_manager";
const isAccounts       = () => r() === "accounts";
const isEmployee       = () => r() === "employee";

// ── Permission helpers ────────────────────────────────────────────────────────
const canSeeNotifications   = () => true;
const canSeeEmployees       = () => isAdmin() || isHRManager() || isHR() || isProjectManager();
const canSeeClients         = () => isAdmin() || isSalesManager() || isSales() || isProjectManager();

// Sales
const canSeeSales           = () => isAdmin() || isSalesManager() || isSales();
const canSeeBid             = () => isAdmin() || isSalesManager() || isSales();
const canSeeDeal            = () => isAdmin() || isSalesManager();
const canSeeLead            = () => isAdmin() || isSalesManager() || isSales();

// Projects
const canSeeProjects        = () => isAdmin() || isProjectManager() || isTeamLead();

// Tasks
const canSeeTasks           = () => isAdmin() || isProjectManager() || isTeamLead() || isEmployee();

const canSeeMessages        = () => true;
const canSeeHolidays        = () => true;
const canSeeNotices         = () => true;

// Leaves
const canSeeLeaves          = () => isAdmin() || isHRManager() || isHR() || isProjectManager() || isTeamLead() || isEmployee();
const canSeeAllLeaves       = () => isAdmin() || isHRManager() || isHR() || isProjectManager();
const canSeeLeaveBalance    = () => isAdmin() || isHRManager() || isHR();

// Claims
const canSeeClaims          = () => isAdmin() || isHRManager() || isHR() || isAccountsManager() || isAccounts() || isEmployee();
const canSeeAllClaims       = () => isAdmin() || isHRManager() || isHR();
const canSeeClaimsPayment   = () => isAdmin() || isHRManager() || isHR() || isAccountsManager() || isAccounts();

// Salary / Payroll
const canSeeSalary          = () => isAdmin() || isHRManager() || isHR() || isAccountsManager() || isAccounts() || isEmployee();
const canSeeSalaryAdmin     = () => isAdmin() || isHRManager() || isHR();
const canSeeAllPayslips     = () => isAdmin() || isHRManager() || isHR() || isAccountsManager() || isAccounts();
const canGeneratePayroll    = () => isAdmin() || isHRManager() || isHR();
const canMarkPaid           = () => isAdmin() || isHRManager() || isHR() || isAccountsManager() || isAccounts();
const canSeeVariableInputs  = () => isAdmin() || isHRManager() || isHR();

// Assets
const canSeeAssets          = () => isAdmin() || isHRManager() || isHR();

const canSeeEventsCalendar  = () => true;
const canSeePerformance     = () => isAdmin() || isProjectManager() || isHRManager() || isTeamLead();
const canSeeReports         = () => isAdmin() || isProjectManager() || isSalesManager() || isHRManager() || isAccountsManager();

// Master
const canSeeMaster          = () => isAdmin() || isHRManager();
const canSeeRolePermission  = () => isAdmin();
const canSeeEmailTemplate   = () => isAdmin();
const canSeeSettings        = () => isAdmin();

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [expanded,  setExpanded]  = useState(null);
  const [user,      setUser]      = useState({});
  const [flyout,    setFlyout]    = useState(null);
  const flyoutRef                 = useRef(null);
  const hideTimerRef              = useRef(null);

  useEffect(() => {
    const token  = getToken();
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!token || !userId) return;
    fetch(`${API_AUTH}/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(d   => { if (d.success) setUser(d.user); })
      .catch(e  => console.error("Sidebar user fetch error:", e));
  }, []);

  useEffect(() => { if (isOpen) setFlyout(null); }, [isOpen]);

  const initials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const showFlyout = (item, e) => {
    if (isOpen) return;
    clearTimeout(hideTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ item, top: rect.top });
  };
  const hideFlyout  = () => { hideTimerRef.current = setTimeout(() => setFlyout(null), 130); };
  const keepFlyout  = () => { clearTimeout(hideTimerRef.current); };

  // ── Menu definition ───────────────────────────────────────────────────────
  const menuSections = [
    {
      label: "MAIN",
      items: [
        { name: "Dashboard",      icon: LayoutDashboard, href: "/dashboard" },

        ...(canSeeNotifications() ? [{ name: "Notices", icon: Bell,         href: "/notices" }] : []),
        ...(canSeeEmployees()     ? [{ name: "Employee",      icon: Users,         href: "/accessibilities/users"     }] : []),
        ...(canSeeClients()       ? [{ name: "Clients",       icon: Building2,     href: "/accessibilities/client"       }] : []),

        ...(canSeeSales() ? [{
          name: "Sales", icon: ShoppingBag, href: "/sales",
          subItems: [
            ...(canSeeBid()  ? [{ name: "Bid",  icon: Gavel,     href: "/accessibilities/bid"  }] : []),
            ...(canSeeDeal() ? [{ name: "Deal", icon: Handshake, href: "/accessibilities/deal" }] : []),
            ...(canSeeLead() ? [{ name: "Lead", icon: Lightbulb, href: "/accessibilities/leade" }] : []),
          ],
        }] : []),

        ...(canSeeProjects() ? [{
          name: "Projects", icon: FolderKanban, href: "/projects",
          subItems: [
            { name: "All",       icon: LayoutGrid, href: "/projects/all"       },
            { name: "Completed", icon: CheckCircle2,href: "/projects/completed"},
            { name: "Cancelled", icon: XCircle,    href: "/projects/cancelled" },
          ],
        }] : []),

        ...(canSeeTasks() ? [{
          name: "Tasks", icon: ListTodo, href: "/tasks",
          subItems: [
            { name: "All",       icon: LayoutGrid, href: "/tasks/all"       },
            { name: "Completed", icon: CheckCircle2,href: "/tasks/completed"},
            { name: "Cancelled", icon: XCircle,    href: "/tasks/cancelled" },
            { name: "Bug",       icon: Bug,         href: "/tasks/bug"       },
            { name: "Reviews",   icon: Star,        href: "/tasks/reviews"   },
            { name: "Progress",  icon: Activity,    href: "/tasks/progress"  },
          ],
        }] : []),

        ...(canSeeMessages()  ? [{ name: "Messages", icon: MessageSquare, href: "/chatPage"  }] : []),
        ...(canSeeHolidays()  ? [{ name: "Holidays", icon: CalendarDays,  href: "/time-off/holidays"  }] : []),
        ...(canSeeNotices()   ? [{ name: "Notification",   icon: Megaphone,     href: "/notification"   }] : []),
      ],
    },
    {
      label: "HR & PAYROLL",
      items: [
        ...(canSeeLeaves() ? [{
          name: "Leaves", icon: Umbrella, href: "/leaves",
          subItems: [
            ...(canSeeAllLeaves()    ? [{ name: "All Leaves",     icon: AlignLeft, href: "/time-off/leave-controllers"     }] : []),
            ...(canSeeLeaveBalance() ? [{ name: "Leave Balance",  icon: Scale,     href: "/time-off/leave-balance" }] : []),
            { name: "My Leaves",       icon: AlignLeft, href: "/time-off/my-leave"      },
          ],
        }] : []),

        ...(canSeeClaims() ? [{
          name: "Claims", icon: Receipt, href: "/claims",
          subItems: [
            ...(canSeeAllClaims()      ? [{ name: "All Claims",     icon: FileCheck,       href: "/time-off/all-claims"     }] : []),
            ...(canSeeClaimsPayment()  ? [{ name: "Claims Payment", icon: BadgeDollarSign, href: "/time-off/claims-payment" }] : []),
            { name: "My Claims", icon: Receipt, href: "/time-off/my-claims" },
          ],
        }] : []),

        ...(canSeeSalary() ? [{
          name: "Salary", icon: Wallet, href: "/salary",
          subItems: [
            { name: "Salary History",    icon: History,   href: "/payslips/all"         },
            { name: "Employee History",  icon: Users,     href: "/payslips/employee-history" },
            ...(canGeneratePayroll()  ? [{ name: "Generate Payslips", icon: Zap,       href: "/payslips/generate"      }] : []),
            ...(canGeneratePayroll()  ? [{ name: "Bulk Generate",     icon: RefreshCw, href: "/payslips/bulk-generate" }] : []),
            ...(canMarkPaid()         ? [{ name: "Mark as Paid",      icon: CreditCard,href: "/payslips/mark-paid"     }] : []),
            ...(canSeeVariableInputs()? [{ name: "Variable Inputs",   icon: SlidersHorizontal, href: "/variable/variable-inputs" }] : []),
          ],
        }] : []),

        ...(canSeeAssets() ? [{
          name: "Assets", icon: Package, href: "/assets",
          subItems: [
            { name: "All Assets",   icon: Package,   href: "/assets/all"         },
            { name: "Assignments",  icon: UserCheck, href: "/assets/assignments" },
          ],
        }] : []),
      ],
    },
    {
      label: "WORKSPACE",
      items: [
        ...(canSeeEventsCalendar() ? [{ name: "Events Calendar", icon: CalendarRange, href: "/eventCalendar"      }] : []),
        ...(canSeePerformance()    ? [{ name: "Performance",     icon: TrendingUp,    href: "/performance" }] : []),
        ...(canSeeReports()        ? [{ name: "Reports",         icon: BarChart3,     href: "/reports"     }] : []),
      ],
    },
    {
      label: "ADMIN",
      items: [
        ...(canSeeMaster() ? [{
          name: "Master", icon: Layers, href: "/master",
          subItems: [
            { name: "Leave Type",          icon: Tags,          href: "/time-off/leave-type"         },
            { name: "Claims Types",        icon: ClipboardList, href: "/time-off/claim-types"         },
            { name: "Salary Components",   icon: PlusCircle,    href: "/payroll/salary-components/create"   },
            { name: "Salary Structures",   icon: ListChecks,    href: "/payroll/salary-structures/all"   },
            { name: "Asset Categories",    icon: Tag,           href: "/assets/categories"    },
            ...(canSeeRolePermission()  ? [{ name: "Role Permissions",  icon: Shield, href: "/role-permission" }] : []),
            ...(canSeeEmailTemplate()   ? [{ name: "Email Templates",   icon: Mail,   href: "/master/email-templates"  }] : []),
          ],
        }] : []),

        ...(canSeeSettings() ? [{ name: "Settings", icon: Settings, href: "/settings" }] : []),
        { name: "My Profile", icon: User, href: "/profile" },
      ],
    },
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isActive    = (href) => pathname === href;
  const isSubActive = (subs) => subs?.some(s => !s.type && isActive(s.href));
  const closeMobile = () => {
    setFlyout(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) setIsOpen(false);
  };
  const toggleExpand = (name) => setExpanded(p => p === name ? null : name);

  // Auto-expand active parent
  useEffect(() => {
    menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems && isSubActive(item.subItems)) {
          setExpanded(item.name);
        }
      });
    });
  }, [pathname]);

  const renderFlyoutContent = (item) => {
    if (!item.subItems?.length) return (
      <div className="px-3 py-2 text-[13px] font-semibold text-white">{item.name}</div>
    );
    return item.subItems.map((sub, idx) => (
      <Link
        key={`${sub.href}-${idx}`}
        href={sub.href}
        onClick={() => setFlyout(null)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-normal transition-all duration-150 group whitespace-nowrap
          ${isActive(sub.href) ? "text-white bg-white/15" : "text-white/65 hover:text-white hover:bg-white/10"}`}
      >
        <sub.icon size={14} strokeWidth={1.7}
          className={`flex-shrink-0 transition-all ${isActive(sub.href) ? "text-[#ff8c42]" : "text-white/45 group-hover:text-white/70"}`}
        />
        <span className="tracking-wide">{sub.name}</span>
      </Link>
    ));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div className="relative">
        <aside
          className={`
            fixed top-0 left-0 h-screen z-50 flex flex-col
            bg-[#0A0F1F] shadow-2xl
            transition-all duration-300 ease-out overflow-hidden
            ${isOpen ? "md:w-72" : "md:w-20"}
            w-72
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
        >
          {/* LOGO */}
          <div className="h-16 flex items-center justify-center bg-white border-b border-gray-200 relative">
            {isOpen ? (
              <>
                <img src="/codex-logo.png" alt="CodeX" className="h-8 object-contain" />
                <button onClick={() => setIsOpen(false)} className="md:hidden absolute right-4 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center mt-4">
                <img src="/short-logo.png" alt="CX" className="w-20 h-20 object-contain" />
              </div>
            )}
          </div>

          {/* NAV */}
          <nav
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
          >
            <style>{`
              aside nav::-webkit-scrollbar { width: 2px; }
              aside nav::-webkit-scrollbar-track { background: transparent; }
              aside nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 99px; }
            `}</style>

            {menuSections.map(({ label, items }) => {
              // Don't render section if no items pass permission
              if (items.length === 0) return null;
              return (
                <div key={label} className="mb-5">
                  {/* Section label */}
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className={`text-[10px] font-bold tracking-[1.8px] uppercase text-white/30 whitespace-nowrap transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                      {label}
                    </span>
                    {!isOpen && <div className="w-full h-px bg-white/10" />}
                  </div>

                  {items.map((item) => {
                    const isParentActive = item.subItems ? isSubActive(item.subItems) : isActive(item.href);
                    const isItemExpanded = expanded === item.name;

                    return (
                      <div key={item.name} className="mb-0.5">
                        {item.subItems ? (
                          <>
                            {/* Parent row */}
                            <button
                              onClick={() => { if (isOpen) toggleExpand(item.name); }}
                              onMouseEnter={(e) => showFlyout(item, e)}
                              onMouseLeave={hideFlyout}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                                ${isItemExpanded || isParentActive
                                  ? "bg-white/10 text-white"
                                  : "text-white/55 hover:bg-white/[0.07] hover:text-white/85"
                                }`}
                            >
                              {(isItemExpanded || isParentActive) && (
                                <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#ff8c42] rounded-r-full" />
                              )}
                              <item.icon size={19} strokeWidth={1.7}
                                className={`flex-shrink-0 transition-all duration-200 ${isItemExpanded || isParentActive ? "text-[#ff8c42]" : "text-white/40 group-hover:text-white/70"}`}
                              />
                              {isOpen && (
                                <>
                                  <span className="flex-1 text-left text-[13.5px]">{item.name}</span>
                                  <ChevronDown size={13} strokeWidth={2.2}
                                    className={`transition-transform duration-200 text-white/35 ${isItemExpanded ? "rotate-180" : ""}`}
                                  />
                                </>
                              )}
                            </button>

                            {/* Sub-items dropdown */}
                            {isItemExpanded && isOpen && (
                              <div className="ml-10 mt-0.5 border-l border-white/[0.08] pl-3 space-y-0.5 pb-1">
                                {item.subItems.map((sub, idx) => (
                                  <Link
                                    key={`${sub.href}-${idx}`}
                                    href={sub.href}
                                    onClick={closeMobile}
                                    className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-normal transition-all duration-150 group
                                      ${isActive(sub.href)
                                        ? "text-white bg-white/12"
                                        : "text-white/55 hover:text-white/90 hover:bg-white/[0.07]"
                                      }`}
                                  >
                                    <sub.icon size={14} strokeWidth={1.7}
                                      className={`flex-shrink-0 transition-all ${isActive(sub.href) ? "text-[#ff8c42]" : "text-white/40 group-hover:text-white/65"}`}
                                    />
                                    <span className="tracking-wide">{sub.name}</span>
                                    {isActive(sub.href) && (
                                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff8c42]" />
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Plain nav link */
                          <Link
                            href={item.href}
                            onClick={closeMobile}
                            onMouseEnter={(e) => showFlyout(item, e)}
                            onMouseLeave={hideFlyout}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden
                              ${isActive(item.href)
                                ? "bg-white/12 text-white"
                                : "text-white/55 hover:bg-white/[0.07] hover:text-white/85"
                              }`}
                          >
                            {isActive(item.href) && (
                              <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#ff8c42] rounded-r-full" />
                            )}
                            <item.icon size={19} strokeWidth={1.7}
                              className={`flex-shrink-0 transition-all duration-200 ${isActive(item.href) ? "text-[#ff8c42]" : "text-white/40 group-hover:text-white/70"}`}
                            />
                            {isOpen && <span className="flex-1 text-[13.5px]">{item.name}</span>}
                            {isOpen && isActive(item.href) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8c42] opacity-80" />
                            )}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* USER STRIP */}
          <div
            className="flex-shrink-0 px-3 py-3 flex items-center gap-3 overflow-hidden"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
          >
            <div className="w-[38px] h-[38px] rounded-full flex-shrink-0 bg-gradient-to-br from-[#ff8c42] to-[#ff6010] flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10">
              {initials}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
              <p className="text-[13px] font-semibold text-white leading-tight truncate">
                {user.first_name || "User"} {user.last_name || ""}
              </p>
              <p className="text-[10px] font-medium text-white/35 uppercase tracking-wider">
                {user?.roles?.[0]?.name?.toUpperCase() || "EMPLOYEE"}
              </p>
            </div>
            {isOpen && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/12 transition-all duration-200 border border-white/5 hover:border-red-500/25"
              >
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </aside>

        {/* COLLAPSE TOGGLE */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex fixed z-50 w-7 h-7 items-center justify-center bg-[#ff8c42] border-2 border-[#0A0F1F] rounded-full text-white hover:bg-[#ff7020] transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            left: isOpen ? "calc(288px - 14px)" : "calc(80px - 14px)",
          }}
        >
          <ChevronRight size={14} strokeWidth={3} className={`transition-all duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* FLYOUT (collapsed hover) */}
        {flyout && !isOpen && (
          <div
            ref={flyoutRef}
            onMouseEnter={keepFlyout}
            onMouseLeave={hideFlyout}
            style={{ position: "fixed", top: flyout.top, left: 86, zIndex: 9999 }}
            className="bg-[#141929] border border-white/[0.1] rounded-xl py-2 px-1.5 min-w-[185px] shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="px-3 pb-1.5 mb-1 border-b border-white/[0.07]">
              <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[#ff8c42]">
                {flyout.item.name}
              </span>
            </div>
            {flyout.item.subItems?.length
              ? renderFlyoutContent(flyout.item)
              : (
                <Link
                  href={flyout.item.href}
                  onClick={() => setFlyout(null)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 group
                    ${isActive(flyout.item.href) ? "text-white bg-white/15" : "text-white/65 hover:text-white hover:bg-white/10"}`}
                >
                  <flyout.item.icon size={14} strokeWidth={1.7}
                    className={`flex-shrink-0 ${isActive(flyout.item.href) ? "text-[#ff8c42]" : "text-white/45 group-hover:text-white/70"}`}
                  />
                  <span>{flyout.item.name}</span>
                </Link>
              )
            }
          </div>
        )}
      </div>
    </>
  );
}