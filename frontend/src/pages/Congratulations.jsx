import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Download, Heart, Home, Loader2, Share2 } from 'lucide-react';
import { appointmentService } from '../services/appointment.service';
import { authService } from '../services/auth.service';

const CONGRATS_IMAGES_COUNT = 3;

export default function Congratulations() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef(null);
  const user = authService.getCurrentUser();

  const bgImage = useMemo(() => {
    const idx = Math.floor(Math.random() * CONGRATS_IMAGES_COUNT) + 1;
    return `/images/congrats/pic${idx}.jpg`;
  }, []);

  const donorFirstName = user?.full_name?.split(' ').pop() || 'bạn';

  useEffect(() => {
    const loadCompletedAppointment = async () => {
      setLoading(true);
      try {
        const apps = await appointmentService.getMyAppointments();
        const completed = apps.filter(app => app.status === 'COMPLETED');
        const selected = appointmentId
          ? completed.find(app => String(app.id) === String(appointmentId))
          : completed[0];
        setAppointment(selected || null);
      } catch (err) {
        console.error('Failed to load completed appointment:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCompletedAppointment();
  }, [appointmentId]);

  const handleSaveImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Vẽ thẳng lên Canvas — tránh hoàn toàn oklch parsing của html2canvas
      const W = 420, H = 747; // tỉ lệ 9:16
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // 1. Load và vẽ ảnh background
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = bgImage;
      });

      // Vẽ ảnh cover vào canvas (object-fit: cover)
      const iR = img.width / img.height;
      const cR = W / H;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (iR > cR) { sw = img.height * cR; sx = (img.width - sw) / 2; }
      else { sh = img.width / cR; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      // 2. Overlay gradient
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0.88)');
      grad.addColorStop(0.3, 'rgba(0,0,0,0.55)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Helper vẽ dòng chữ mixed color căn giữa
      const drawMixedLine = (parts, y) => {
        // parts: [{text, color, weight}]
        ctx.textAlign = 'left';
        const totalW = parts.reduce((acc, p) => {
          ctx.font = `${p.weight || 500} 17px sans-serif`;
          return acc + ctx.measureText(p.text).width;
        }, 0);
        let x = (W - totalW) / 2;
        parts.forEach(p => {
          ctx.font = `${p.weight || 500} 17px sans-serif`;
          ctx.fillStyle = p.color || '#ffffff';
          ctx.fillText(p.text, x, y);
          x += ctx.measureText(p.text).width;
        });
      };

      // 3. "DONATION COMPLETED"
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '700 11px sans-serif';
      ctx.fillText('DONATION  COMPLETED', W / 2, H - 200);

      // 4. Dòng 1 — tên vàng
      drawMixedLine([
        { text: 'Tụi con cảm ơn cô/chú ', color: '#ffffff', weight: 500 },
        { text: donorFirstName, color: '#fde047', weight: 900 },
        { text: ' nhiều lắm ạ ', color: '#ffffff', weight: 500 },
      ], H - 165);

      // 5. Dòng 2
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 15px sans-serif';
      ctx.fillText('Nhờ cô/chú mà sẽ có những bạn nhỏ giống tụi con', W / 2, H - 132);
      ctx.fillText('được khỏe hơn và có thêm cơ hội để về nhà với ba mẹ.', W / 2, H - 108);

      // 6. Dòng 3 màu hồng
      ctx.fillStyle = '#f9a8d4';
      ctx.font = '700 16px sans-serif';
      ctx.fillText('Tụi con thương cô/chú nhiều lắm! ', W / 2, H - 70);

      // Tải về
      await new Promise(resolve => {
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = `SBDCs-cam-on-${donorFirstName}-${Date.now()}.png`;
          a.href = url;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); resolve(); }, 200);
        }, 'image/png');
      });
    } catch (err) {
      console.error('Save image failed:', err);
      alert('Không thể lưu ảnh. Vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Đang chuẩn bị lời cảm ơn...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-lg text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-4">Chưa có lần hiến nào hoàn tất</h1>
          <p className="text-gray-500 mt-2">Trang cảm ơn sẽ xuất hiện sau khi lịch hẹn của bạn được đánh dấu hoàn tất.</p>
          <Link to="/appointments" className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">
            Xem lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] animate-in fade-in duration-500 flex flex-col gap-4">

      {/* Wrapper khung ngoài */}
      <div className="mx-auto w-full" style={{ maxWidth: '460px' }}>
        {/* Khung trang trí SVG bao ngoài card */}
        <div className="relative p-[14px]" style={{
          background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f6 50%, #fff8f0 100%)',
          borderRadius: '2.5rem',
          boxShadow: '0 0 0 2px #fca5a5, 0 0 0 5px #fff, 0 0 0 7px #fda4af, 0 8px 40px rgba(239,68,68,0.13)',
        }}>

          {/* Góc trang trí — trái trên */}
          <svg className="absolute top-3 left-3 w-12 h-12 opacity-60" viewBox="0 0 48 48" fill="none">
            <path d="M4 44 C4 24 24 4 44 4" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M4 36 C4 20 20 4 36 4" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" fill="none"/>
            <circle cx="6" cy="6" r="3" fill="#f43f5e" opacity="0.5"/>
            <circle cx="16" cy="4" r="1.5" fill="#fda4af"/>
            <circle cx="4" cy="16" r="1.5" fill="#fda4af"/>
          </svg>

          {/* Góc trang trí — phải trên */}
          <svg className="absolute top-3 right-3 w-12 h-12 opacity-60" viewBox="0 0 48 48" fill="none" style={{ transform: 'scaleX(-1)' }}>
            <path d="M4 44 C4 24 24 4 44 4" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M4 36 C4 20 20 4 36 4" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" fill="none"/>
            <circle cx="6" cy="6" r="3" fill="#f43f5e" opacity="0.5"/>
            <circle cx="16" cy="4" r="1.5" fill="#fda4af"/>
            <circle cx="4" cy="16" r="1.5" fill="#fda4af"/>
          </svg>

          {/* Góc trang trí — trái dưới */}
          <svg className="absolute bottom-3 left-3 w-12 h-12 opacity-60" viewBox="0 0 48 48" fill="none" style={{ transform: 'scaleY(-1)' }}>
            <path d="M4 44 C4 24 24 4 44 4" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M4 36 C4 20 20 4 36 4" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" fill="none"/>
            <circle cx="6" cy="6" r="3" fill="#f43f5e" opacity="0.5"/>
          </svg>

          {/* Góc trang trí — phải dưới */}
          <svg className="absolute bottom-3 right-3 w-12 h-12 opacity-60" viewBox="0 0 48 48" fill="none" style={{ transform: 'scale(-1,-1)' }}>
            <path d="M4 44 C4 24 24 4 44 4" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M4 36 C4 20 20 4 36 4" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" fill="none"/>
            <circle cx="6" cy="6" r="3" fill="#f43f5e" opacity="0.5"/>
          </svg>

          {/* Tim nhỏ trang trí dọc 2 bên */}
          {[25, 50, 75].map(pct => (
            <React.Fragment key={pct}>
              <div className="absolute left-2 text-rose-300 text-xs opacity-50" style={{ top: `${pct}%` }}>♥</div>
              <div className="absolute right-2 text-rose-300 text-xs opacity-50" style={{ top: `${pct}%` }}>♥</div>
            </React.Fragment>
          ))}

          {/* Card ảnh chính */}
          <div
            ref={cardRef}
            className="relative overflow-hidden w-full"
            style={{
              backgroundImage: `url('${bgImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              aspectRatio: '9 / 16',
              borderRadius: '1.75rem',
            }}
          >
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, transparent 60%)' }} />

            {/* Icon tim nhỏ góc trên */}
            <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', opacity: 0.7 }}>
              <Heart style={{ width: 24, height: 24, fill: 'white', color: 'white' }} />
            </div>

            {/* Thư cảm ơn */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', paddingTop: '2rem', textAlign: 'center', color: '#ffffff' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>Donation Completed</p>
              <div style={{ lineHeight: 1.7, fontSize: '16px', fontWeight: 500, textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>
                <p style={{ color: '#ffffff' }}>Tụi con cảm ơn cô/chú <span style={{ fontWeight: 900, color: '#fde047' }}>{donorFirstName}</span> nhiều lắm ạ 🌸</p>
                <p style={{ marginTop: '8px', color: '#ffffff' }}>Nhờ cô/chú mà sẽ có những bạn nhỏ giống tụi con được khỏe hơn và có thêm cơ hội để về nhà với ba mẹ.</p>
                <p style={{ marginTop: '8px', fontWeight: 700, color: '#f9a8d4' }}>Tụi con thương cô/chú nhiều lắm! 💛</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Nút điều hướng + lưu ảnh — nằm ngoài card để không bị chụp vào ảnh */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
        <button
          onClick={handleSaveImage}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 transition-colors shadow disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
            : <><Download className="w-4 h-4" /> Lưu ảnh kỷ niệm</>
          }
        </button>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow"
        >
          <Home className="w-4 h-4" /> Về trang chủ
        </Link>

        <Link
          to="/appointments"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Xem lịch sử hiến máu
        </Link>
      </div>

    </div>
  );
}
