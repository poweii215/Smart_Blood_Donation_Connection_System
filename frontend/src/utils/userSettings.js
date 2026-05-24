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
  const root = document.documentElement;
  root.classList.toggle('dark', shouldUseDark);
  root.dataset.theme = shouldUseDark ? 'dark' : 'light';
  root.dataset.appearance = mode;
  document.body?.classList?.toggle('dark', shouldUseDark);
  document.body?.classList?.toggle('light', !shouldUseDark);
  return mode;
}

export function getLanguageForUser(user = authService.getCurrentUser()) {
  return getScopedSetting('language', 'vi', user);
}

export const labels = {
  vi: {
    appSubtitle: 'Hệ thống hiến máu một bệnh viện',
    dashboard: 'Tổng quan', appointments: 'Lịch hẹn', inventory: 'Kho máu', recommendation: 'Khuyến nghị', reports: 'Báo cáo', assistant: 'Trợ lý thông minh', notifications: 'Thông báo', settings: 'Cài đặt', logout: 'Đăng xuất',
    hospitalDashboard: 'Bảng điều khiển bệnh viện', donorDashboard: 'Bảng điều khiển người hiến', hospitalSubtitle: 'Tổng quan hoạt động hôm nay', donorSubtitle: 'Hành trình hiến máu của bạn', hospital: 'Bệnh viện', donor: 'Người hiến', hospitalAdmin: 'Quản trị bệnh viện',
    loadingDashboard: 'Đang tải bảng điều khiển...', emergencyAlert: 'Cảnh báo khẩn cấp', bloodTypeCritical: 'Nhóm máu {bloodType} đang ở mức nguy cấp!', emergencyHint: 'Vui lòng ưu tiên người hiến nhóm {bloodType} và kiểm tra tab Khuyến nghị.', viewDetails: 'Xem chi tiết',
    todayAppointments: 'Lịch hẹn hôm nay', totalDonations: 'Tổng lượt hiến', totalDonors: 'Tổng người hiến', activeDonors: 'Người hiến đang hoạt động', pendingToday: '{count} lịch đang chờ hôm nay', completedRecords: 'hồ sơ đã hoàn tất', registeredDonors: 'người hiến đã đăng ký', availableRecommendation: 'sẵn sàng để khuyến nghị',
    time: 'Thời gian', bloodType: 'Nhóm máu', status: 'Trạng thái', actions: 'Thao tác', dateTime: 'Ngày & giờ', inStock: 'Tồn kho', inventoryStatus: 'Trạng thái kho máu', inventoryOverview: 'Tổng quan kho máu', total: 'Tổng', units: 'Đơn vị', adequate: 'An toàn', low: 'Thấp', critical: 'Nguy cấp', noAppointments: 'Chưa có lịch hẹn.',
    donationImpactMessage: 'Thông điệp ý nghĩa hiến máu', helloUser: 'Xin chào, {name}!', defaultImpact: 'Một lần hiến máu có thể giúp cứu sống tới 3 người. Cảm ơn bạn vì nghĩa cử nhân đạo này.', humanitarianPoints: 'Điểm nhân đạo', donorContribution: 'đóng góp của người hiến', eligibleAgainIn: 'Đủ điều kiện lại sau', days: 'ngày', cycle84: 'chu kỳ 84 ngày', completedDonations: 'Lượt hiến hoàn tất', successfulDonations: 'lượt hiến thành công', livesImpacted: 'Số mạng sống hỗ trợ', estimatedImpact: 'ước tính tác động', eligibilityCountdown: 'Đếm ngược đủ điều kiện', recoveryProgress: 'Tiến trình phục hồi', eligibleNow: 'Bạn hiện đã đủ điều kiện thời gian để đăng ký hiến máu tiếp theo.', eligibleLater: 'Còn {days} ngày để đủ điều kiện thời gian hiến tiếp theo.', recentAppointments: 'Lịch hẹn gần đây',

    // Common analytics and notification labels
    notificationsTitle: 'Thông báo', unreadAlerts: '{count} thông báo chưa đọc', loadingNotifications: 'Đang tải thông báo...', noActiveNotifications: 'Hiện chưa có thông báo.', markAllRead: 'Đánh dấu đã đọc', viewAll: 'Xem tất cả', openNotifications: 'Mở thông báo',
    emergencyOpenRecommendation: 'Mở Khuyến nghị', completedDonationsTitle: 'Lượt hiến đã hoàn tất', emergencyTypes: 'Nhóm máu khẩn cấp', needAttention: 'cần chú ý', operationalList: 'Danh sách vận hành', safetyStock: 'Tồn kho an toàn', notificationCenter: 'Trung tâm thông báo', liveAlerts: 'Cảnh báo trực tiếp', viewNotificationCenter: 'Xem trung tâm thông báo', openNotificationCenter: 'Mở trung tâm thông báo', monthlyDonationAnalytics: 'Phân tích hiến máu theo tháng', last12Months: '12 tháng gần nhất', hospitalPerformance: 'Hiệu suất bệnh viện', donorRetention: 'Tỷ lệ quay lại của người hiến', completionRate: 'Tỷ lệ hoàn tất lịch hẹn', completedAppointments: 'Lịch hẹn hoàn tất', totalAppointments: 'Tổng lịch hẹn', mostNeededBloodTypes: 'Nhóm máu cần ưu tiên',
    donorJourneyVisualization: 'Hành trình hiến máu', yourCurrentPath: 'Tiến trình hiện tại', appointmentTrustScore: 'điểm tin cậy lịch hẹn', yourContribution: 'đóng góp của bạn', recoveryCycle: 'chu kỳ phục hồi 84 ngày', successfulDonationRecords: 'lượt hiến thành công', recentAppointmentsTitle: 'Lịch hẹn gần đây', screeningNotUpdated: 'Chưa cập nhật sàng lọc', noAppointmentsYet: 'Chưa có lịch hẹn.', noNotifications: 'Không có thông báo đang hoạt động.',
    registered: 'Đã đăng ký', registeredHint: 'Tài khoản đã được tạo', approved: 'Đã duyệt', approvedHint: 'Bệnh viện đã duyệt', checkedIn: 'Đã check-in', checkedInHint: 'Đã đến bệnh viện', donated: 'Đã hiến', donatedHint: 'Hoàn tất hiến máu', recovery: 'Phục hồi', recoveryHint: 'Nghỉ ngơi và phục hồi', eligibleAgain: 'Đủ điều kiện lại', eligibleAgainHint: 'Sẵn sàng cho lần hiến tiếp theo',
    appointmentApproved: 'Lịch hẹn đã được duyệt', upcomingAppointment: 'Lịch hẹn sắp tới', emergencyCampaign: 'Chiến dịch khẩn cấp', eligibleAgainNotice: 'Bạn đã đủ điều kiện hiến lại',

    homepageMedia: 'Ảnh trang chủ', homepageMediaDesc: 'Quản trị bệnh viện có quyền thay ảnh bệnh viện và ảnh hoạt động hiến máu hiển thị ở trang chủ.', hospitalHomepageImage: 'Ảnh bệnh viện trên trang chủ', hospitalHomepageImageDesc: 'Hiển thị ở khối giới thiệu chính của landing page.', donorActivityImage: 'Ảnh người đang hiến máu', donorActivityImageDesc: 'Hiển thị ở phần Người đang hiến máu hôm nay.', homepageMediaHelp: 'Ảnh sau khi lưu sẽ xuất hiện ở trang chủ cho tất cả người truy cập. Người hiến chỉ đổi được avatar cá nhân, không sửa được ảnh trang chủ.', chooseImageShort: 'Chọn ảnh', savingImage: 'Đang lưu...', homepageImageTooLarge: 'Ảnh trang chủ không được vượt quá 5MB.', homepageImageUpdated: 'Đã cập nhật ảnh trang chủ.', homepageImageFailed: 'Không thể cập nhật ảnh trang chủ.',
    totalAlerts: 'Tổng thông báo', highPriority: 'Ưu tiên cao', normalUpdates: 'Cập nhật thường', latestNotifications: 'Thông báo mới nhất', notificationIntroTitle: 'Cảnh báo hệ thống và cập nhật người hiến', notificationIntroDesc: 'Theo dõi lịch hẹn, cảnh báo thiếu máu, chiến dịch khẩn cấp và trạng thái đủ điều kiện hiến lại.',
    criticalLabel: 'Nguy cấp', safeLabel: 'An toàn', noData: 'Không có dữ liệu',
    settingsCenter: 'Trung tâm cài đặt', systemSettings: 'Cài đặt hệ thống', settingsIntro: 'Quản lý hồ sơ cá nhân, thông báo, ngôn ngữ, giao diện và cấu hình theo từng tài khoản.', settingsScope: 'Cài đặt đang lưu riêng cho: {role}', saveAllSettings: 'Lưu cài đặt hệ thống', savedHospital: 'Đã lưu cài đặt hệ thống của Bệnh viện. Thông tin hồ sơ và ảnh có nút lưu riêng.', savedDonor: 'Đã lưu cài đặt hệ thống của Người hiến. Thông tin hồ sơ và ảnh có nút lưu riêng.', personalInformation: 'Thông tin cá nhân', personalInfoDesc: 'Thông tin định danh cơ bản dùng trong quy trình hiến máu.', chooseImage: 'Chọn ảnh', saveImage: 'Lưu ảnh', uploading: 'Đang tải...', avatarHelp: 'Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 3MB.', validImage: 'Vui lòng chọn file ảnh hợp lệ.', avatarTooLarge: 'Ảnh đại diện không được vượt quá 3MB.', avatarUpdated: 'Đã cập nhật ảnh đại diện!', avatarFailed: 'Không thể cập nhật ảnh đại diện.', profileUpdated: 'Đã cập nhật thông tin cá nhân!', profileFailed: 'Không thể cập nhật thông tin.', phoneLoginReason: 'Người hiến chỉ dùng số điện thoại để giảm thủ tục và khuyến khích tham gia nhanh hơn.', fullName: 'Họ tên', phone: 'Số điện thoại', unknown: 'Chưa xác định', savePersonalInfo: 'Lưu thông tin cá nhân', saving: 'Đang lưu...',
    notificationSettings: 'Cài đặt thông báo', notificationDesc: 'Kiểm soát các loại thông báo hệ thống.', emergencyBloodAlerts: 'Cảnh báo thiếu máu khẩn cấp', appointmentReminders: 'Nhắc lịch hẹn', donationCampaignMessages: 'Thông báo chiến dịch hiến máu', donationPreferences: 'Tùy chọn hiến máu', donationPreferencesDesc: 'Thiết lập mức sẵn sàng tham gia hiến máu.', readyToDonate: 'Sẵn sàng hiến khi cần', reminderBeforeAppointment: 'Nhắc trước lịch hẹn', noReminder: 'Không nhắc', oneDayBefore: 'Trước 1 ngày', twoDaysBefore: 'Trước 2 ngày', threeDaysBefore: 'Trước 3 ngày', systemPreferences: 'Tùy chọn hệ thống', systemPreferencesDesc: 'Tùy chỉnh trải nghiệm sử dụng.', language: 'Ngôn ngữ', appearance: 'Giao diện', defaultExportFormat: 'Định dạng xuất mặc định', lightMode: 'Chế độ sáng', darkMode: 'Chế độ tối', systemDefault: 'Theo hệ thống',
    emergencyThreshold: 'Ngưỡng khẩn cấp', emergencyThresholdDesc: 'Cấu hình ngưỡng kích hoạt cảnh báo thiếu máu.', criticalThresholdRatio: 'Tỷ lệ ngưỡng nguy cấp', warningThresholdRatio: 'Tỷ lệ ngưỡng cảnh báo', criticalHint: 'Ví dụ 0.5 nghĩa là tồn kho dưới 50% safety stock sẽ Nguy cấp.', warningHint: 'Ví dụ 0.8 nghĩa là tồn kho dưới 80% safety stock sẽ Cảnh báo.', recommendationWeights: 'Trọng số khuyến nghị', recommendationWeightsDesc: 'Trọng số heuristic dùng để xếp hạng người hiến. Tổng nên xấp xỉ 1.00.', totalWeightNow: 'Tổng trọng số hiện tại: {total}', bloodMatch: 'Tương thích nhóm máu', eligibility: 'Đủ điều kiện', reliability: 'Độ tin cậy', humanitarianPointsLabel: 'Điểm nhân đạo', emergencyWeightHint: 'Khi bật Emergency Mode, hệ thống có thể tăng ưu tiên tương thích nhóm máu để huy động đúng nhóm máu đang thiếu.',
    bookAppointment: 'Đặt lịch hiến máu', scheduleDesc: 'Quản lý lịch hẹn cho một bệnh viện. Không dùng bản đồ, không đặt khoảng cách làm rào cản.', hospitalColumn: 'Bệnh viện', congratulations: 'Chúc mừng', awaitingApproval: 'Chờ duyệt', noActions: 'Không có thao tác', bookDonation: 'Đặt lịch hiến máu', stepOf: 'Bước {step}/2', singleHospitalBookingNote: 'Bạn đang đặt lịch tại Central Blood Donation Hospital. Hệ thống bỏ chọn điểm gần nhất để tập trung vào tinh thần tự nguyện.', notesOptional: 'Ghi chú (tuỳ chọn)', additionalInfo: 'Thông tin bổ sung?', back: 'Quay lại', confirmBooking: 'Xác nhận đặt lịch', selectDateAlert: 'Vui lòng chọn ngày giờ hẹn', createAppointmentFailed: 'Không thể tạo lịch hẹn', updateStatusFailed: 'Không thể cập nhật trạng thái', healthPrescreening: 'Sàng lọc sức khỏe', healthPrescreeningDesc: 'Vui lòng trả lời trung thực để đảm bảo an toàn hiến máu.', weightKg: 'Cân nặng (kg)', lastDonation: 'Lần hiến gần nhất', feelingHealthy: 'Tôi hiện cảm thấy khỏe mạnh.', sleptEnough: 'Tôi đã ngủ ít nhất 6 giờ đêm qua.', takingAntibiotics: 'Đang dùng kháng sinh?', alcoholLast24h: 'Uống rượu/bia trong 24h qua?', tattooLast6m: 'Xăm trong 6 tháng gần đây?', nextStep: 'Tiếp tục', approve: 'Duyệt', cancel: 'Hủy', checkIn: 'Check-in', start: 'Bắt đầu', complete: 'Hoàn tất',
    inventoryDesc: 'Quản lý tồn kho máu của một bệnh viện với Emergency Mode', emergencyModeCount: 'EMERGENCY MODE: {count} nhóm máu', loadingInventory: 'Đang tải dữ liệu kho máu...', quantityL: 'Số lượng (L)', safetyThresholdL: 'Ngưỡng an toàn (L)', saveChanges: 'Lưu thay đổi', updateStock: 'Cập nhật kho', currentQuantity: 'Số lượng hiện tại', safetyStock: 'Tồn kho an toàn', updateFailed: 'Cập nhật thất bại', reportAnalytics: 'Báo cáo & xuất dữ liệu', exportExcel: 'Xuất Excel', exportType: 'Loại danh sách xuất', allAppointmentsDay: 'Tất cả lịch trong ngày', scheduledPending: 'Người dự kiến đến', arrivedCheckedIn: 'Người đã đến', inProgress: 'Đang ở bệnh viện', completed: 'Đã hiến xong', cancelled: 'Đã hủy', donorList: 'Danh sách người hiến',
    recommendationTitle: 'Khuyến nghị người hiến', runRecommendation: 'Chạy khuyến nghị', saveWeights: 'Lưu trọng số', smartAssistantTitle: 'Trợ lý thông minh', askQuestion: 'Nhập câu hỏi của bạn...', send: 'Gửi'
  },
  en: {
    appSubtitle: 'Single Hospital Blood Donation System',
    dashboard: 'Dashboard', appointments: 'Appointments', inventory: 'Blood Inventory', recommendation: 'Recommendation', reports: 'Reports', assistant: 'Smart Assistant', notifications: 'Notifications', settings: 'Settings', logout: 'Logout',
    hospitalDashboard: 'Hospital Dashboard', donorDashboard: 'Donor Dashboard', hospitalSubtitle: "Overview of today's operations", donorSubtitle: 'Your donation journey', hospital: 'Hospital', donor: 'Donor', hospitalAdmin: 'Hospital Admin',
    loadingDashboard: 'Loading dashboard...', emergencyAlert: 'Emergency Alert', bloodTypeCritical: 'Blood type {bloodType} is critically low!', emergencyHint: 'Please prioritize {bloodType} donors and check the Recommendation tab.', viewDetails: 'View Details',
    todayAppointments: 'Today Appointments', totalDonations: 'Total Donations', totalDonors: 'Total Donors', activeDonors: 'Active Donors', pendingToday: '{count} pending today', completedRecords: 'completed records', registeredDonors: 'registered donors', availableRecommendation: 'available for recommendation',
    time: 'Time', bloodType: 'Blood Type', status: 'Status', actions: 'Actions', dateTime: 'Date & Time', inStock: 'In Stock', inventoryStatus: 'Blood Inventory Status', inventoryOverview: 'Inventory Overview', total: 'Total', units: 'Units', adequate: 'Adequate', low: 'Low', critical: 'Critical', noAppointments: 'No appointments found.',
    donationImpactMessage: 'Donation Impact Message', helloUser: 'Hello, {name}!', defaultImpact: 'One blood donation can help save up to 3 lives. Thank you for your humanitarian action.', humanitarianPoints: 'Humanitarian Points', donorContribution: 'donor contribution', eligibleAgainIn: 'Eligible Again In', days: 'days', cycle84: '84-day cycle', completedDonations: 'Completed Donations', successfulDonations: 'successful donations', livesImpacted: 'Lives Impacted', estimatedImpact: 'estimated impact', eligibilityCountdown: 'Eligibility Countdown', recoveryProgress: 'Recovery progress', eligibleNow: 'You are currently time-eligible to book your next donation.', eligibleLater: '{days} days remaining until your next time-eligible donation.', recentAppointments: 'Recent Appointments',

    // Common analytics and notification labels
    notificationsTitle: 'Notifications', unreadAlerts: '{count} unread alert(s)', loadingNotifications: 'Loading notifications...', noActiveNotifications: 'No active notifications right now.', markAllRead: 'Mark all read', viewAll: 'View all', openNotifications: 'Open notifications',
    emergencyOpenRecommendation: 'Open Recommendation', completedDonationsTitle: 'Completed Donations', emergencyTypes: 'Emergency Types', needAttention: 'need attention', operationalList: 'Operational list', safetyStock: 'Safety stock', notificationCenter: 'Notification Center', liveAlerts: 'Live alerts', viewNotificationCenter: 'View Notification Center', openNotificationCenter: 'Open Notification Center', monthlyDonationAnalytics: 'Monthly Donation Analytics', last12Months: 'Last 12 months', hospitalPerformance: 'Hospital Performance', donorRetention: 'Donor retention', completionRate: 'Completion rate', completedAppointments: 'Completed appointments', totalAppointments: 'Total appointments', mostNeededBloodTypes: 'Most needed blood types',
    donorJourneyVisualization: 'Donor Journey Visualization', yourCurrentPath: 'Your current path', appointmentTrustScore: 'appointment trust score', yourContribution: 'your contribution', recoveryCycle: '84-day recovery cycle', successfulDonationRecords: 'successful donations', recentAppointmentsTitle: 'Recent Appointments', screeningNotUpdated: 'Screening not updated', noAppointmentsYet: 'No appointments yet.', noNotifications: 'No active notifications.',
    registered: 'Registered', registeredHint: 'Account created', approved: 'Approved', approvedHint: 'Hospital approved', checkedIn: 'Checked In', checkedInHint: 'Arrived at hospital', donated: 'Donated', donatedHint: 'Donation completed', recovery: 'Recovery', recoveryHint: 'Rest and recover', eligibleAgain: 'Eligible Again', eligibleAgainHint: 'Ready for next donation',
    appointmentApproved: 'Appointment approved', upcomingAppointment: 'Upcoming appointment', emergencyCampaign: 'Emergency campaign', eligibleAgainNotice: 'Eligible again',

    homepageMedia: 'Homepage Media', homepageMediaDesc: 'Hospital Admin can change hospital and donation activity images shown on the homepage.', hospitalHomepageImage: 'Hospital homepage image', hospitalHomepageImageDesc: 'Displayed in the main landing-page hero block.', donorActivityImage: 'People donating image', donorActivityImageDesc: 'Displayed in the People Donating Today section.', homepageMediaHelp: 'After saving, these images appear on the public homepage for all visitors. Donors can only change their own avatar.', chooseImageShort: 'Choose image', savingImage: 'Saving...', homepageImageTooLarge: 'Homepage image must not exceed 5MB.', homepageImageUpdated: 'Homepage image updated.', homepageImageFailed: 'Unable to update homepage image.',
    totalAlerts: 'Total Alerts', highPriority: 'High Priority', normalUpdates: 'Normal Updates', latestNotifications: 'Latest Notifications', notificationIntroTitle: 'System alerts and donor updates', notificationIntroDesc: 'Track appointments, blood shortage alerts, emergency campaigns, and eligibility updates.',
    criticalLabel: 'Critical', safeLabel: 'Safe', noData: 'No data',
    settingsCenter: 'Settings Center', systemSettings: 'System Settings', settingsIntro: 'Manage personal profile, notifications, language, appearance, and account-scoped configuration.', settingsScope: 'Settings are stored separately for: {role}', saveAllSettings: 'Save System Settings', savedHospital: 'Hospital-specific settings saved!', savedDonor: 'Donor-specific settings saved!', personalInformation: 'Personal Information', personalInfoDesc: 'Basic identity information used in the blood donation workflow.', chooseImage: 'Choose Image', saveImage: 'Save Image', uploading: 'Uploading...', avatarHelp: 'Supports JPG, PNG, WEBP, GIF. Max 3MB.', validImage: 'Please choose a valid image file.', avatarTooLarge: 'Avatar image must not exceed 3MB.', avatarUpdated: 'Avatar updated successfully!', avatarFailed: 'Unable to update avatar.', profileUpdated: 'Personal information updated!', profileFailed: 'Unable to update information.', phoneLoginReason: 'Donor login uses only phone number to reduce friction and encourage faster participation.', fullName: 'Full Name', phone: 'Phone', unknown: 'Unknown', savePersonalInfo: 'Save Personal Information', saving: 'Saving...',
    notificationSettings: 'Notification Settings', notificationDesc: 'Control system notification types.', emergencyBloodAlerts: 'Emergency blood alerts', appointmentReminders: 'Appointment reminders', donationCampaignMessages: 'Donation campaign messages', donationPreferences: 'Donation Preferences', donationPreferencesDesc: 'Configure your availability for blood donation.', readyToDonate: 'Ready to donate when needed', reminderBeforeAppointment: 'Reminder before appointment', noReminder: 'No reminder', oneDayBefore: '1 day before', twoDaysBefore: '2 days before', threeDaysBefore: '3 days before', systemPreferences: 'System Preferences', systemPreferencesDesc: 'Customize your experience.', language: 'Language', appearance: 'Appearance', defaultExportFormat: 'Default export format', lightMode: 'Light Mode', darkMode: 'Dark Mode', systemDefault: 'System Default',
    emergencyThreshold: 'Emergency Threshold', emergencyThresholdDesc: 'Configure thresholds that trigger blood shortage alerts.', criticalThresholdRatio: 'Critical threshold ratio', warningThresholdRatio: 'Warning threshold ratio', criticalHint: 'Example: 0.5 means inventory below 50% of safety stock is Critical.', warningHint: 'Example: 0.8 means inventory below 80% of safety stock is Warning.', recommendationWeights: 'Recommendation Weights', recommendationWeightsDesc: 'Heuristic weights used to rank donors. Total should be close to 1.00.', totalWeightNow: 'Current total weight: {total}', bloodMatch: 'BloodMatch', eligibility: 'Eligibility', reliability: 'Reliability', humanitarianPointsLabel: 'Humanitarian Points', emergencyWeightHint: 'When Emergency Mode is active, the system can increase BloodMatch priority to mobilize the exact needed blood type.',

    bookAppointment: 'Book Appointment', scheduleDesc: 'Single hospital schedule management. No map, no distance barrier.', hospitalColumn: 'Hospital', congratulations: 'Congratulations', awaitingApproval: 'Awaiting Approval', noActions: 'No actions', bookDonation: 'Book Donation', stepOf: 'Step {step} of 2', singleHospitalBookingNote: 'You are booking at Central Blood Donation Hospital. The system removes nearest-site selection to focus on voluntary humanitarian action.', notesOptional: 'Notes (Optional)', additionalInfo: 'Any additional info?', back: 'Back', confirmBooking: 'Confirm Booking', selectDateAlert: 'Please select an appointment date and time', createAppointmentFailed: 'Failed to create appointment', updateStatusFailed: 'Failed to update status', healthPrescreening: 'Health Pre-screening', healthPrescreeningDesc: 'Please answer honestly to ensure safe donation.', weightKg: 'Weight (kg)', lastDonation: 'Last Donation', feelingHealthy: 'I am currently feeling healthy and well.', sleptEnough: 'I had at least 6 hours of sleep last night.', takingAntibiotics: 'Taking antibiotics?', alcoholLast24h: 'Alcohol in last 24h?', tattooLast6m: 'Tattoo in last 6 months?', nextStep: 'Next Step', approve: 'Approve', cancel: 'Cancel', checkIn: 'Check In', start: 'Start', complete: 'Complete',
    inventoryDesc: 'Single hospital stock control with Emergency Mode', emergencyModeCount: 'EMERGENCY MODE: {count} blood type(s)', loadingInventory: 'Loading inventory data...', quantityL: 'Quantity (L)', safetyThresholdL: 'Safety threshold (L)', saveChanges: 'Save Changes', updateStock: 'Update Stock', currentQuantity: 'Current Quantity', safetyStock: 'Safety Stock', updateFailed: 'Update failed', reportAnalytics: 'Reports & Analytics', exportExcel: 'Export Excel', exportType: 'Export Type', allAppointmentsDay: 'All appointments in selected day', scheduledPending: 'Scheduled arrivals', arrivedCheckedIn: 'Arrived donors', inProgress: 'Currently in hospital', completed: 'Completed donations', cancelled: 'Cancelled appointments', donorList: 'Donor list',
    recommendationTitle: 'Donor Recommendation', runRecommendation: 'Run Recommendation', saveWeights: 'Save Weights', smartAssistantTitle: 'Smart Assistant', askQuestion: 'Type your question...', send: 'Send'
  }
};


