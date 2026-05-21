import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';

export default function Reports() {
  const [exportStatus, setExportStatus] = useState('ALL');
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10));

  const downloadExcel = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      if (exportStatus === 'DONORS') {
        const blob = await analyticsService.exportDonors();
        downloadExcel(blob, `donor_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
        return;
      }
      const blob = await analyticsService.exportTodayAppointments({ status: exportStatus, report_date: exportDate });
      downloadExcel(blob, `appointments_${exportDate}_${exportStatus.toLowerCase()}.xlsx`);
    } catch (err) {
      console.error('Failed to export excel', err);
      alert('Không thể xuất file Excel. Vui lòng thử lại.');
    }
  };

  return <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-green-700 mb-3"><FileSpreadsheet className="w-4 h-4" /> Reports</div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Export Reports</h1>
      <p className="text-gray-500 mt-1">Chọn đúng loại danh sách cần xuất thay vì xuất toàn bộ một lần.</p>
    </header>

    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4 items-end">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ngày</label>
          <input
            type="date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
            disabled={exportStatus === 'DONORS'}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Loại danh sách</label>
          <select
            value={exportStatus}
            onChange={(e) => setExportStatus(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-red-400"
          >
            <option value="ALL">Tất cả lịch trong ngày</option>
            <option value="EXPECTED">Người dự kiến đến</option>
            <option value="ARRIVED">Người đã đến</option>
            <option value="ACTIVE">Đang ở bệnh viện</option>
            <option value="DONE">Đã hiến xong</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="IN_PROGRESS">Đang hiến</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã huỷ</option>
            <option value="DONORS">Danh sách người hiến</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>
    </section>
  </div>;
}
