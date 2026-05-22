import { useEffect, useState } from 'react';
import { authService } from '../services/auth.service';

export function getSettingsScope(user = authService.getCurrentUser()) {
  if (!user) return 'guest';
  const role = user.role || 'USER';
  const identity = user.id || user.phone || user.email || 'unknown';
  return `${role}_${identity}`;
}

export function scopedKey(key, user = authService.getCurrentUser()) {
  return `setting_${getSettingsScope(user)}_${key}`;
}

export function getScopedSetting(key, fallback, user = authService.getCurrentUser()) {
  const raw = localStorage.getItem(scopedKey(key, user));
  if (raw === null || raw === undefined) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

export function setScopedSetting(key, value, user = authService.getCurrentUser()) {
  localStorage.setItem(scopedKey(key, user), String(value));
  window.dispatchEvent(new CustomEvent('sbdcs-settings-changed', { detail: { key, value, scope: getSettingsScope(user) } }));
}

export function applyAppearanceForUser(user = authService.getCurrentUser()) {
  const mode = getScopedSetting('appearance', 'light', user);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', shouldUseDark);
  return mode;
}

export function getLanguageForUser(user = authService.getCurrentUser()) {
  return getScopedSetting('language', 'vi', user);
}

export const labels = {
  vi: {
    appSubtitle: 'Hệ thống hiến máu một bệnh viện',
    dashboard: 'Tổng quan', appointments: 'Lịch hẹn', inventory: 'Kho máu', recommendation: 'Khuyến nghị', reports: 'Báo cáo', assistant: 'Trợ lý thông minh', settings: 'Cài đặt', logout: 'Đăng xuất',
    hospitalDashboard: 'Bảng điều khiển bệnh viện', donorDashboard: 'Bảng điều khiển người hiến', hospitalSubtitle: 'Tổng quan hoạt động hôm nay', donorSubtitle: 'Hành trình hiến máu của bạn', hospital: 'Bệnh viện', donor: 'Người hiến', hospitalAdmin: 'Quản trị bệnh viện',
    loadingDashboard: 'Đang tải bảng điều khiển...', emergencyAlert: 'Cảnh báo khẩn cấp', bloodTypeCritical: 'Nhóm máu {bloodType} đang ở mức nguy cấp!', emergencyHint: 'Vui lòng ưu tiên người hiến nhóm {bloodType} và kiểm tra tab Khuyến nghị.', viewDetails: 'Xem chi tiết',
    todayAppointments: 'Lịch hẹn hôm nay', totalDonations: 'Tổng lượt hiến', totalDonors: 'Tổng người hiến', activeDonors: 'Người hiến đang hoạt động', pendingToday: '{count} lịch đang chờ hôm nay', completedRecords: 'hồ sơ đã hoàn tất', registeredDonors: 'người hiến đã đăng ký', availableRecommendation: 'sẵn sàng để khuyến nghị',
    time: 'Thời gian', bloodType: 'Nhóm máu', status: 'Trạng thái', actions: 'Thao tác', dateTime: 'Ngày & giờ', inStock: 'Tồn kho', inventoryStatus: 'Trạng thái kho máu', inventoryOverview: 'Tổng quan kho máu', total: 'Tổng', units: 'Đơn vị', adequate: 'An toàn', low: 'Thấp', critical: 'Nguy cấp', noAppointments: 'Chưa có lịch hẹn.',
    donationImpactMessage: 'Thông điệp ý nghĩa hiến máu', helloUser: 'Xin chào, {name}!', defaultImpact: 'Một lần hiến máu có thể giúp cứu sống tới 3 người. Cảm ơn bạn vì nghĩa cử nhân đạo này.', humanitarianPoints: 'Điểm nhân đạo', donorContribution: 'đóng góp của người hiến', eligibleAgainIn: 'Đủ điều kiện lại sau', days: 'ngày', cycle84: 'chu kỳ 84 ngày', completedDonations: 'Lượt hiến hoàn tất', successfulDonations: 'lượt hiến thành công', livesImpacted: 'Số mạng sống hỗ trợ', estimatedImpact: 'ước tính tác động', eligibilityCountdown: 'Đếm ngược đủ điều kiện', recoveryProgress: 'Tiến trình phục hồi', eligibleNow: 'Bạn hiện đã đủ điều kiện thời gian để đăng ký hiến máu tiếp theo.', eligibleLater: 'Còn {days} ngày để đủ điều kiện thời gian hiến tiếp theo.', recentAppointments: 'Lịch hẹn gần đây',
    settingsCenter: 'Trung tâm cài đặt', systemSettings: 'Cài đặt hệ thống', settingsIntro: 'Quản lý hồ sơ cá nhân, thông báo, ngôn ngữ, giao diện và cấu hình theo từng tài khoản.', settingsScope: 'Cài đặt đang lưu riêng cho: {role}', saveAllSettings: 'Lưu toàn bộ cài đặt', savedHospital: 'Đã lưu cấu hình riêng cho Bệnh viện!', savedDonor: 'Đã lưu cấu hình riêng cho Người hiến!', personalInformation: 'Thông tin cá nhân', personalInfoDesc: 'Thông tin định danh cơ bản dùng trong quy trình hiến máu.', chooseImage: 'Chọn ảnh', saveImage: 'Lưu ảnh', uploading: 'Đang tải...', avatarHelp: 'Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 3MB.', validImage: 'Vui lòng chọn file ảnh hợp lệ.', avatarTooLarge: 'Ảnh đại diện không được vượt quá 3MB.', avatarUpdated: 'Đã cập nhật ảnh đại diện!', avatarFailed: 'Không thể cập nhật ảnh đại diện.', profileUpdated: 'Đã cập nhật thông tin cá nhân!', profileFailed: 'Không thể cập nhật thông tin.', phoneLoginReason: 'Người hiến chỉ dùng số điện thoại để giảm thủ tục và khuyến khích tham gia nhanh hơn.', fullName: 'Họ tên', phone: 'Số điện thoại', unknown: 'Chưa xác định', savePersonalInfo: 'Lưu thông tin cá nhân', saving: 'Đang lưu...',
    notificationSettings: 'Cài đặt thông báo', notificationDesc: 'Kiểm soát các loại thông báo hệ thống.', emergencyBloodAlerts: 'Cảnh báo thiếu máu khẩn cấp', appointmentReminders: 'Nhắc lịch hẹn', donationCampaignMessages: 'Thông báo chiến dịch hiến máu', donationPreferences: 'Tùy chọn hiến máu', donationPreferencesDesc: 'Thiết lập mức sẵn sàng tham gia hiến máu.', readyToDonate: 'Sẵn sàng hiến khi cần', reminderBeforeAppointment: 'Nhắc trước lịch hẹn', noReminder: 'Không nhắc', oneDayBefore: 'Trước 1 ngày', twoDaysBefore: 'Trước 2 ngày', threeDaysBefore: 'Trước 3 ngày', systemPreferences: 'Tùy chọn hệ thống', systemPreferencesDesc: 'Tùy chỉnh trải nghiệm sử dụng.', language: 'Ngôn ngữ', appearance: 'Giao diện', defaultExportFormat: 'Định dạng xuất mặc định', lightMode: 'Chế độ sáng', darkMode: 'Chế độ tối', systemDefault: 'Theo hệ thống',
    emergencyThreshold: 'Ngưỡng khẩn cấp', emergencyThresholdDesc: 'Cấu hình ngưỡng kích hoạt cảnh báo thiếu máu.', criticalThresholdRatio: 'Tỷ lệ ngưỡng nguy cấp', warningThresholdRatio: 'Tỷ lệ ngưỡng cảnh báo', criticalHint: 'Ví dụ 0.5 nghĩa là tồn kho dưới 50% safety stock sẽ Nguy cấp.', warningHint: 'Ví dụ 0.8 nghĩa là tồn kho dưới 80% safety stock sẽ Cảnh báo.', recommendationWeights: 'Trọng số khuyến nghị', recommendationWeightsDesc: 'Trọng số heuristic dùng để xếp hạng người hiến. Tổng nên xấp xỉ 1.00.', totalWeightNow: 'Tổng trọng số hiện tại: {total}', bloodMatch: 'Tương thích nhóm máu', eligibility: 'Đủ điều kiện', reliability: 'Độ tin cậy', humanitarianPointsLabel: 'Điểm nhân đạo', emergencyWeightHint: 'Khi bật Emergency Mode, hệ thống có thể tăng ưu tiên tương thích nhóm máu để huy động đúng nhóm máu đang thiếu.',
    bookAppointment: 'Đặt lịch hiến máu', scheduleDesc: 'Quản lý lịch hẹn cho một bệnh viện. Không dùng bản đồ, không đặt khoảng cách làm rào cản.', hospitalColumn: 'Bệnh viện', congratulations: 'Chúc mừng', awaitingApproval: 'Chờ duyệt', noActions: 'Không có thao tác', bookDonation: 'Đặt lịch hiến máu', stepOf: 'Bước {step}/2', singleHospitalBookingNote: 'Bạn đang đặt lịch tại Central Blood Donation Hospital. Hệ thống bỏ chọn điểm gần nhất để tập trung vào tinh thần tự nguyện.', notesOptional: 'Ghi chú (tuỳ chọn)', additionalInfo: 'Thông tin bổ sung?', back: 'Quay lại', confirmBooking: 'Xác nhận đặt lịch', selectDateAlert: 'Vui lòng chọn ngày giờ hẹn', createAppointmentFailed: 'Không thể tạo lịch hẹn', updateStatusFailed: 'Không thể cập nhật trạng thái', healthPrescreening: 'Sàng lọc sức khỏe', healthPrescreeningDesc: 'Vui lòng trả lời trung thực để đảm bảo an toàn hiến máu.', weightKg: 'Cân nặng (kg)', lastDonation: 'Lần hiến gần nhất', feelingHealthy: 'Tôi hiện cảm thấy khỏe mạnh.', sleptEnough: 'Tôi đã ngủ ít nhất 6 giờ đêm qua.', takingAntibiotics: 'Đang dùng kháng sinh?', alcoholLast24h: 'Uống rượu/bia trong 24h qua?', tattooLast6m: 'Xăm trong 6 tháng gần đây?', nextStep: 'Tiếp tục', approve: 'Duyệt', cancel: 'Hủy', checkIn: 'Check-in', start: 'Bắt đầu', complete: 'Hoàn tất',
    inventoryDesc: 'Quản lý tồn kho máu của một bệnh viện với Emergency Mode', emergencyModeCount: 'EMERGENCY MODE: {count} nhóm máu', loadingInventory: 'Đang tải dữ liệu kho máu...', quantityL: 'Số lượng (L)', safetyThresholdL: 'Ngưỡng an toàn (L)', saveChanges: 'Lưu thay đổi', updateStock: 'Cập nhật kho', currentQuantity: 'Số lượng hiện tại', safetyStock: 'Tồn kho an toàn', updateFailed: 'Cập nhật thất bại', reportAnalytics: 'Báo cáo & xuất dữ liệu', exportExcel: 'Xuất Excel', exportType: 'Loại danh sách xuất', allAppointmentsDay: 'Tất cả lịch trong ngày', scheduledPending: 'Người dự kiến đến', arrivedCheckedIn: 'Người đã đến', inProgress: 'Đang ở bệnh viện', completed: 'Đã hiến xong', cancelled: 'Đã hủy', donorList: 'Danh sách người hiến',
    recommendationTitle: 'Khuyến nghị người hiến', runRecommendation: 'Chạy khuyến nghị', saveWeights: 'Lưu trọng số', smartAssistantTitle: 'Trợ lý thông minh', askQuestion: 'Nhập câu hỏi của bạn...', send: 'Gửi'
  },
  en: {
    appSubtitle: 'Single Hospital Blood Donation System',
    dashboard: 'Dashboard', appointments: 'Appointments', inventory: 'Blood Inventory', recommendation: 'Recommendation', reports: 'Reports', assistant: 'Smart Assistant', settings: 'Settings', logout: 'Logout',
    hospitalDashboard: 'Hospital Dashboard', donorDashboard: 'Donor Dashboard', hospitalSubtitle: "Overview of today's operations", donorSubtitle: 'Your donation journey', hospital: 'Hospital', donor: 'Donor', hospitalAdmin: 'Hospital Admin',
    loadingDashboard: 'Loading dashboard...', emergencyAlert: 'Emergency Alert', bloodTypeCritical: 'Blood type {bloodType} is critically low!', emergencyHint: 'Please prioritize {bloodType} donors and check the Recommendation tab.', viewDetails: 'View Details',
    todayAppointments: 'Today Appointments', totalDonations: 'Total Donations', totalDonors: 'Total Donors', activeDonors: 'Active Donors', pendingToday: '{count} pending today', completedRecords: 'completed records', registeredDonors: 'registered donors', availableRecommendation: 'available for recommendation',
    time: 'Time', bloodType: 'Blood Type', status: 'Status', actions: 'Actions', dateTime: 'Date & Time', inStock: 'In Stock', inventoryStatus: 'Blood Inventory Status', inventoryOverview: 'Inventory Overview', total: 'Total', units: 'Units', adequate: 'Adequate', low: 'Low', critical: 'Critical', noAppointments: 'No appointments found.',
    donationImpactMessage: 'Donation Impact Message', helloUser: 'Hello, {name}!', defaultImpact: 'One blood donation can help save up to 3 lives. Thank you for your humanitarian action.', humanitarianPoints: 'Humanitarian Points', donorContribution: 'donor contribution', eligibleAgainIn: 'Eligible Again In', days: 'days', cycle84: '84-day cycle', completedDonations: 'Completed Donations', successfulDonations: 'successful donations', livesImpacted: 'Lives Impacted', estimatedImpact: 'estimated impact', eligibilityCountdown: 'Eligibility Countdown', recoveryProgress: 'Recovery progress', eligibleNow: 'You are currently time-eligible to book your next donation.', eligibleLater: '{days} days remaining until your next time-eligible donation.', recentAppointments: 'Recent Appointments',
    settingsCenter: 'Settings Center', systemSettings: 'System Settings', settingsIntro: 'Manage personal profile, notifications, language, appearance, and account-scoped configuration.', settingsScope: 'Settings are stored separately for: {role}', saveAllSettings: 'Save All Settings', savedHospital: 'Hospital-specific settings saved!', savedDonor: 'Donor-specific settings saved!', personalInformation: 'Personal Information', personalInfoDesc: 'Basic identity information used in the blood donation workflow.', chooseImage: 'Choose Image', saveImage: 'Save Image', uploading: 'Uploading...', avatarHelp: 'Supports JPG, PNG, WEBP, GIF. Max 3MB.', validImage: 'Please choose a valid image file.', avatarTooLarge: 'Avatar image must not exceed 3MB.', avatarUpdated: 'Avatar updated successfully!', avatarFailed: 'Unable to update avatar.', profileUpdated: 'Personal information updated!', profileFailed: 'Unable to update information.', phoneLoginReason: 'Donor login uses only phone number to reduce friction and encourage faster participation.', fullName: 'Full Name', phone: 'Phone', unknown: 'Unknown', savePersonalInfo: 'Save Personal Information', saving: 'Saving...',
    notificationSettings: 'Notification Settings', notificationDesc: 'Control system notification types.', emergencyBloodAlerts: 'Emergency blood alerts', appointmentReminders: 'Appointment reminders', donationCampaignMessages: 'Donation campaign messages', donationPreferences: 'Donation Preferences', donationPreferencesDesc: 'Configure your availability for blood donation.', readyToDonate: 'Ready to donate when needed', reminderBeforeAppointment: 'Reminder before appointment', noReminder: 'No reminder', oneDayBefore: '1 day before', twoDaysBefore: '2 days before', threeDaysBefore: '3 days before', systemPreferences: 'System Preferences', systemPreferencesDesc: 'Customize your experience.', language: 'Language', appearance: 'Appearance', defaultExportFormat: 'Default export format', lightMode: 'Light Mode', darkMode: 'Dark Mode', systemDefault: 'System Default',
    emergencyThreshold: 'Emergency Threshold', emergencyThresholdDesc: 'Configure thresholds that trigger blood shortage alerts.', criticalThresholdRatio: 'Critical threshold ratio', warningThresholdRatio: 'Warning threshold ratio', criticalHint: 'Example: 0.5 means inventory below 50% of safety stock is Critical.', warningHint: 'Example: 0.8 means inventory below 80% of safety stock is Warning.', recommendationWeights: 'Recommendation Weights', recommendationWeightsDesc: 'Heuristic weights used to rank donors. Total should be close to 1.00.', totalWeightNow: 'Current total weight: {total}', bloodMatch: 'BloodMatch', eligibility: 'Eligibility', reliability: 'Reliability', humanitarianPointsLabel: 'Humanitarian Points', emergencyWeightHint: 'When Emergency Mode is active, the system can increase BloodMatch priority to mobilize the exact needed blood type.',
    bookAppointment: 'Book Appointment', scheduleDesc: 'Single hospital schedule management. No map, no distance barrier.', hospitalColumn: 'Hospital', congratulations: 'Congratulations', awaitingApproval: 'Awaiting Approval', noActions: 'No actions', bookDonation: 'Book Donation', stepOf: 'Step {step} of 2', singleHospitalBookingNote: 'You are booking at Central Blood Donation Hospital. The system removes nearest-site selection to focus on voluntary humanitarian action.', notesOptional: 'Notes (Optional)', additionalInfo: 'Any additional info?', back: 'Back', confirmBooking: 'Confirm Booking', selectDateAlert: 'Please select an appointment date and time', createAppointmentFailed: 'Failed to create appointment', updateStatusFailed: 'Failed to update status', healthPrescreening: 'Health Pre-screening', healthPrescreeningDesc: 'Please answer honestly to ensure safe donation.', weightKg: 'Weight (kg)', lastDonation: 'Last Donation', feelingHealthy: 'I am currently feeling healthy and well.', sleptEnough: 'I had at least 6 hours of sleep last night.', takingAntibiotics: 'Taking antibiotics?', alcoholLast24h: 'Alcohol in last 24h?', tattooLast6m: 'Tattoo in last 6 months?', nextStep: 'Next Step', approve: 'Approve', cancel: 'Cancel', checkIn: 'Check In', start: 'Start', complete: 'Complete',
    inventoryDesc: 'Single hospital stock control with Emergency Mode', emergencyModeCount: 'EMERGENCY MODE: {count} blood type(s)', loadingInventory: 'Loading inventory data...', quantityL: 'Quantity (L)', safetyThresholdL: 'Safety threshold (L)', saveChanges: 'Save Changes', updateStock: 'Update Stock', currentQuantity: 'Current Quantity', safetyStock: 'Safety Stock', updateFailed: 'Update failed', reportAnalytics: 'Reports & Analytics', exportExcel: 'Export Excel', exportType: 'Export Type', allAppointmentsDay: 'All appointments in selected day', scheduledPending: 'Scheduled arrivals', arrivedCheckedIn: 'Arrived donors', inProgress: 'Currently in hospital', completed: 'Completed donations', cancelled: 'Cancelled appointments', donorList: 'Donor list',
    recommendationTitle: 'Donor Recommendation', runRecommendation: 'Run Recommendation', saveWeights: 'Save Weights', smartAssistantTitle: 'Smart Assistant', askQuestion: 'Type your question...', send: 'Send'
  }
};

function format(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export function t(key, user = authService.getCurrentUser(), vars = {}) {
  const lang = getLanguageForUser(user);
  const template = labels[lang]?.[key] ?? labels.vi[key] ?? labels.en[key] ?? key;
  return format(template, vars);
}

export function useI18n(user = authService.getCurrentUser()) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion(v => v + 1);
    window.addEventListener('sbdcs-settings-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('sbdcs-settings-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return (key, vars = {}) => t(key, user, vars);
}
