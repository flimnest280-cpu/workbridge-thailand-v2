import React, { useState } from 'react';
import { 
  Briefcase, 
  User as UserIcon, 
  Shield, 
  Plus, 
  FileText, 
  Phone, 
  Globe, 
  LogOut, 
  CheckCircle, 
  X,
  Bell,
  Lock,
  HelpCircle,
  Bookmark,
  ChevronRight,
  Headphones,
  Info,
  Sparkles,
  Award,
  Building2,
  FileSignature,
  FileCheck,
  Smartphone,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, TranslationSet } from '../translations';
import { User, Job, Application, Notification } from '../lib/db';

interface MD3ProfileProps {
  currentUser: User;
  onUpdateUser: (updatedFields: Partial<User>) => Promise<void>;
  onSignOut: () => void;
  applications: Application[];
  jobs: Job[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationSet;
  setShowResumeBuilder: (show: boolean) => void;
}

export default function MD3Profile({
  currentUser,
  onUpdateUser,
  onSignOut,
  applications,
  jobs,
  notifications,
  markNotificationAsRead,
  lang,
  setLang,
  t,
  setShowResumeBuilder
}: MD3ProfileProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [lineId, setLineId] = useState(currentUser.lineId || '');
  
  // Employer specific company details (fallback/simulated on user object)
  const [companyName, setCompanyName] = useState((currentUser as any).companyName || '');
  const [companySize, setCompanySize] = useState((currentUser as any).companySize || '1-10');
  const [companyIndustry, setCompanyIndustry] = useState((currentUser as any).companyIndustry || 'Logistics & Warehouse');
  const [companyLocation, setCompanyLocation] = useState((currentUser as any).companyLocation || 'Bangkok');
  const [companyBio, setCompanyBio] = useState((currentUser as any).companyBio || '');

  // Privacy toggles
  const [profileVisible, setProfileVisible] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  // Contact Support states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const isEmployer = currentUser.role === 'employer';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<User> & Record<string, any> = {
      fullName: name,
      phone: phone,
      lineId: lineId
    };
    if (isEmployer) {
      updates.companyName = companyName;
      updates.companySize = companySize;
      updates.companyIndustry = companyIndustry;
      updates.companyLocation = companyLocation;
      updates.companyBio = companyBio;
    }
    await onUpdateUser(updates);
    setIsEditing(false);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportSubject('');
      setSupportMessage('');
      setActiveSection(null);
    }, 2500);
  };

  // Profile sections mapping
  const sections = [
    {
      id: 'personal',
      title: lang === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Information',
      subtitle: lang === 'th' ? 'จัดการชื่อ, เบอร์โทร และบัญชี' : 'Manage name, phone, and accounts',
      icon: <UserIcon className="w-5 h-5 text-blue-600" />,
      show: true
    },
    {
      id: 'resume',
      title: lang === 'th' ? 'เรซูเมและเอกสาร' : 'Resume & Documents',
      subtitle: lang === 'th' ? 'ประวัติย่อและผลงานเพื่อการสมัครงาน' : 'Job applications CV and portfolio',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      show: !isEmployer
    },
    {
      id: 'applied',
      title: lang === 'th' ? 'งานที่สมัครแล้ว' : 'Applied Jobs',
      subtitle: lang === 'th' ? 'ติดตามสถานะการยื่นใบสมัคร' : 'Track your job submission status',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      show: !isEmployer
    },
    {
      id: 'saved',
      title: lang === 'th' ? 'งานที่บันทึกไว้' : 'Saved Jobs',
      subtitle: lang === 'th' ? 'รายการตำแหน่งงานที่คุณสนใจ' : 'Positions you bookmarked',
      icon: <Bookmark className="w-5 h-5 text-amber-600" />,
      show: !isEmployer
    },
    {
      id: 'notifications',
      title: lang === 'th' ? 'การแจ้งเตือน' : 'Notifications',
      subtitle: lang === 'th' ? 'กล่องข้อความอัปเดตสถานะงาน' : 'Job updates and system inbox',
      icon: <Bell className="w-5 h-5 text-purple-600" />,
      show: true,
      badge: notifications.filter(n => n.userId === currentUser.id && !n.isRead).length
    },
    {
      id: 'language',
      title: lang === 'th' ? 'ภาษา' : 'Language Settings',
      subtitle: lang === 'th' ? 'เปลี่ยนภาษาของแอปพลิเคชัน' : 'Choose app displaying language',
      icon: <Globe className="w-5 h-5 text-sky-600" />,
      show: true,
      value: lang === 'th' ? 'ไทย (TH)' : lang === 'en' ? 'English (EN)' : lang === 'my' ? 'မြန်မာ (MY)' : lang === 'lo' ? 'ລາວ (LO)' : 'ខ្មែរ (KM)'
    },
    {
      id: 'privacy',
      title: lang === 'th' ? 'ความเป็นส่วนตัวและความปลอดภัย' : 'Privacy & Security',
      subtitle: lang === 'th' ? 'รหัสผ่านและความปลอดภัยสองชั้น' : 'Password and 2FA settings',
      icon: <Shield className="w-5 h-5 text-teal-600" />,
      show: true
    },
    {
      id: 'help',
      title: lang === 'th' ? 'ศูนย์ช่วยเหลือ' : 'Help Center',
      subtitle: lang === 'th' ? 'คำถามที่พบบ่อยและกฎหมายแรงงาน' : 'FAQ and Ministry of Labour regulations',
      icon: <HelpCircle className="w-5 h-5 text-rose-600" />,
      show: true
    },
    {
      id: 'support',
      title: lang === 'th' ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support',
      subtitle: lang === 'th' ? 'ส่งคำขอความช่วยเหลือตรงหาเจ้าหน้าที่' : 'Open a direct ticket with our support',
      icon: <Headphones className="w-5 h-5 text-orange-600" />,
      show: true
    },
    {
      id: 'about',
      title: lang === 'th' ? 'เกี่ยวกับ WorkBridge Thailand' : 'About WorkBridge Thailand',
      subtitle: lang === 'th' ? 'ใบอนุญาต ข้อมูลบริษัท และความโปร่งใส' : 'Licensing, compliance, and supervision info',
      icon: <Info className="w-5 h-5 text-slate-600" />,
      show: true
    }
  ];

  const unreadNotificationsCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* MATERIAL DESIGN 3 PROFILE HEADER */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-center relative overflow-hidden select-none">
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-50 to-indigo-50/70" />
          
          <div className="relative pt-4 flex flex-col items-center">
            {/* Large Circular Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-extrabold shadow-sm border-4 border-white">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border border-white shadow-xs">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name and Verification Badge */}
            <div className="mt-3 flex items-center gap-1.5 justify-center">
              <h4 className="text-sm font-black text-slate-800">{currentUser.fullName}</h4>
              <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-2 h-2 stroke-[3]" />
                <span>VERIFIED</span>
              </span>
            </div>

            {/* Role Display */}
            <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {isEmployer ? (
                <>
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{currentUser.companyName || 'Employer'} • Verified Recruiter</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span>Job Seeker • Active Candidate</span>
                </>
              )}
            </div>

            {/* Edit Profile Button */}
            <button
              type="button"
              id="md3-edit-profile-btn"
              onClick={() => setIsEditing(true)}
              className="mt-4 px-4 py-2 border border-slate-200 hover:border-blue-600 bg-white text-slate-700 hover:text-blue-700 font-bold text-[10px] rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>

        {/* PROFILE SECTIONS LIST */}
        <div className="bg-white border border-slate-100 rounded-2xl p-2.5 shadow-xs space-y-1">
          {sections.filter(s => s.show).map((s) => (
            <button
              key={s.id}
              id={`profile-section-item-${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl">
                  {s.icon}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{s.title}</h5>
                  <p className="text-[9px] text-slate-400 font-medium">{s.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {s.badge !== undefined && s.badge > 0 && (
                  <span className="bg-red-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    {s.badge} NEW
                  </span>
                )}
                {s.value && (
                  <span className="text-[9px] text-slate-400 bg-slate-100 font-extrabold px-2 py-0.5 rounded-md border border-slate-200/40">
                    {s.value}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </button>
          ))}
        </div>

        {/* FULL-WIDTH RED LOGOUT BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            id="md3-logout-button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer shadow-xs active:scale-98 border border-red-700/20"
          >
            <LogOut className="w-4 h-4" />
            <span>LOG OUT FROM ACCOUNT</span>
          </button>
        </div>

        {/* App Licensing Brand Footer */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4 border-t border-slate-100 space-y-1 select-none opacity-80">
          <img 
            src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
            alt="WorkBridge Thailand Logo" 
            className="w-9 h-9 object-contain rounded-lg border border-slate-200/80 bg-white"
            referrerPolicy="no-referrer"
          />
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">WorkBridge Thailand</div>
            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Licensed Overseas Employment Agency</p>
          </div>
        </div>

      </div>

      {/* DETAIL MODALS FOR INDIVIDUAL SECTIONS */}
      <AnimatePresence>
        {activeSection && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex flex-col justify-end">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-3xl max-h-[85%] flex flex-col shadow-2xl overflow-hidden border-t border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                    {sections.find(s => s.id === activeSection)?.icon}
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {sections.find(s => s.id === activeSection)?.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* 1. PERSONAL INFORMATION */}
                {activeSection === 'personal' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1 text-slate-700">
                      <h5 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Verification Standard</h5>
                      <p className="text-[9px] leading-relaxed font-semibold">Your account details are bound with verified mobile numbers and secure passport files reported to employment authorities.</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Verification ID</span>
                          <span className="font-bold text-slate-800">WB-{currentUser.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Verification Status</span>
                          <span className="font-black text-emerald-600 uppercase">ACTIVE VERIFIED</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Full Registered Name</span>
                        <span className="font-bold text-slate-800 text-[11px]">{currentUser.fullName}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Registered Phone Contact</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">{currentUser.phone}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Line ID contact</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">{currentUser.lineId || 'None Provided'}</span>
                      </div>

                      {isEmployer && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Recruiter specifications</span>
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-600">
                            <div>Company: <span className="text-slate-800 font-bold">{companyName}</span></div>
                            <div>Industry: <span className="text-slate-800 font-bold">{companyIndustry}</span></div>
                            <div>Location: <span className="text-slate-800 font-bold">{companyLocation}</span></div>
                            <div>Employees: <span className="text-slate-800 font-bold">{companySize}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. RESUME & DOCUMENTS */}
                {activeSection === 'resume' && (
                  <div className="space-y-4">
                    {/* Launch AI Resume CTA */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-white/15 rounded-lg text-white">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black uppercase tracking-wider">AI Resume Builder</h4>
                          <p className="text-[9px] leading-relaxed text-blue-100 font-medium">Create and refine an ATS-optimized, professional English and Thai resume in seconds using our integrated Gemini AI assistant.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection(null);
                              setShowResumeBuilder(true);
                            }}
                            className="mt-2.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-slate-50 rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          >
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>LAUNCH RESUME ENGINE</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Standard Resume Upload */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center space-y-3">
                      <FileSignature className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-700">Attach Custom Resume / Documents</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5">PDF, DOCX, or Image file (Max 10MB)</p>
                      </div>
                      <div className="flex justify-center">
                        <label className="bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[9px] px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer uppercase tracking-wider shadow-2xs">
                          <span>Choose Document File</span>
                          <input type="file" className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. APPLIED JOBS */}
                {activeSection === 'applied' && (
                  <div className="space-y-3">
                    {applications.filter(a => a.seekerId === currentUser.id).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 space-y-2">
                        <Briefcase className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold">You haven't applied to any positions yet</p>
                      </div>
                    ) : (
                      applications
                        .filter(a => a.seekerId === currentUser.id)
                        .map((app) => {
                          const job = jobs.find(j => j.id === app.jobId);
                          return (
                            <div key={app.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800">{job?.title || 'Unknown Job Position'}</h4>
                                  <p className="text-[9px] text-slate-500">{job?.location || 'Thailand'} • Fee: ฿{job?.applicationFee || 0}</p>
                                </div>
                                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                  app.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : app.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {app.status === 'approved' ? 'Approved / Hired' : app.status === 'rejected' ? 'Declined' : 'Pending Review'}
                                </span>
                              </div>
                              <div className="text-[8px] text-slate-400 flex justify-between pt-1 border-t border-slate-200/40">
                                <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                                <span className="font-mono">ID: {app.id.substring(0,8).toUpperCase()}</span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* 4. SAVED JOBS */}
                {activeSection === 'saved' && (
                  <div className="space-y-3">
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No saved jobs found</p>
                      <p className="text-[9px] leading-relaxed max-w-xs mx-auto">Bookmark positions during job hunting to view and compare details before submitting documents.</p>
                    </div>
                  </div>
                )}

                {/* 5. NOTIFICATIONS */}
                {activeSection === 'notifications' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{unreadNotificationsCount} Unread Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            // Mark all read simulation
                            const myNotifs = notifications.filter(n => n.userId === currentUser.id && !n.isRead);
                            Promise.all(myNotifs.map(n => markNotificationAsRead(n.id)));
                          }}
                          className="text-[9px] font-black text-blue-600 hover:text-blue-800 cursor-pointer uppercase"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-xs font-semibold">No notifications yet</p>
                        </div>
                      ) : (
                        notifications
                          .filter(n => n.userId === currentUser.id)
                          .map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                if (!n.isRead) markNotificationAsRead(n.id);
                              }}
                              className={`p-3 rounded-xl border text-[10px] transition-all cursor-pointer ${
                                n.isRead 
                                  ? 'bg-slate-50/70 border-slate-150 text-slate-600' 
                                  : 'bg-blue-50/50 border-blue-100 text-blue-950 font-medium'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold">{n.title}</span>
                                <span className="text-[8px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="mt-1 text-slate-500 leading-normal font-semibold">{n.message}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* 6. LANGUAGE SETTINGS */}
                {activeSection === 'language' && (
                  <div className="space-y-3 pb-4">
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold mb-3">
                      Select your preferred system translation. WorkBridge offers multi-language localization supporting Thai, Myanmar, and regional employment needs.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { code: 'en', label: 'English (EN)', flag: '🇬🇧' },
                        { code: 'th', label: 'ไทย (TH)', flag: '🇹🇭' },
                        { code: 'my', label: 'မြန်မာ (MY)', flag: '🇲🇲' },
                        { code: 'lo', label: 'ລາວ (LO)', flag: '🇱🇦' },
                        { code: 'km', label: 'ខ្មែរ (KM)', flag: '🇰🇭' }
                      ].map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLang(l.code as Language);
                            localStorage.setItem('workbridge_lang', l.code);
                          }}
                          className={`py-3 px-4 text-xs font-bold rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                            lang === l.code
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-sm shrink-0">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. PRIVACY & SECURITY */}
                {activeSection === 'privacy' && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold">Configure account privacy, sign-in layers, and compliance visibility standards.</p>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <div>
                          <h6 className="font-bold text-slate-800">Public Profile Visibility</h6>
                          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Let employers and headhunters find your CV card</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={profileVisible} 
                          onChange={(e) => setProfileVisible(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <div>
                          <h6 className="font-bold text-slate-800">Biometric Authentication</h6>
                          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Use FaceID or Fingerprint on supported devices</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={biometrics} 
                          onChange={(e) => setBiometrics(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <div>
                          <h6 className="font-bold text-slate-800">Secure Two-Factor OTP</h6>
                          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Require an OTP code verification code for logins</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={twoFactor} 
                          onChange={(e) => setTwoFactor(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. HELP CENTER */}
                {activeSection === 'help' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-950 text-xs font-semibold leading-relaxed">
                      Need immediate legal or compliance verification? Consult the guides regarding cross-border employment supervised under Ministry of Labour standards.
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <h6 className="font-bold text-slate-800">1. What are the legal requirements for Myanmar workers in Thailand?</h6>
                        <p className="text-[9px] text-slate-500 leading-normal font-semibold">Under the MoU (Memorandum of Understanding) bilateral agreement, Myanmar workers must hold active passports, work permits, and social security cards supervised by both Ministry departments.</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <h6 className="font-bold text-slate-800">2. How long does the job visa approval cycle take?</h6>
                        <p className="text-[9px] text-slate-500 leading-normal font-semibold">Usually, document compilation takes 14-21 business days, followed by biometric evaluation at Thai-Myanmar border entry hubs (Mae Sot, Ranong, Mae Sai).</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <h6 className="font-bold text-slate-800">3. Is there an application handling fee limit?</h6>
                        <p className="text-[9px] text-slate-500 leading-normal font-semibold">Yes, standard service fees are regulated and must not exceed legal thresholds as dictated by Ministry of Labour ordinances.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. CONTACT SUPPORT */}
                {activeSection === 'support' && (
                  <div className="space-y-4">
                    {supportSubmitted ? (
                      <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 space-y-2">
                        <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
                        <h5 className="text-xs font-bold uppercase tracking-wider">Ticket Submitted Successfully</h5>
                        <p className="text-[10px] font-semibold">Your support query has been logged (ID: #{Math.floor(100000 + Math.random() * 900000)}). Our officers will review and contact you on LINE or phone.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSupportSubmit} className="space-y-4 pb-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Official Helpdesks</span>
                          <span className="font-bold text-slate-800 text-[9px] block mt-0.5">Bangkok Main: +66 (0) 2 123 4567 • Yangon Hub: +95 (0) 1 987 6543</span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Subject / Issue Title</label>
                          <input 
                            type="text" 
                            required
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                            placeholder="e.g., MOU permit status error"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Detailed Description</label>
                          <textarea 
                            required
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            rows={3}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                            placeholder="Please provide passport number, employer details, or relevant transaction codes..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center uppercase tracking-wider"
                        >
                          Submit Support Ticket
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 10. ABOUT WORKBRIDGE THAILAND */}
                {activeSection === 'about' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                      <img 
                        src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
                        alt="WorkBridge Thailand Logo" 
                        className="w-14 h-14 object-contain rounded-xl bg-white shadow-xs border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-center">
                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">WorkBridge Thailand</h5>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Version 3.2.0 (Active Production)</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">Official Supervision & Licensing</span>
                        <p className="text-[9px] text-slate-600 leading-relaxed font-semibold">
                          WorkBridge Thailand is an officially licensed and registered overseas employment agency, complying fully with directives, inspections, and regulations of the <span className="text-slate-800 font-bold">Ministry of Labour (Government of Thailand)</span> and the <span className="text-slate-800 font-bold">Ministry of Labour, Immigration and Population (Government of the Republic of the Union of Myanmar)</span>.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">Compliance Guarantee</span>
                        <p className="text-[9px] text-slate-600 leading-relaxed font-semibold">
                          All employment contracts, cross-border visa transactions, worker biometric reporting lists, and job matching activities processed through this platform are archived securely under bilateral MOU guidelines.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                        <span className="text-[8px] text-slate-400 font-black uppercase">App Registration Details</span>
                        <p className="text-[9px] text-slate-600 font-mono font-semibold">
                          Licence No: WB-MOU-2026-990812<br />
                          Office: AIA Sathorn Tower, 11th Floor, Bangkok 10120<br />
                          Contact: contact@workbridge.co.th
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-[110] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-150 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Edit Profile Details</h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Registered Name *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone Contact *</label>
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">LINE ID contact</label>
                  <input 
                    type="text" 
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                    placeholder="e.g., lineuser123"
                  />
                </div>

                {isEmployer && (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Recruiter & Company Profile</span>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 mb-1">Company Registered Name</label>
                      <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-[11px] border border-slate-200 rounded-md p-2 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-700 mb-1">Company Size (Employees)</label>
                        <select 
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          className="w-full text-[11px] border border-slate-200 rounded-md p-2 bg-white"
                        >
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="200+">200+ employees</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-700 mb-1">Company Location</label>
                        <input 
                          type="text" 
                          value={companyLocation}
                          onChange={(e) => setCompanyLocation(e.target.value)}
                          className="w-full text-[11px] border border-slate-200 rounded-md p-2 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 mb-1">Company Industry</label>
                      <input 
                        type="text" 
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        className="w-full text-[11px] border border-slate-200 rounded-md p-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 mb-1">Company Overview / Bio</label>
                      <textarea 
                        value={companyBio}
                        onChange={(e) => setCompanyBio(e.target.value)}
                        rows={2}
                        className="w-full text-[11px] border border-slate-200 rounded-md p-2 bg-white"
                        placeholder="Describe your company and core vacancies..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