// Extra public-page translation keys. Kept outside the core object so old labels remain stable.
Object.assign(labels.vi, {
  login: 'Đăng nhập',
  heroBadge: 'Mỗi lần hiến máu là một cơ hội cứu người',
  heroTitleLine1: 'Một giọt máu cho đi,',
  heroTitleLine2: 'một cuộc đời ở lại.',
  heroCopy: 'SBDCs giúp bệnh viện quản lý hiến máu thông minh hơn và giúp người hiến máu đăng ký nhanh hơn, nhẹ nhàng hơn, đúng tinh thần nhân đạo.',
  donateNow: 'Tôi muốn hiến máu',
  viewProcess: 'Xem quy trình',
  hospitalReadySubtitle: 'Luôn sẵn sàng tiếp nhận người hiến máu',
  successfulDonationCount: 'Lượt hiến thành công (toàn hệ thống)',
  activeDonorCount: 'Người hiến đang hoạt động (toàn hệ thống)',
  todayAppointmentCount: 'Lịch hẹn hôm nay',
  emergencyBloodNeed: 'Nhu cầu máu khẩn cấp',
  emergencyBloodNeedDesc: 'Khi kho máu xuống thấp, hệ thống sẽ kích hoạt Emergency Mode để ưu tiên nhóm máu cần thiết và gợi ý người hiến phù hợp nhất.',
  priorityToday: 'Hôm nay bệnh viện đang ưu tiên:',
  peopleDonatingToday: 'Người đang hiến máu hôm nay',
  peopleDonatingTitle: 'Những người đang trao hy vọng hôm nay',
  peopleDonatingDesc: 'Mỗi người hiến máu là một phần của cộng đồng nhân ái.',
  simpleProcess: 'Quy trình hiến máu đơn giản',
  processLoginDesc: 'Nhập số điện thoại để bắt đầu nhanh.',
  declareHealth: 'Khai báo',
  processDeclareDesc: 'Cập nhật sức khỏe và thông tin cơ bản.',
  donateBlood: 'Hiến máu',
  processBookDesc: 'Chọn khung giờ phù hợp để đến hiến.',
  processDonateDesc: 'Hoàn tất và nhận lời cảm ơn từ hệ thống.',
  loginTitle: 'Đăng nhập SBDCs',
  loginSubtitle: 'Hai cổng đăng nhập riêng: người hiến và quản trị bệnh viện.',
  donorPhoneOnlyHint: 'Donor chỉ cần số điện thoại để giảm thủ tục và khuyến khích hành động hiến máu.',
  hospitalSecureHint: 'Hospital quản lý dữ liệu nhạy cảm nên cần email/số điện thoại và mật khẩu đã mã hóa.',
  donorPhoneLabel: 'Số điện thoại Donor',
  demoDonorHint: 'Demo Donor: 0900000002 · Số mới sẽ tự tạo tài khoản Donor.',
  hospitalIdentifierLabel: 'Email hoặc số điện thoại Hospital',
  password: 'Mật khẩu',
  demoHospitalHint: 'Demo Hospital: hospital@sbdcs.com / Admin@123',
  loggingIn: 'Đang đăng nhập...',
  wantFullDonorProfile: 'Muốn nhập đầy đủ thông tin Donor?',
  registerProfile: 'Đăng ký hồ sơ',
  loginFailed: 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.',
  languageShortVi: 'VI', languageShortEn: 'EN'
});

