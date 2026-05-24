import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Droplets,
  Calendar,
  LayoutDashboard,
  LogOut,
  User,
  Target,
  FileSpreadsheet,
  Settings,
  Bell,
  ChevronDown,
  Bot,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Megaphone,
  X,
} from "lucide-react";
import { authService } from "../services/auth.service";
import { analyticsService } from "../services/analytics.service";
import { useI18n, getScopedSetting } from "../utils/userSettings";

function notificationKey(user) {
  return `sbdcs_read_notifications_${user?.role || "guest"}_${user?.id || user?.phone || "unknown"}`;
}

function notificationId(item) {
  return `${item.type || "INFO"}|${item.title || ""}|${item.message || ""}`;
}

function shouldShowNotification(item, user) {
  if (!item?.type) return true;

  const isAdmin = user?.role === "HOSPITAL_ADMIN";

  // Always show emergency alerts regardless of settings
  if (item.type === "EMERGENCY" || item.priority === "HIGH") return true;

  if (isAdmin) {
    // Hospital admin notifications
    if (item.type === "LOW_STOCK") {
      return getScopedSetting("inventory_alerts", true, user) === true;
    }
    if (item.type === "EMERGENCY_CAMPAIGN") {
      return getScopedSetting("emergency_alerts", true, user) === true;
    }
    if (
      item.type === "UPCOMING_APPOINTMENT" ||
      item.type === "TODAY_APPOINTMENTS"
    ) {
      return getScopedSetting("new_appointments", true, user) === true;
    }
  } else {
    // Donor notifications
    if (item.type === "UPCOMING_APPOINTMENT") {
      return getScopedSetting("appointment_reminder", true, user) === true;
    }
    if (item.type === "ELIGIBLE_AGAIN" || item.type === "RECOVERY") {
      return getScopedSetting("donation_campaigns", true, user) === true;
    }
    if (item.type === "APPOINTMENT_APPROVED") {
      return getScopedSetting("appointment_reminder", true, user) === true;
    }
  }

  return true;
}

