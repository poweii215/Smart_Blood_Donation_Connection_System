import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Droplets,
  HeartHandshake,
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { authService } from "../services/auth.service";
import { getScopedSetting, setScopedSetting, labels } from "../utils/userSettings";

const DEFAULT_MEDIA = {
  hospital_image_url: "/images/hospital-showcase.svg",
  donor_activity_image_url: "/images/donor-activity.svg",
  hospital_title: "SBDCs Blood Donation Center",
  hospital_subtitle: "Kết nối hiến máu nhân đạo an toàn và thông minh",
};

export default function Login() {
  const [guestLang, setGuestLang] = useState(() =>
    getScopedSetting("language", "vi", null),
  );
  const [portal, setPortal] = useState("DONOR");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [homepageMedia, setHomepageMedia] = useState(DEFAULT_MEDIA);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    authService
      .getHomepageMedia()
      .then((data) => {
        if (mounted && data) {
          setHomepageMedia((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const hospitalName =
    homepageMedia.hospital_title || DEFAULT_MEDIA.hospital_title;
  const hospitalSubtitle =
    homepageMedia.hospital_subtitle || DEFAULT_MEDIA.hospital_subtitle;

  const changeGuestLanguage = (lang) => {
    setGuestLang(lang);
    setScopedSetting("language", lang, null);
  };

  const switchPortal = (next) => {
    setPortal(next);
    setError("");
    setPhone("");
    setIdentifier("");
    setPassword("");
    document
      .getElementById("login")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (portal === "DONOR") {
        await authService.login({ login_type: "DONOR", phone });
      } else {
        await authService.login({
          login_type: "HOSPITAL_ADMIN",
          identifier,
          password,
        });
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        icon: CheckCircle2,
        value: "420+",
        label: "Lượt hiến được ghi nhận",
        desc: "Dữ liệu theo hoạt động demo của hệ thống",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        icon: Users,
        value: "120+",
        label: "Người hiến đang quản lý",
        desc: "Cộng đồng hiến máu được kết nối",
        color: "text-sky-600",
        bg: "bg-sky-50",
      },
      {
        icon: CalendarCheck,
        value: "24+",
        label: "Lịch hẹn đã xử lý",
        desc: "Tính dữ liệu thử nghiệm 24 giờ qua",
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
    ],
    [],
  );

  const processSteps = guestLang === 'en' ? [
    ["01", "Login / Create Profile", "Your phone number opens a donor profile instantly."],
    ["02", "Check Eligibility", "The system checks age, weight, donation cycle, and health data."],
    ["03", "Book in Advance", "Choose a convenient time to save time at the hospital."],
    ["04", "Visit Hospital", "Bring your ID and complete the final medical screening."],
  ] : [
    ["01", "Đăng nhập/Tạo hồ sơ", "Số điện thoại giúp mở hồ sơ người hiến nhanh chóng."],
    ["02", "Kiểm tra điều kiện", "Hệ thống kiểm tra tuổi, cân nặng, chu kỳ hiến và dữ liệu sức khỏe."],
    ["03", "Đặt lịch trước", "Chọn thời gian phù hợp để tiết kiệm thời gian khi đến bệnh viện."],
    ["04", "Đến bệnh viện", "Mang giấy tờ tùy thân và hoàn tất sàng lọc y tế cuối cùng."],
  ];

  const benefitItems = guestLang === 'en' ? [
    [HeartPulse, "Save Lives", "One unit of blood can support treatment for multiple patients in need."],
    [Activity, "Free Health Check", "Get a health consultation and screening tests before donating."],
    [HeartHandshake, "Create Humanitarian Impact", "Every donation helps maintain a safe blood supply for the community."],
  ] : [
    [HeartPulse, "Cứu sống mạng người", "Một đơn vị máu có thể hỗ trợ điều trị cho nhiều bệnh nhân cần truyền máu."],
    [Activity, "Kiểm tra sức khỏe miễn phí", "Được khám, tư vấn sức khỏe và làm các xét nghiệm sàng lọc trước khi hiến."],
    [HeartHandshake, "Tạo tác động nhân văn", "Mỗi lần hiến máu góp phần duy trì nguồn máu an toàn cho cộng đồng."],
  ];

  const avoidItems = guestLang === 'en' ? [
    [XCircle, "Don't skip meals", "Have a light meal before visiting. Avoid fatty foods."],
    [XCircle, "Don't stay up late", "Get enough sleep so your body recovers well."],
    [XCircle, "No alcohol", "Avoid alcohol before your donation day."],
    [XCircle, "Avoid strenuous activity", "Rest and drink enough water after donating."],
  ] : [
    [XCircle, "Không để bụng đói", "Ăn nhẹ trước khi đến, tránh đồ ăn nhiều dầu mỡ."],
    [XCircle, "Không thức khuya", "Nên ngủ đủ giấc để cơ thể phục hồi tốt."],
    [XCircle, "Không uống rượu bia", "Tránh rượu bia trước ngày hiến máu."],
    [XCircle, "Tránh vận động mạnh", "Sau khi hiến nên nghỉ ngơi và uống đủ nước."],
  ];

  const eligibilityItems = guestLang === 'en' ? [
    "Healthy and fully voluntary.",
    "Age 18–60.",
    "Weight: female ≥ 42 kg, male ≥ 45 kg.",
    "Hemoglobin ≥ 120 g/L.",
    "No risk behaviors for HIV, Hepatitis B/C, or syphilis.",
    "At least 12 weeks since last whole blood donation.",
    "Women not pregnant or nursing a child under 1 year old.",
    "Bring national ID, passport, driver's license, or VNeID level 2.",
    "45–50 kg may donate 350 ml; 50 kg and above may donate 450 ml.",
  ] : [
    "Người khỏe mạnh, hoàn toàn tự nguyện hiến máu.",
    "Tuổi từ 18–60.",
    "Cân nặng: nữ ≥ 42kg, nam ≥ 45kg.",
    "Huyết sắc tố ≥ 120 g/l.",
    "Không có hành vi nguy cơ lây nhiễm HIV, viêm gan B/C, giang mai.",
    "Đã hiến máu toàn phần trước đó tối thiểu 12 tuần.",
    "Phụ nữ không mang thai hoặc nuôi con nhỏ dưới 1 tuổi.",
    "Mang CCCD, hộ chiếu, GPLX hoặc VNeID mức 2.",
    "45–50kg có thể hiến 350ml; từ 50kg trở lên có thể hiến 450ml.",
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <Header
        guestLang={guestLang}
        changeGuestLanguage={changeGuestLanguage}
        switchPortal={switchPortal}
      />

      {/* Desktop: login cố định bên phải, phần còn lại cuộn */}
      <aside
        className="fixed inset-y-0 right-0 z-20 hidden w-[288px] lg:block"
        aria-label="Đăng nhập"
      >
        <div className="flex h-full items-start justify-center overflow-y-auto px-4 pb-8 pt-24">
          <LoginCard
            portal={portal}
            phone={phone}
            setPhone={setPhone}
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            handleLogin={handleLogin}
            switchPortal={switchPortal}
            variant="fixed"
            guestLang={guestLang}
          />
        </div>
      </aside>

      <main className="lg:mr-[288px]">
        <section id="home" className="relative overflow-hidden bg-[#f6f8fb]">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] lg:items-center lg:px-8">
            <div className="flex min-h-[360px] items-center rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 md:p-8">
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600 ring-1 ring-red-100">
                  <Sparkles className="h-4 w-4" />
                  {labels[guestLang]?.heroBadge || labels.vi.heroBadge}
                </div>

                <h1 className="text-4xl font-black leading-[1.06] tracking-tight text-slate-950 md:text-5xl xl:text-6xl">
                  {labels[guestLang]?.heroTitleLine1 || labels.vi.heroTitleLine1}
                  <br />
                  <span className="text-red-600">{labels[guestLang]?.heroTitleLine2 || labels.vi.heroTitleLine2}</span>
                </h1>

                <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 md:text-base">
                  {labels[guestLang]?.heroCopy || labels.vi.heroCopy}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => switchPortal("DONOR")}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700"
                  >
                    {labels[guestLang]?.donateNow || labels.vi.donateNow} <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#process"
                    className="inline-flex items-center rounded-xl border border-red-100 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition hover:bg-red-50"
                  >
                    {labels[guestLang]?.viewProcess || labels.vi.viewProcess}
                  </a>
                </div>
              </div>
            </div>

            <div id="login" className="space-y-6">
              {/* Khung ảnh bệnh viện — đẹp hơn */}
              <div style={{
                padding: '3px',
                borderRadius: '2rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ec4899 100%)',
                boxShadow: '0 20px 60px rgba(239,68,68,0.18), 0 4px 16px rgba(0,0,0,0.08)',
              }}>
                <div style={{ borderRadius: 'calc(2rem - 3px)', background: '#fff', padding: '10px' }}>
                  <div className="relative w-full overflow-hidden" style={{ borderRadius: '1.5rem' }}>

                    {/* Ảnh chính */}
                    <img
                      src={homepageMedia.hospital_image_url || DEFAULT_MEDIA.hospital_image_url}
                      alt="Đội ngũ tiếp nhận hiến máu"
                      className="h-[430px] w-full object-cover lg:h-[380px]"
                      style={{ borderRadius: '1.5rem', display: 'block' }}
                    />

                    {/* Overlay gradient nhẹ phía dưới */}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '1.5rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
                    }} />

                    {/* Badge góc trên trái */}
                    <div style={{
                      position: 'absolute', top: 14, left: 14,
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '999px',
                      padding: '5px 12px',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: '0.05em' }}>{guestLang === 'en' ? 'BLOOD DONATION' : 'HIẾN MÁU CỨU NGƯỜI'}</span>
                    </div>

                    {/* Info box phía dưới */}
                    <div style={{
                      position: 'absolute', bottom: 14, left: 14, right: 14,
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '1rem',
                      padding: '12px 16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #ef4444, #f97316)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: 0 }}>{hospitalName}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', margin: '2px 0 0' }}>{hospitalSubtitle}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <LoginCard
                  portal={portal}
                  phone={phone}
                  setPhone={setPhone}
                  identifier={identifier}
                  setIdentifier={setIdentifier}
                  password={password}
                  setPassword={setPassword}
                  loading={loading}
                  error={error}
                  handleLogin={handleLogin}
                  switchPortal={switchPortal}
                  variant="inline"
                  guestLang={guestLang}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-3 lg:px-8">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white p-7 text-center shadow-xl shadow-slate-200/70 ring-1 ring-slate-100"
              >
                <div
                  className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <p className={`text-xl font-black ${item.color}`}>
                  {item.value}
                </p>
                <p className="mt-2 font-black text-slate-950">{item.label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="process" className="bg-[#f7f8fa] py-16">
          <SectionTitle
            title={labels[guestLang]?.simpleProcess || labels.vi.simpleProcess}
            subtitle={guestLang === 'en' ? 'Simple, transparent and saves you time when visiting the hospital.' : 'Đơn giản, minh bạch và giúp bạn tiết kiệm thời gian khi đến bệnh viện.'}
          />
          <div className="mx-auto mt-10 grid max-w-7xl gap-5 px-5 md:grid-cols-4 lg:px-8">
            {processSteps.map(([step, title, desc]) => (
              <div
                key={step}
                className="relative rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100"
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 bg-white text-sm font-black text-red-600">
                  {step}
                </div>
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="benefits" className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
            <div style={{
              padding: '3px',
              borderRadius: '2rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ec4899 100%)',
              boxShadow: '0 20px 60px rgba(239,68,68,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            }}>
              <div style={{ borderRadius: 'calc(2rem - 3px)', background: '#fff', padding: '10px' }}>
                <div className="relative w-full overflow-hidden" style={{ borderRadius: '1.5rem' }}>
                  <img
                    src={homepageMedia.donor_activity_image_url || DEFAULT_MEDIA.donor_activity_image_url}
                    alt="Hoạt động hiến máu"
                    className="h-[360px] w-full object-cover"
                    style={{ borderRadius: '1.5rem', display: 'block' }}
                  />
                  {/* Overlay gradient nhẹ phía dưới */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '1.5rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 55%)',
                  }} />
                  {/* Badge góc trên trái */}
                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '999px',
                    padding: '5px 12px',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: '0.05em' }}>{labels[guestLang]?.peopleDonatingToday || labels.vi.peopleDonatingToday}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-950">
                {guestLang === 'en' ? 'Benefits & Humanitarian Values' : 'Lợi ích & Giá trị nhân văn'}
              </h2>
              <div className="mt-4 space-y-3">
                {benefitItems.map(([Icon, title, desc]) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-950">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f2f4] py-16">
          <SectionTitle
            title={guestLang === 'en' ? 'Before & After Donation Tips' : 'Cần tránh trước & sau khi hiến'}
            subtitle={guestLang === 'en' ? 'Ensure your safety and improve blood donation quality.' : 'Đảm bảo cơ thể an toàn và chất lượng máu hiến tốt hơn.'}
          />
          <div className="mx-auto mt-9 grid max-w-7xl gap-5 px-5 md:grid-cols-4 lg:px-8">
            {avoidItems.map(([Icon, title, desc]) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100"
              >
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="bg-[#f6f8fb] py-16">
          <SectionTitle
            title={guestLang === 'en' ? 'Who Can Donate?' : 'Ai có thể hiến máu?'}
            subtitle={guestLang === 'en' ? 'Basic requirements for whole blood donation. Always follow medical staff advice.' : 'Điều kiện cơ bản cho người hiến máu toàn phần, vui lòng tuân thủ tư vấn của nhân viên y tế.'}
          />
          <div className="mx-auto mt-9 grid max-w-7xl gap-5 px-5 md:grid-cols-3 lg:px-8">
            {eligibilityItems.map((text) => (
              <div
                key={text}
                className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100"
              >
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Footer
          hospitalName={hospitalName}
          hospitalSubtitle={hospitalSubtitle}
          guestLang={guestLang}
        />
      </main>
    </div>
  );
}

function Header({ guestLang, changeGuestLanguage, switchPortal }) {
  const [activeSection, setActiveSection] = useState("home");

  const navItems = [
    { labelVi: "Trang chủ", labelEn: "Home", id: "home" },
    { labelVi: "Quy trình", labelEn: "Process", id: "process" },
    { labelVi: "Lợi ích", labelEn: "Benefits", id: "benefits" },
    { labelVi: "Điều kiện", labelEn: "About", id: "about" },
  ];

  const handleNavClick = (id) => {
    setActiveSection(id);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-100">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">SBDCs</p>
            <p className="hidden text-[10px] font-bold text-slate-400 sm:block">
              Smart Blood Donation Connection
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-xs font-black text-slate-500 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`transition ${
                activeSection === item.id
                  ? "text-red-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {guestLang === 'en' ? item.labelEn : item.labelVi}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <select
            value={guestLang}
            onChange={(e) => changeGuestLanguage(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600"
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
          <button
            onClick={() => switchPortal("DONOR")}
            className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-red-100 hover:bg-red-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </header>
  );
}

function LoginCard({
  portal,
  phone,
  setPhone,
  identifier,
  setIdentifier,
  password,
  setPassword,
  loading,
  error,
  handleLogin,
  switchPortal,
  variant = "inline",
  guestLang = "vi",
}) {
  const isDonor = portal === "DONOR";
  const isFixed = variant === "fixed";
  return (
    <div
      className={`mx-auto flex w-full flex-col rounded-[1.5rem] bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 ${
        isFixed ? "min-h-[520px] max-w-[268px] px-4 py-7" : "max-w-[300px] p-5"
      }`}
    >
      <div className="text-center">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg ${isDonor ? "text-red-600" : "text-sky-500"}`}
        >
          {isDonor ? (
            <Droplets className="h-6 w-6" />
          ) : (
            <ShieldCheck className="h-6 w-6" />
          )}
        </div>
        <h2
          className={`text-lg font-black ${isDonor ? "text-red-600" : "text-sky-600"}`}
        >
          {isDonor ? (guestLang === 'en' ? "DONOR PORTAL" : "CỔNG NGƯỜI HIẾN") : (guestLang === 'en' ? "HOSPITAL PORTAL" : "CỔNG BỆNH VIỆN")}
        </h2>
        <p className="mt-1.5 text-xs font-bold leading-5 text-slate-500">
          {isDonor
            ? (guestLang === "en" ? "Quick login with phone number" : "Đăng nhập nhanh bằng số điện thoại")
            : (guestLang === "en" ? "Account issued by the hospital" : "Tài khoản do bệnh viện/hệ thống cấp")}
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className={`mt-4 flex flex-1 flex-col ${isFixed ? "space-y-3" : "space-y-2.5"}`}
      >
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {isDonor ? (
          <div>
            <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
              {guestLang === "en" ? "Phone Number" : "Số điện thoại"}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=".................................."
                required
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 ${isFixed ? "py-3" : "py-2.5"}`}
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                Email hoặc số điện thoại
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder=".............................."
                  required
                  className={`w-full rounded-xl border border-slate-200 bg-sky-50 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 ${isFixed ? "py-3" : "py-2.5"}`}
                />
              </div>
            </div>
            <div>
              <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="................................."
                  required
                  className={`w-full rounded-xl border border-slate-200 bg-sky-50 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 ${isFixed ? "py-3" : "py-2.5"}`}
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white shadow-xl transition disabled:opacity-50 ${isFixed ? "py-3.5" : "py-3"} ${isDonor ? "bg-red-600 shadow-red-200 hover:bg-red-700" : "bg-sky-500 shadow-sky-200 hover:bg-sky-600"}`}
        >
          {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <div className={`space-y-3 text-center ${isFixed ? "mt-5" : "mt-4"}`}>
        {isDonor ? (
          <>
            <button
              type="button"
              onClick={() => switchPortal("HOSPITAL_ADMIN")}
              className="w-full rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-black text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-200"
            >
              Dành cho bệnh viện
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => switchPortal("DONOR")}
            className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
          >
            Quay lại cổng người hiến
          </button>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl px-5 text-center">
      <h2 className="text-3xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

function Footer({ hospitalName, hospitalSubtitle, guestLang = "vi" }) {
  return (
    <footer className="bg-slate-200/80 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-black text-slate-950">Bệnh viện chủ quản</p>
          <p className="mt-3 text-sm font-bold text-red-600">{hospitalName}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {hospitalSubtitle}
          </p>
        </div>
        <div>
          <p className="font-black text-red-600">SBDCs</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Hệ thống hỗ trợ quản lý hiến máu một bệnh viện, kết nối người hiến
            đúng thời điểm.
          </p>
        </div>
        <div>
          <p className="font-black text-slate-950">Khám phá</p>
          <div className="mt-3 space-y-2 text-sm font-semibold text-slate-500">
            <a className="block" href="#process">
              Quy trình đăng ký hiến máu
            </a>
            <a className="block" href="#benefits">
              Lợi ích hiến máu
            </a>
            <a className="block" href="#about">
              Câu hỏi thường gặp
            </a>
          </div>
        </div>
        <div>
          <p className="font-black text-slate-950">Liên hệ</p>
          <div className="mt-3 space-y-2 text-sm font-semibold text-slate-500">
            <p className="flex gap-2">
              <MapPin className="h-4 w-4 text-red-500" />P Chợ Lớn,TP.HCM
            </p>
            <p className="flex gap-2">
              <PhoneCall className="h-4 w-4 text-red-500" /> 0900000001
            </p>
            <p className="flex gap-2">
              <Mail className="h-4 w-4 text-red-500" /> hospital@sbdcs.com
            </p>
          </div>
        </div>
      </div>
      <p className="mt-10 text-center text-xs font-semibold text-slate-400">
        © 2026 SBDCs - {guestLang === 'en' ? 'Smart Blood Donation Connection System.' : 'Hệ thống kết nối hiến máu thông minh.'}
      </p>
    </footer>
  );
}