Object.assign(labels.en, {
  login: 'Login',
  heroBadge: 'Every blood donation is a chance to save lives',
  heroTitleLine1: 'Give a drop of blood,',
  heroTitleLine2: 'keep a life going.',
  heroCopy: 'SBDCs helps the hospital manage blood donation intelligently and helps donors register faster, easier, and with a humanitarian spirit.',
  donateNow: 'I want to donate',
  viewProcess: 'View process',
  hospitalReadySubtitle: 'Always ready to welcome blood donors',
  successfulDonationCount: 'Successful donations (all-time)',
  activeDonorCount: 'Active donors (all-time)',
  todayAppointmentCount: 'Appointments today',
  emergencyBloodNeed: 'Emergency Blood Need',
  emergencyBloodNeedDesc: 'When blood stock drops, Emergency Mode prioritizes the needed blood type and recommends the most suitable donors.',
  priorityToday: 'Today the hospital is prioritizing:',
  peopleDonatingToday: 'People Donating Today',
  peopleDonatingTitle: 'People sharing hope today',
  peopleDonatingDesc: 'Every donor is part of a compassionate community.',
  simpleProcess: 'Simple donation process',
  processLoginDesc: 'Enter your phone number to start quickly.',
  declareHealth: 'Declare health',
  processDeclareDesc: 'Update health and basic information.',
  donateBlood: 'Donate blood',
  processBookDesc: 'Choose a suitable time slot to donate.',
  processDonateDesc: 'Complete donation and receive a thank-you message.',
  loginTitle: 'Login to SBDCs',
  loginSubtitle: 'Separate portals for donors and hospital administrators.',
  donorPhoneOnlyHint: 'Donors only need a phone number to reduce friction and encourage blood donation.',
  hospitalSecureHint: 'Hospital manages sensitive data, so email/phone and an encrypted password are required.',
  donorPhoneLabel: 'Donor phone number',
  demoDonorHint: 'Demo Donor: 0900000002 · New numbers create a Donor account automatically.',
  hospitalIdentifierLabel: 'Hospital email or phone',
  password: 'Password',
  demoHospitalHint: 'Demo Hospital: hospital@sbdcs.com / Admin@123',
  loggingIn: 'Logging in...',
  wantFullDonorProfile: 'Want to enter full Donor information?',
  registerProfile: 'Register profile',
  loginFailed: 'Unable to login. Please check your information.',
  languageShortVi: 'VI', languageShortEn: 'EN'
});


