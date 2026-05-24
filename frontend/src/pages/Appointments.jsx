import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Award,
  HeartHandshake,
  XCircle,
  CheckCircle2,
  Eye,
  FileText,
  Users,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { appointmentService } from "../services/appointment.service";
import { authService } from "../services/auth.service";
import { useI18n, getLanguageForUser } from "../utils/userSettings";
import {
  parseScreeningRaw,
  buildScreeningViewModel,
  formatAppointmentDateTime,
} from "../utils/screeningForm";
import {
  PageShell,
  Panel,
  StatCard,
  EmptyState,
  PrimaryButton,
  AlertBanner,
} from "../components/ui/PageShell";

const riskyKeys = [
  "medication",
  "tattoo",
  "surgery",
  "pregnant",
  "fever",
  "chronic",
  "faint",
  "hepatitisExposure",
  "unsafeSex",
  "prescription",
  "travelRisk",
  "otherHealthIssue",
];
const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-100",
  CHECKED_IN: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  IN_PROGRESS: "bg-purple-50 text-purple-700 ring-purple-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
};

function evaluateEligibility(screening, tr) {
  const reasons = [];
  const weight = Number(screening.weight);
  if (!weight || weight < 45) reasons.push(tr("screeningReasonWeight"));
  if (!screening.healthy) reasons.push(tr("screeningReasonHealthy"));
  if (!screening.ageEligible) reasons.push(tr("screeningReasonAge"));
  let riskFlag = false;
  riskyKeys.forEach((key) => {
    if (screening[key]) riskFlag = true;
  });
  if (riskFlag) reasons.push(tr("screeningReasonRisk"));
  return { eligible: reasons.length === 0, reasons };
}

function minDateTimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function maxDateTimeLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function parseDateSafe(value) {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const defaultScreening = {
  weight: "",
  lastDonation: "",
  healthy: true,
  ageEligible: true,
  medication: false,
  tattoo: false,
  surgery: false,
  pregnant: false,
  fever: false,
  chronic: false,
  faint: false,
  hepatitisExposure: false,
  unsafeSex: false,
  prescription: false,
  travelRisk: false,
  otherHealthIssue: false,
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [newApp, setNewApp] = useState({
    appointment_date: "",
    notes: "",
    screening: defaultScreening,
  });
  const [detailApp, setDetailApp] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === "HOSPITAL_ADMIN";
  const tr = useI18n(user);
  const result = evaluateEligibility(newApp.screening, tr);

  const resetModal = () => {
    setShowModal(false);
    setStep(1);
    setNewApp({ appointment_date: "", notes: "", screening: defaultScreening });
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      setAppointments(
        isAdmin
          ? await appointmentService.getAllAppointments()
          : await appointmentService.getMyAppointments(),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (isAdmin) return;
    setEligibilityLoading(true);
    try {
      setEligibility(await appointmentService.getEligibility());
    } catch (err) {
      console.error(err);
      setEligibility(null);
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchEligibility();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    let result =
      filter === "ALL"
        ? appointments
        : appointments.filter((a) => a.status === filter);

    // Always sort by appointment date (soonest first) - prioritize upcoming appointments
    result = result.sort((a, b) => {
      const aDate = new Date(a.appointment_date).getTime();
      const bDate = new Date(b.appointment_date).getTime();
      return aDate - bDate;
    });

    return result;
  }, [appointments, filter]);

  const stats = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter((a) => a.status === "PENDING").length,
      approved: appointments.filter((a) =>
        ["APPROVED", "CHECKED_IN", "IN_PROGRESS"].includes(a.status),
      ).length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
    }),
    [appointments],
  );

  const handleOpenBooking = async () => {
    await fetchEligibility();
    setStep(1);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const latestResult = evaluateEligibility(newApp.screening, tr);
    if (!latestResult.eligible)
      return alert(
        "Bạn hiện KHÔNG ĐỦ ĐIỀU KIỆN để hiến máu. Vui lòng kiểm tra lại phần sàng lọc.",
      );
    if (!newApp.appointment_date) return alert(tr("selectDateAlert"));
    const selectedDt = parseDateSafe(newApp.appointment_date);
    if (!selectedDt || selectedDt < new Date())
      return alert(
        "Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày giờ từ hiện tại trở về sau.",
      );
    const nextEligibleDt = parseDateSafe(eligibility?.next_eligible_date);
    if (nextEligibleDt && selectedDt < nextEligibleDt) {
      return alert(
        `Bạn có thể đặt lịch trước, nhưng ngày hẹn phải từ ${eligibility.next_eligible_display} trở về sau.`,
      );
    }
    try {
      const s = newApp.screening;
      const screeningResult = JSON.stringify({
        eligible: latestResult.eligible,
        weight: Number(s.weight),
        lastDonation:
          eligibility?.last_donation_display || tr("screeningNoPriorDonation"),
        nextEligible:
          eligibility?.next_eligible_display || tr("screeningEligibleNow"),
        healthy: s.healthy,
        age18to60: s.ageEligible,
        risks: Object.fromEntries(riskyKeys.map((k) => [k, Boolean(s[k])])),
        note: tr("screeningDisclaimer"),
      });
      await appointmentService.create({
        appointment_date: newApp.appointment_date,
        notes: newApp.notes || "",
        pre_screening_result: screeningResult,
      });
      resetModal();
      fetchAppointments();
      fetchEligibility();
    } catch (err) {
      alert(err.response?.data?.detail || tr("createAppointmentFailed"));
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || tr("updateStatusFailed"));
    }
  };

  const handleCancelMine = async (id) => {
    if (
      !confirm(
        "Bạn có chắc muốn hủy lịch này? Hệ thống sẽ giảm điểm tin cậy lịch hẹn của bạn.",
      )
    )
      return;
    try {
      await appointmentService.cancelMyAppointment(id);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể hủy lịch hẹn.");
    }
  };

  return (
    <PageShell>
      {!isAdmin && (
        <div className="flex justify-end">
          <PrimaryButton onClick={handleOpenBooking}>
            <Plus className="h-5 w-5" /> {tr("bookAppointment")}
          </PrimaryButton>
        </div>
      )}

      {!isAdmin && eligibility && !eligibilityLoading && (
        <AlertBanner tone={eligibility.eligible ? "success" : "warning"}>
          <strong>
            {eligibility.eligible
              ? "Bạn có thể đặt lịch hiến máu"
              : "Chưa đủ điều kiện theo chu kỳ 84 ngày"}
          </strong>
          <span className="block mt-1 font-normal opacity-90">
            {eligibility.message}
          </span>
          {!eligibility.first_time_donor && (
            <span className="block mt-1 text-xs opacity-80">
              Lần hiến gần nhất: {eligibility.last_donation_display} · Có thể
              hiến lại: {eligibility.next_eligible_display}
            </span>
          )}
        </AlertBanner>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={CalendarIcon}
            color="blue"
            title="Tổng lịch hẹn"
            value={stats.total}
            note="Toàn hệ thống"
          />
          <StatCard
            icon={Clock}
            color="amber"
            title="Chờ duyệt"
            value={stats.pending}
            note="Cần xử lý"
          />
          <StatCard
            icon={Users}
            color="purple"
            title="Đang theo dõi"
            value={stats.approved}
            note="Approved / Check-in"
          />
          <StatCard
            icon={CheckCircle2}
            color="green"
            title="Hoàn tất"
            value={stats.completed}
            note="Đã hiến xong"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {[
          "ALL",
          "PENDING",
          "APPROVED",
          "CHECKED_IN",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              filter === s
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-600 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {s === "ALL" ? "Tất cả" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <Panel>
          <div className="py-12 text-center text-sm font-semibold text-slate-400">
            Đang tải lịch hẹn...
          </div>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarIcon}
            title={tr("noAppointments")}
            description={
              isAdmin
                ? "Chưa có lịch hẹn nào trong bộ lọc hiện tại."
                : "Hãy đặt lịch hiến máu để bắt đầu hành trình của bạn."
            }
            action={
              !isAdmin && (
                <PrimaryButton onClick={handleOpenBooking}>
                  <Plus className="h-5 w-5" /> {tr("bookAppointment")}
                </PrimaryButton>
              )
            }
          />
        </Panel>
      ) : isAdmin ? (
        <Panel title="Danh sách vận hành" action={`${filtered.length} lịch`}>
          <HospitalTable
            appointments={filtered}
            onUpdate={handleStatusUpdate}
            onDetail={setDetailApp}
            tr={tr}
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app) => (
            <DonorAppointmentCard
              key={app.id}
              app={app}
              tr={tr}
              onCancel={handleCancelMine}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-600">
                  Đặt lịch hiến máu
                </p>
                <h2 className="text-xl font-black text-slate-950 dark:text-slate-50">
                  {tr("bookDonation")}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {tr("stepOf", { step })}
                </p>
              </div>
              <button
                onClick={resetModal}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-8">
              {step === 1 ? (
                <ScreeningStep
                  newApp={newApp}
                  setNewApp={setNewApp}
                  setStep={setStep}
                  tr={tr}
                  result={result}
                  eligibility={eligibility}
                  eligibilityLoading={eligibilityLoading}
                />
              ) : (
                <form
                  onSubmit={handleCreate}
                  className="mx-auto max-w-lg space-y-6"
                >
                  <AlertBanner tone="info">
                    {tr("singleHospitalBookingNote")}
                  </AlertBanner>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">
                      {tr("dateTime")}
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="datetime-local"
                        min={minDateTimeLocal()}
                        max={maxDateTimeLocal()}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        required
                        value={newApp.appointment_date}
                        onChange={(e) =>
                          setNewApp({
                            ...newApp,
                            appointment_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    {eligibility?.next_eligible_display && (
                      <p className="text-xs font-semibold text-slate-500">
                        Ngày hẹn nên từ {eligibility.next_eligible_display} trở
                        về sau.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">
                      {tr("notesOptional")}
                    </label>
                    <textarea
                      className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                      placeholder={tr("additionalInfo")}
                      value={newApp.notes}
                      onChange={(e) =>
                        setNewApp({ ...newApp, notes: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      {tr("back")}
                    </button>
                    <PrimaryButton type="submit" className="flex-[2] py-4">
                      {tr("confirmBooking")}
                    </PrimaryButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {detailApp && (
        <ScreeningDetailModal
          app={detailApp}
          tr={tr}
          lang={getLanguageForUser(user)}
          onClose={() => setDetailApp(null)}
        />
      )}
    </PageShell>
  );
}

function DonorAppointmentCard({ app, tr, onCancel }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950 dark:text-slate-50">
              {new Date(app.appointment_date).toLocaleString("vi-VN")}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Central Blood Donation Hospital
            </p>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>
      {app.notes && (
        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {app.notes}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {app.status === "COMPLETED" && (
          <Link
            to={`/congratulations/${app.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
          >
            <Award className="h-4 w-4" /> Cảm ơn bạn
          </Link>
        )}
        {["PENDING", "APPROVED"].includes(app.status) && (
          <button
            type="button"
            onClick={() => onCancel(app.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" /> Hủy lịch
          </button>
        )}
      </div>
    </article>
  );
}

function HospitalTable({ appointments, onUpdate, onDetail, tr }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400 dark:border-slate-800">
            <th className="px-4 py-3">{tr("dateTime")}</th>
            <th className="px-4 py-3">{tr("donor")}</th>
            <th className="px-4 py-3">{tr("bloodType")}</th>
            <th className="px-4 py-3">{tr("status")}</th>
            <th className="px-4 py-3 text-right">{tr("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {appointments.map((app) => (
            <tr
              key={app.id}
              className="text-sm hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
            >
              <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  {new Date(app.appointment_date).toLocaleString("vi-VN")}
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-900 dark:text-slate-50">
                  {app.donor_name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {app.donor_phone || "—"}
                </p>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-black text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {app.blood_type && app.blood_type !== "UNKNOWN"
                    ? app.blood_type
                    : "—"}
                </span>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {tr("screeningReliability")}:{" "}
                  {Math.round(app.reliability_score || 100)}%
                </p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onDetail(app)}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    title={tr("screeningFormTitle")}
                  >
                    <Eye className="h-4 w-4" /> {tr("screeningViewForm")}
                  </button>
                  <AdminActions app={app} onUpdate={onUpdate} tr={tr} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminActions({ app, onUpdate, tr }) {
  return (
    <div className="flex items-center gap-1">
      {app.status === "PENDING" && (
        <>
          <button
            onClick={() => onUpdate(app.id, "APPROVED")}
            className="rounded-xl bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
            title={tr("approve")}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdate(app.id, "CANCELLED")}
            className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
            title={tr("cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
      {app.status === "APPROVED" && (
        <button
          onClick={() => onUpdate(app.id, "CHECKED_IN")}
          className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100"
        >
          {tr("checkIn")}
        </button>
      )}
      {app.status === "CHECKED_IN" && (
        <button
          onClick={() => onUpdate(app.id, "IN_PROGRESS")}
          className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700 hover:bg-purple-100"
        >
          {tr("start")}
        </button>
      )}
      {app.status === "IN_PROGRESS" && (
        <button
          onClick={() => onUpdate(app.id, "COMPLETED")}
          className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
        >
          {tr("complete")}
        </button>
      )}
    </div>
  );
}

function ScreeningStep({
  newApp,
  setNewApp,
  setStep,
  tr,
  result,
  eligibility,
  eligibilityLoading,
}) {
  const update = (key, value) =>
    setNewApp({ ...newApp, screening: { ...newApp.screening, [key]: value } });
  const safeQuestions = [
    ["healthy", tr("screeningSafe_healthy")],
    ["ageEligible", tr("screeningSafe_ageEligible")],
  ];
  const riskQuestions = riskyKeys.map((key) => [
    key,
    tr(`screeningRisk_${key}`),
  ]);
  const nextEligibleHint = eligibility?.next_eligible_display
    ? `${tr("screeningNextEligible")}: ${eligibility.next_eligible_display}`
    : "";
  return (
    <div className="space-y-6">
      <AlertBanner tone="info">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">{tr("screeningStepTitle")}</p>
            <p className="mt-1 font-normal opacity-90">
              {tr("screeningStepHint")}
            </p>
          </div>
        </div>
      </AlertBanner>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={tr("weightKg")}
          type="number"
          value={newApp.screening.weight}
          onChange={(v) => update("weight", v)}
        />
        <ReadOnlyInfo
          label={tr("lastDonation")}
          value={
            eligibilityLoading
              ? tr("screeningChecking")
              : eligibility?.last_donation_display ||
                tr("screeningNoPriorDonation")
          }
          hint={
            eligibility?.first_time_donor
              ? tr("screeningFirstTimeDonor")
              : nextEligibleHint
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {safeQuestions.map(([key, label], idx) => (
          <CheckLine
            key={key}
            label={`${idx + 1}. ${label}`}
            checked={newApp.screening[key]}
            onChange={(v) => update(key, v)}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {riskQuestions.map(([key, label], idx) => (
          <CheckLine
            key={key}
            label={`${idx + 3}. ${label}`}
            checked={newApp.screening[key]}
            onChange={(v) => update(key, v)}
          />
        ))}
      </div>
      {!result.eligible ? (
        <AlertBanner tone="danger">
          <p className="font-black">{tr("screeningNotEligibleTitle")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-normal">
            {result.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </AlertBanner>
      ) : (
        <AlertBanner tone="success">
          <p className="font-black">{tr("screeningEligibleTitle")}</p>
          <p className="mt-1 font-normal opacity-90">
            {tr("screeningEligibleHint")}
          </p>
        </AlertBanner>
      )}
      <PrimaryButton
        type="button"
        onClick={() =>
          result.eligible && !eligibilityLoading ? setStep(2) : null
        }
        disabled={!result.eligible || eligibilityLoading}
        className="w-full py-4"
      >
        {result.eligible ? (
          <>
            {tr("nextStep")} <ChevronRight className="h-5 w-5" />
          </>
        ) : (
          tr("screeningCannotContinue")
        )}
      </PrimaryButton>
    </div>
  );
}

function ScreeningDetailModal({ app, tr, lang, onClose }) {
  const parsed = parseScreeningRaw(app.pre_screening_result);
  const view = buildScreeningViewModel(parsed, tr);
  const locale = lang === "en" ? "en-US" : "vi-VN";
  const bloodLabel =
    app.blood_type && app.blood_type !== "UNKNOWN"
      ? app.blood_type
      : tr("bloodTypeUnknown");

  const toneStyles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    danger:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
    unknown:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-slate-50">
                <FileText className="h-5 w-5 shrink-0 text-red-600" />
                {tr("screeningFormTitle")}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {tr("screeningFormSubtitle", {
                  name: app.donor_name || tr("donor"),
                  bloodType: bloodLabel,
                  dateTime: formatAppointmentDateTime(
                    app.appointment_date,
                    locale,
                  ),
                })}
              </p>
              {app.reliability_score != null && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  {tr("screeningReliability")}:{" "}
                  {Math.round(app.reliability_score)}%
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={tr("screeningClose")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {!view ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {tr("screeningNoData")}
            </p>
          ) : (
            <div className="space-y-6">
              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  {tr("screeningSectionSummary")}
                </p>
                <div
                  className={`rounded-2xl border p-4 ${toneStyles[view.eligibilityTone] || toneStyles.unknown}`}
                >
                  <p className="text-xs font-black uppercase tracking-wider opacity-80">
                    {tr("screeningPreliminaryResult")}
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {view.eligibilityLabel}
                  </p>
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  {tr("screeningSectionMetrics")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={tr("screeningWeight")}
                    value={view.weightDisplay}
                  />
                  <InfoTile
                    label={tr("screeningLastDonation")}
                    value={view.lastDonationDisplay}
                  />
                  <InfoTile
                    label={tr("screeningNextEligible")}
                    value={view.nextEligibleDisplay}
                    className="sm:col-span-2"
                  />
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  {tr("screeningSectionHealth")}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {view.safeItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <span className="pr-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${item.value === true ? "bg-emerald-100 text-emerald-700" : item.value === false ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {item.display}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  {tr("screeningSectionRisks")}
                </p>
                {view.hasRisks ? (
                  <div className="space-y-2 rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
                    <p className="mb-3 text-sm font-black text-red-700 dark:text-red-300">
                      {tr("screeningRisksDeclared", {
                        count: view.activeRisks.length,
                      })}
                    </p>
                    <ul className="space-y-2">
                      {view.activeRisks.map((risk) => (
                        <li
                          key={risk.key}
                          className="flex gap-2 text-sm font-semibold text-red-800 dark:text-red-200"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                          {risk.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    {tr("screeningNoRiskRecorded")}
                  </p>
                )}
              </section>

              <section>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  {tr("screeningSectionNote")}
                </p>
                <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                  {view.note}
                </p>
              </section>

              {view.isLegacyOnly && view.legacyRaw && (
                <section>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    {tr("screeningLegacyData")}
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">
                    {view.legacyRaw}
                  </pre>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-black dark:bg-red-600 dark:hover:bg-red-700"
          >
            {tr("screeningClose")}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
function ReadOnlyInfo({ label, value, hint }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="flex min-h-[52px] flex-col justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <span className="font-semibold text-slate-900 dark:text-slate-50">
          {value}
        </span>
        {hint && <span className="mt-1 text-xs text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}
function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function CheckLine({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
      <input
        type="checkbox"
        className="h-5 w-5 rounded-lg text-red-600 focus:ring-red-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
    </label>
  );
}
function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}
    >
      {String(status || "PENDING").replace("_", " ")}
    </span>
  );
}