function NotificationBell({ user }) {
  const tr = useI18n(user);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(notificationKey(user)) || "[]");
    } catch {
      return [];
    }
  });
  const panelRef = useRef(null);

  const unreadItems = useMemo(
    () => items.filter((item) => !readIds.includes(notificationId(item))),
    [items, readIds],
  );
  const unreadCount = unreadItems.length;

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getNotifications();
      const filtered = (data?.items || []).filter((item) => shouldShowNotification(item, user));
      setItems(filtered);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?.id, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    const ids = items.map(notificationId);
    setReadIds(ids);
    localStorage.setItem(notificationKey(user), JSON.stringify(ids));
  };

  const markOneRead = (item) => {
    const id = notificationId(item);
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    localStorage.setItem(notificationKey(user), JSON.stringify(next));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) loadNotifications();
        }}
        className="relative rounded-2xl border border-slate-100 bg-white p-3 text-slate-500 shadow-sm transition hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-red-400"
        aria-label={tr("openNotifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-20 z-[9999] flex w-[min(360px,calc(100vw-2rem))] flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-950 dark:shadow-black/40" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
          {/* Header - cố định */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50">
                {tr("notificationsTitle")}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {tr("unreadAlerts", { count: unreadCount })}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Danh sách - cuộn được, chiếm phần còn lại */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
            {loading ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                {tr("loadingNotifications")}
              </p>
            ) : items.length ? (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <MiniNotification
                    key={`${notificationId(item)}-${index}`}
                    item={item}
                    unread={!readIds.includes(notificationId(item))}
                    onClick={() => markOneRead(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                {tr("noActiveNotifications")}
              </p>
            )}
          </div>

          {/* Footer - luôn hiển thị ở dưới */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 p-3 dark:border-slate-800">
            <button
              onClick={markAllRead}
              className="rounded-2xl px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {tr("markAllRead")}
            </button>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-red-700"
            >
              {tr("viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniNotification({ item, unread, onClick }) {
  const iconMap = {
    EMERGENCY: AlertTriangle,
    LOW_STOCK: HeartPulse,
    EMERGENCY_CAMPAIGN: Megaphone,
    UPCOMING_APPOINTMENT: Calendar,
    APPOINTMENT_APPROVED: CheckCircle2,
    ELIGIBLE_AGAIN: CheckCircle2,
    RECOVERY: HeartPulse,
    TODAY_APPOINTMENTS: Calendar,
  };
  const Icon = iconMap[item.type] || Bell;
  const isHigh = item.priority === "HIGH";
  const isSuccess = item.priority === "SUCCESS";
  const tone = isHigh
    ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/70"
    : isSuccess
      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/70"
      : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/70";
  return (
    <Link
      to="/notifications"
      onClick={onClick}
      className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/80">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 text-sm font-black">{item.title}</h4>
            {unread && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-600" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-semibold opacity-80">
            {item.message}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const tr = useI18n(user);
  const [, forceSettingsRefresh] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const refresh = () => forceSettingsRefresh((v) => v + 1);
    window.addEventListener("sbdcs-settings-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("sbdcs-settings-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (
    !user &&
    location.pathname !== "/login" &&
    location.pathname !== "/register"
  )
    return <>{children}</>;

  const routeMeta = (() => {
    const map = {
      "/": {
        title:
          user?.role === "HOSPITAL_ADMIN"
            ? tr("hospitalDashboard")
            : tr("donorDashboard"),
        subtitle:
          user?.role === "HOSPITAL_ADMIN"
            ? tr("hospitalSubtitle")
            : tr("donorSubtitle"),
      },
      "/appointments": {
        title: tr("appointments"),
        subtitle: tr("scheduleDesc"),
      },
      "/inventory": { title: tr("inventory"), subtitle: tr("inventoryDesc") },
      "/recommendation": {
        title: tr("recommendation"),
        subtitle: tr("recommendationPageDesc"),
      },
      "/reports": { title: tr("reports"), subtitle: tr("reportAnalytics") },
      "/assistant": {
        title: tr("smartAssistantTitle"),
        subtitle: tr("assistantDesc"),
      },
      "/notifications": {
        title: tr("notificationsTitle"),
        subtitle: tr("notificationIntroDesc"),
      },
      "/settings": {
        title:
          user?.role === "HOSPITAL_ADMIN"
            ? tr("hospitalSettingsTitle")
            : tr("donorSettingsTitle"),
        subtitle: tr("settingsIntro"),
      },
    };
    if (location.pathname.startsWith("/congratulations")) {
      return { title: tr("congratulations"), subtitle: "" };
    }
    return map[location.pathname] || map["/"];
  })();

  const navItems = [
    {
      labelKey: "dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["HOSPITAL_ADMIN", "DONOR"],
    },
    {
      labelKey: "appointments",
      path: "/appointments",
      icon: Calendar,
      roles: ["HOSPITAL_ADMIN", "DONOR"],
    },
    {
      labelKey: "inventory",
      path: "/inventory",
      icon: Droplets,
      roles: ["HOSPITAL_ADMIN"],
    },
    {
      labelKey: "recommendation",
      path: "/recommendation",
      icon: Target,
      roles: ["HOSPITAL_ADMIN"],
    },
    {
      labelKey: "reports",
      path: "/reports",
      icon: FileSpreadsheet,
      roles: ["HOSPITAL_ADMIN"],
    },
    { labelKey: "assistant", path: "/assistant", icon: Bot, roles: ["DONOR"] },
    {
      labelKey: "notifications",
      path: "/notifications",
      icon: Bell,
      roles: ["HOSPITAL_ADMIN", "DONOR"],
    },
    {
      labelKey: "settings",
      path: "/settings",
      icon: Settings,
      roles: ["HOSPITAL_ADMIN", "DONOR"],
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
        <div className="shrink-0 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-100 dark:shadow-red-950/40">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                SBDCs
              </h1>
              <p className="text-sm leading-tight text-slate-500 dark:text-slate-400">
                {tr("appSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6 shrink-0 border-t border-slate-100 dark:border-slate-800" />

        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:thin]">
          {navItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={`${item.labelKey}-${item.path}`}
                  to={item.path}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold transition-all ${
                    active
                      ? "bg-red-50 text-red-600 shadow-sm shadow-red-100 dark:bg-red-950/40 dark:text-red-300 dark:shadow-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${active ? "text-red-600 dark:text-red-300" : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"}`}
                  />
                  {tr(item.labelKey)}
                </Link>
              );
            })}
        </nav>

        <div className="shrink-0 bg-white px-6 pb-5 pt-3 dark:bg-slate-950">
          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-[15px] font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-5 w-5" />
              {tr("logout")}
            </button>
          </div>
        </div>
      </aside>

      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden md:ml-[280px]">
        <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 md:hidden">
              ☰
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-slate-950 dark:text-white">
                {routeMeta.title}
              </h2>
              {routeMeta.subtitle && (
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {routeMeta.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-3 rounded-2xl px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="leading-tight text-left">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {user?.full_name ||
                      (user?.role === "HOSPITAL_ADMIN"
                        ? tr("hospitalAdmin")
                        : tr("donor"))}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user?.role === "HOSPITAL_ADMIN"
                      ? tr("hospital")
                      : tr("donor")}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-14 z-[120] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Hồ sơ & cài đặt
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Thông báo
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </section>
    </div>
  );
}