Object.assign(labels.vi, {
  assistantWelcome: 'Xin chào, mình là Smart Assistant của SBDCs. Mình có thể trả lời dựa trên dữ liệu thật của bệnh viện như quy trình đăng ký, chuẩn bị trước/sau khi hiến, lịch hẹn, điều kiện hiến, thời gian đủ điều kiện và tình trạng khẩn cấp kho máu.',
  assistantDesc: 'Trợ lý tự động trả lời câu hỏi thường gặp và dữ liệu thật: quy trình đăng ký, lịch hẹn, điều kiện hiến, kho máu và hồ sơ donor.',
  dataDrivenChatbot: 'Chatbot theo dữ liệu nội bộ',
  noExternalAi: 'Không dùng AI bên ngoài; câu trả lời lấy từ database nội bộ.',
  assistantError: 'Smart Assistant hiện chưa phản hồi được. Vui lòng thử lại.',
  intent: 'Ý định', checkingData: 'Đang kiểm tra dữ liệu...', quickQuestions: 'Câu hỏi nhanh', whereSmart: 'Smart ở đâu?',
  smartAssistantExplanation: 'Bot nhận diện intent đơn giản, kết hợp FAQ nghiệp vụ với dữ liệu thật như appointment, blood inventory, emergency mode, reliability score và last donation date để trả lời cho Donor.'
});


Object.assign(labels.en, {
  assistantWelcome: 'Hello, I am the SBDCs Smart Assistant. I can answer using hospital data such as registration steps, preparation, appointments, eligibility, next donation time, and emergency blood status.',
  assistantDesc: 'An automatic assistant that answers FAQs and real hospital data: registration process, appointments, eligibility, blood stock, and donor profile.',
  dataDrivenChatbot: 'Data-driven Rule-based Chatbot',
  noExternalAi: 'No external AI is used; answers are generated from the internal database.',
  assistantError: 'Smart Assistant is not responding right now. Please try again.',
  intent: 'Intent', checkingData: 'Checking data...', quickQuestions: 'Quick questions', whereSmart: 'What makes it smart?',
  smartAssistantExplanation: 'The bot detects simple intents and combines operational FAQs with real data such as appointments, blood inventory, emergency mode, reliability score, and last donation date to answer Donor questions.'
});

function format(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}



// Extra recommendation translation keys for pages that previously mixed Vietnamese/English literals.
Object.assign(labels.vi, {
  smartModule: 'Mô-đun thông minh',
  recommendationPageDesc: 'Cấu hình trọng số heuristic/adaptive để hệ thống đề xuất người hiến phù hợp nhất khi bệnh viện cần huy động máu.',
  saveWeights: 'Lưu trọng số',
  savingWeights: 'Đang lưu...',
  weightsSaved: 'Đã lưu cấu hình trọng số khuyến nghị.',
  weightsSaveFailed: 'Không thể lưu trọng số.',
  recommendationRunFailed: 'Không thể chạy khuyến nghị.',
  loadingRecommendationSettings: 'Đang tải cấu hình khuyến nghị...',
  weightingBasis: 'Cơ sở chấm điểm khuyến nghị',
  weightingBasisDesc: 'Trọng số được chuẩn hóa về tổng 1.0 và dựa trên nghiệp vụ hiến máu.',
  autoAdjustEmergency: 'Tự điều chỉnh khi khẩn cấp',
  bloodMatchNote: 'Quan trọng nhất: người hiến phải tương thích nhóm máu đang cần.',
  eligibilityNote: 'Người hiến phải đủ điều kiện sức khỏe và đủ thời gian hiến lại.',
  reliabilityNote: 'Ưu tiên người ít hủy lịch và có lịch sử hoàn thành tốt.',
  humanitarianNote: 'Dựa trên điểm nhân đạo/gamification để khuyến khích người hiến tích cực.',
  emergencyAdaptiveWeights: 'Trọng số thích ứng khẩn cấp',
  emergencyAdaptiveWeightsDesc: 'Khi kho máu dưới ngưỡng nguy hiểm, hệ thống ưu tiên BloodMatch cao hơn để huy động đúng nhóm máu cần gấp.',
  runRecommendationDesc: 'Chọn nhóm máu cần huy động và số lượng người hiến muốn đề xuất.',
  topN: 'Top N',
  running: 'Đang chạy...',
  mode: 'Chế độ',
  noSuitableDonor: 'Chưa có người hiến phù hợp với nhóm máu này.',
  eligibleInDays: 'Đủ điều kiện sau {days} ngày',
  correctBloodType: 'Đúng nhóm máu hoặc tương thích truyền máu.',
  enoughRecovery: 'Đủ ngày nghỉ và đạt điều kiện sức khỏe.',
  reliableHistory: 'Dựa trên tỷ lệ đến đúng hẹn và hoàn thành.',
  humanitarianHistory: 'Dựa trên điểm nhân đạo, huy hiệu và lịch sử đóng góp.'
});
Object.assign(labels.en, {
  smartModule: 'Smart Module',
  recommendationPageDesc: 'Configure heuristic/adaptive weights so the system recommends the most suitable donors when the hospital needs blood mobilization.',
  saveWeights: 'Save Weights',
  savingWeights: 'Saving...',
  weightsSaved: 'Recommendation weight settings saved.',
  weightsSaveFailed: 'Unable to save recommendation weights.',
  recommendationRunFailed: 'Unable to run recommendation.',
  loadingRecommendationSettings: 'Loading recommendation settings...',
  weightingBasis: 'Recommendation Weighting Basis',
  weightingBasisDesc: 'Weights are normalized to 1.0 and based on blood donation domain logic.',
  autoAdjustEmergency: 'Auto-adjust in Emergency Mode',
  bloodMatchNote: 'Most important: the donor must match the needed blood type.',
  eligibilityNote: 'The donor must be medically eligible and recovered enough to donate again.',
  reliabilityNote: 'Prioritize donors with fewer cancellations and better completion history.',
  humanitarianNote: 'Uses humanitarian points/gamification to encourage active donors.',
  emergencyAdaptiveWeights: 'Emergency Adaptive Weights',
  emergencyAdaptiveWeightsDesc: 'When stock is below the critical threshold, the system increases BloodMatch priority to mobilize the exact needed blood type.',
  runRecommendationDesc: 'Choose the needed blood type and how many donors to recommend.',
  topN: 'Top N',
  running: 'Running...',
  mode: 'Mode',
  noSuitableDonor: 'No suitable donors found for this blood type.',
  eligibleInDays: 'Eligible in {days} days',
  correctBloodType: 'Matching or compatible blood type.',
  enoughRecovery: 'Enough recovery time and health eligibility.',
  reliableHistory: 'Based on punctual arrival and completion history.',
  humanitarianHistory: 'Based on humanitarian points, badges, and contribution history.'
});


// Role-specific settings translation keys
Object.assign(labels.vi, {
  hospitalSettingsTitle: 'Cài đặt bệnh viện',
  donorSettingsTitle: 'Cài đặt người hiến',
  hospitalSettingsIntro: 'Chỉ hiển thị các cấu hình dành cho tài khoản Hospital: tài khoản quản trị, thông báo vận hành, ảnh trang chủ, ngưỡng khẩn cấp, trọng số khuyến nghị và xuất báo cáo.',
  donorSettingsIntro: 'Chỉ hiển thị các cấu hình dành cho người hiến: hồ sơ cá nhân, nhóm máu, thông báo cá nhân, tùy chọn sẵn sàng hiến và giao diện.',
  hospitalAccountInfo: 'Thông tin tài khoản Hospital',
  hospitalAccountInfoDesc: 'Thông tin định danh của tài khoản quản trị bệnh viện. Không chứa trường nhóm máu của người hiến.',
  donorPersonalInfo: 'Thông tin cá nhân người hiến',
  hospitalDisplayName: 'Tên hiển thị bệnh viện',
  hospitalSecureAccountNote: 'Tài khoản Hospital dùng email/số điện thoại và mật khẩu mã hóa, nên chỉ cấu hình các chức năng quản trị bệnh viện.',
  donorSettingsOnlyNote: 'Phần này chỉ dành cho Donor: trạng thái sẵn sàng hiến và nhắc lịch hẹn cá nhân.',
  donorPrivacyScope: 'Phạm vi quyền của người hiến',
  donorPrivacyScopeDesc: 'Donor chỉ chỉnh hồ sơ cá nhân và tùy chọn nhận thông báo của chính mình.',
  donorCanOnlyEditSelf: 'Donor chỉ được đổi avatar, số điện thoại, họ tên và nhóm máu của tài khoản hiện tại.',
  donorReceivesOnlyRelevantAlerts: 'Donor nhận thông báo liên quan đến lịch hẹn, đủ điều kiện hiến lại và chiến dịch khẩn cấp phù hợp.',
  hospitalNotificationSettings: 'Thông báo vận hành bệnh viện',
  hospitalNotificationDesc: 'Các cảnh báo dành riêng cho Hospital: kho máu, lịch hẹn mới và tình trạng khẩn cấp.',
  donorNotificationSettings: 'Thông báo dành cho người hiến',
  donorNotificationDesc: 'Các thông báo cá nhân dành cho Donor: nhắc lịch, chiến dịch phù hợp và cảnh báo thiếu máu.',
  inventoryLowStockAlerts: 'Cảnh báo kho máu dưới ngưỡng',
  newAppointmentAlerts: 'Thông báo lịch hẹn mới',
  hospitalExportSettings: 'Cấu hình xuất báo cáo',
  hospitalExportSettingsDesc: 'Chỉ Hospital cần cấu hình định dạng export cho danh sách donor, lịch hẹn và báo cáo vận hành.',
  hospitalExportOnlyNote: 'Chức năng export chỉ xuất hiện ở Hospital vì liên quan dữ liệu vận hành và quản trị.'
});

Object.assign(labels.en, {
  hospitalSettingsTitle: 'Hospital Settings',
  donorSettingsTitle: 'Donor Settings',
  hospitalSettingsIntro: 'Only Hospital-specific configuration is shown: admin account, operational notifications, homepage media, emergency thresholds, recommendation weights, and report export.',
  donorSettingsIntro: 'Only Donor-specific configuration is shown: personal profile, blood type, personal notifications, donation readiness, and appearance.',
  hospitalAccountInfo: 'Hospital Account Information',
  hospitalAccountInfoDesc: 'Identity information for the hospital admin account. Donor-only fields such as blood type are hidden.',
  donorPersonalInfo: 'Donor Personal Information',
  hospitalDisplayName: 'Hospital Display Name',
  hospitalSecureAccountNote: 'Hospital accounts use email/phone and encrypted password, so this page only shows hospital administration settings.',
  donorSettingsOnlyNote: 'This section is Donor-only: donation readiness and personal appointment reminders.',
  donorPrivacyScope: 'Donor Permission Scope',
  donorPrivacyScopeDesc: 'Donors can only edit their own profile and notification preferences.',
  donorCanOnlyEditSelf: 'Donors can only change their own avatar, phone number, name, and blood type.',
  donorReceivesOnlyRelevantAlerts: 'Donors receive alerts related to appointments, eligibility, and matching emergency campaigns.',
  hospitalNotificationSettings: 'Hospital Operational Notifications',
  hospitalNotificationDesc: 'Hospital-only alerts: blood inventory, new appointments, and emergency status.',
  donorNotificationSettings: 'Donor Notifications',
  donorNotificationDesc: 'Personal notifications for donors: reminders, matching campaigns, and blood shortage alerts.',
  inventoryLowStockAlerts: 'Low blood inventory alerts',
  newAppointmentAlerts: 'New appointment alerts',
  hospitalExportSettings: 'Report Export Settings',
  hospitalExportSettingsDesc: 'Only Hospital needs export settings for donor lists, appointment lists, and operational reports.',
  hospitalExportOnlyNote: 'Export settings are Hospital-only because they involve operational and administrative data.'
});

Object.assign(labels.vi, {
  screeningFormTitle: 'Phiếu sàng lọc người hiến',
  screeningFormSubtitle: '{name} · {bloodType} · {dateTime}',
  screeningNoData: 'Chưa có phiếu sàng lọc khi đặt lịch. Donor có thể chưa hoàn tất bước khai báo sức khỏe trực tuyến.',
  screeningSectionSummary: 'Kết luận sơ bộ',
  screeningSectionMetrics: 'Chỉ số & lịch sử hiến máu',
  screeningSectionHealth: 'Khai báo sức khỏe (khi đặt lịch)',
  screeningSectionRisks: 'Yếu tố nguy cơ khai báo',
  screeningSectionNote: 'Ghi chú hệ thống',
  screeningPreliminaryResult: 'Kết quả sàng lọc trực tuyến',
  screeningEligibleYes: 'Đủ điều kiện sơ bộ',
  screeningEligibleNo: 'Chưa đủ điều kiện sơ bộ',
  screeningEligibleUnknown: 'Chưa xác định / dữ liệu cũ',
  screeningEligibleNow: 'Có thể đăng ký ngay',
  screeningWeight: 'Cân nặng khai báo',
  screeningLastDonation: 'Lần hiến gần nhất (hệ thống)',
  screeningNextEligible: 'Có thể hiến lại từ',
  screeningFeelingHealthy: 'Cảm thấy khỏe mạnh',
  screeningAgeEligible: 'Đủ độ tuổi 18–60',
  screeningNoRiskRecorded: 'Không ghi nhận yếu tố nguy cơ nào',
  screeningRisksDeclared: 'Có {count} yếu tố cần tư vấn thêm',
  screeningDisclaimer: 'Đây là sàng lọc điều kiện nền khi đặt lịch. Các câu hỏi 24h trước ngày hiến (ăn uống, rượu bia, giấc ngủ…) sẽ được nhân viên y tế xác nhận lại tại bệnh viện.',
  screeningViewForm: 'Phiếu',
  screeningAnswerYes: 'Có / Đạt',
  screeningAnswerNo: 'Không / Không đạt',
  screeningNotProvided: 'Chưa khai báo',
  screeningReliability: 'Độ tin cậy',
  screeningLegacyData: 'Dữ liệu phiếu cũ (chỉ đọc)',
  screeningClose: 'Đóng',
  screeningRisk_medication: 'Đang dùng kháng sinh hoặc thuốc cần khai báo',
  screeningRisk_tattoo: 'Xăm trong 6 tháng gần đây',
  screeningRisk_surgery: 'Phẫu thuật trong 6 tháng gần đây',
  screeningRisk_pregnant: 'Đang mang thai hoặc vừa sinh con dưới 6 tháng',
  screeningRisk_fever: 'Sốt, ho, cảm cúm trong 14 ngày qua',
  screeningRisk_chronic: 'Bệnh mạn tính (tim mạch, huyết áp, tiểu đường…)',
  screeningRisk_faint: 'Từng ngất, co giật hoặc vấn đề về máu',
  screeningRisk_hepatitisExposure: 'Tiếp xúc viêm gan B/C, HIV trong 6 tháng',
  screeningRisk_unsafeSex: 'Quan hệ tình dục không an toàn trong 6 tháng',
  screeningRisk_prescription: 'Đang điều trị bệnh hoặc dùng thuốc theo đơn',
  screeningRisk_travelRisk: 'Đi từ vùng dịch bệnh trong 14 ngày',
  screeningRisk_otherHealthIssue: 'Tình trạng sức khỏe khác cần thông báo',
  screeningSafe_healthy: 'Cảm thấy khỏe mạnh tại thời điểm đăng ký',
  screeningSafe_ageEligible: 'Đủ độ tuổi hiến máu (18–60)',
  bloodTypeUnknown: 'Chưa rõ',
  screeningStepTitle: 'Sàng lọc điều kiện nền khi đặt lịch',
  screeningStepHint: 'Các câu hỏi 24h trước ngày hiến sẽ được xác nhận lại tại bệnh viện.',
  screeningChecking: 'Đang kiểm tra...',
  screeningNoPriorDonation: 'Chưa có lần hiến trước',
  screeningFirstTimeDonor: 'Người hiến mới',
  screeningNotEligibleTitle: 'Bạn hiện KHÔNG ĐỦ ĐIỀU KIỆN để hiến máu.',
  screeningEligibleTitle: 'Bạn tạm thời đủ điều kiện sàng lọc trực tuyến.',
  screeningEligibleHint: 'Kết quả cuối cùng vẫn cần được nhân viên y tế xác nhận tại điểm hiến máu.',
  screeningCannotContinue: 'Không đủ điều kiện để tiếp tục',
  screeningReasonWeight: 'Cân nặng tối thiểu nên từ 45kg trở lên để đăng ký trực tuyến.',
  screeningReasonHealthy: 'Bạn cần cảm thấy khỏe mạnh tại thời điểm đăng ký.',
  screeningReasonAge: 'Độ tuổi phù hợp để hiến máu là từ 18 đến 60 tuổi.',
  screeningReasonRisk: 'Có ít nhất một yếu tố nguy cơ cần được nhân viên y tế tư vấn thêm.',
  savedAllSettings: 'Đã lưu thông tin cá nhân và toàn bộ cài đặt.',
  loadingProfile: 'Đang tải hồ sơ từ máy chủ...',
  saveAllSettings: 'Lưu tất cả',
});

Object.assign(labels.en, {
  screeningFormTitle: 'Donor Pre-screening Form',
  screeningFormSubtitle: '{name} · {bloodType} · {dateTime}',
  screeningNoData: 'No screening form was saved when booking. The donor may not have completed online health declaration.',
  screeningSectionSummary: 'Preliminary conclusion',
  screeningSectionMetrics: 'Metrics & donation history',
  screeningSectionHealth: 'Health declaration (at booking)',
  screeningSectionRisks: 'Declared risk factors',
  screeningSectionNote: 'System note',
  screeningPreliminaryResult: 'Online screening result',
  screeningEligibleYes: 'Preliminarily eligible',
  screeningEligibleNo: 'Not preliminarily eligible',
  screeningEligibleUnknown: 'Unknown / legacy data',
  screeningEligibleNow: 'Eligible to register now',
  screeningWeight: 'Declared weight',
  screeningLastDonation: 'Last completed donation (system)',
  screeningNextEligible: 'Next eligible from',
  screeningFeelingHealthy: 'Feeling healthy',
  screeningAgeEligible: 'Age 18–60',
  screeningNoRiskRecorded: 'No risk factors recorded',
  screeningRisksDeclared: '{count} factor(s) need medical review',
  screeningDisclaimer: 'This is baseline screening at booking time. Questions about the last 24 hours (food, alcohol, sleep, etc.) are confirmed again by medical staff at the hospital.',
  screeningViewForm: 'Form',
  screeningAnswerYes: 'Yes / Met',
  screeningAnswerNo: 'No / Not met',
  screeningNotProvided: 'Not provided',
  screeningReliability: 'Reliability',
  screeningLegacyData: 'Legacy form data (read-only)',
  screeningClose: 'Close',
  screeningRisk_medication: 'Taking antibiotics or medicines to declare',
  screeningRisk_tattoo: 'Tattoo within last 6 months',
  screeningRisk_surgery: 'Surgery within last 6 months',
  screeningRisk_pregnant: 'Pregnant or gave birth within last 6 months',
  screeningRisk_fever: 'Fever, cough, or flu in last 14 days',
  screeningRisk_chronic: 'Chronic illness (cardiovascular, hypertension, diabetes…)',
  screeningRisk_faint: 'History of fainting, seizures, or blood disorders',
  screeningRisk_hepatitisExposure: 'Contact with hepatitis B/C or HIV in last 6 months',
  screeningRisk_unsafeSex: 'Unsafe sex in last 6 months',
  screeningRisk_prescription: 'Under treatment or prescription medication',
  screeningRisk_travelRisk: 'Travel from epidemic area in last 14 days',
  screeningRisk_otherHealthIssue: 'Other health conditions to report',
  screeningSafe_healthy: 'Feeling healthy at registration time',
  screeningSafe_ageEligible: 'Age eligible for donation (18–60)',
  bloodTypeUnknown: 'Unknown',
  screeningStepTitle: 'Baseline screening when booking',
  screeningStepHint: 'Questions about the last 24 hours before donation are confirmed again at the hospital.',
  screeningChecking: 'Checking...',
  screeningNoPriorDonation: 'No prior donation on record',
  screeningFirstTimeDonor: 'First-time donor',
  screeningNotEligibleTitle: 'You are NOT currently eligible to donate.',
  screeningEligibleTitle: 'You are preliminarily eligible for online screening.',
  screeningEligibleHint: 'Final eligibility must still be confirmed by medical staff at the donation site.',
  screeningCannotContinue: 'Not eligible to continue',
  screeningReasonWeight: 'Minimum weight for online registration is 45 kg.',
  screeningReasonHealthy: 'You must feel healthy at the time of registration.',
  screeningReasonAge: 'Eligible age for donation is 18 to 60 years.',
  screeningReasonRisk: 'At least one risk factor requires further medical review.',
  savedAllSettings: 'Personal information and all settings saved.',
  loadingProfile: 'Loading profile from server...',
  saveAllSettings: 'Save all',
});

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
    window.addEventListener('sbdcs-auth-changed', refresh);
    return () => {
      window.removeEventListener('sbdcs-settings-changed', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('sbdcs-auth-changed', refresh);
    };
  }, []);
  return (key, vars = {}) => t(key, user, vars);
}
