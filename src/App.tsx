import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  User as UserIcon, 
  Users,
  ClipboardList,
  Shield, 
  MapPin, 
  Plus, 
  FileText, 
  CreditCard, 
  Phone, 
  Globe, 
  Smartphone, 
  Layout, 
  LogOut, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  DollarSign, 
  ChevronRight, 
  Database, 
  ExternalLink,
  ChevronLeft,
  BookOpen,
  Check,
  Send,
  Building,
  X,
  Bell,
  Lock,
  HelpCircle,
  Bookmark,
  TrendingUp,
  BarChart2,
  Settings,
  Headphones,
  UserCheck,
  FileSignature,
  Heart,
  Activity,
  Award,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language, TranslationSet } from './translations';
import { db, User, Employer, Job, Application, Payment, Notification } from './lib/db';
import { generateSeedJobs } from './lib/seed_data';
import MapSelector, { THAI_HUBS } from './components/MapSelector';
import PaymentModal from './components/PaymentModal';
import ExternalJobs, { ExternalJob } from './components/ExternalJobs';
import { AdminUsersView } from './components/AdminUsersView';
import ChatSystem from './components/ChatSystem';
import AIChatBot from './components/AIChatBot';
import AIResumeBuilder from './components/AIResumeBuilder';
import MD3Profile from './components/MD3Profile';
import EmployerWorkflows from './components/EmployerWorkflows';
import { checkAndAutoRefreshAggregator, fetchAndAggregateJobs, APPROVED_SOURCES } from './lib/aggregator';
import { RefreshCw, Search, Filter, MessageSquare, Sparkles, Menu, Wifi, WifiOff } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  // Localization State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('workbridge_lang') as Language;
    if (saved && ['en', 'th', 'my', 'lo', 'km'].includes(saved)) {
      return saved;
    }
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && ['en', 'th', 'my', 'lo', 'km'].includes(browserLang)) {
      return browserLang as Language;
    }
    return 'en';
  });
  const t = translations[lang];

  // Database State
  const [users, setUsers] = useState<User[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // App Viewport State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>('12:00 PM');

  // Supabase Configuration Panel State
  const [isDbSettingOpen, setIsDbSettingOpen] = useState<boolean>(false);
  const [dbUrl, setDbUrl] = useState<string>('');
  const [dbAnonKey, setDbAnonKey] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'testing' | 'missing_tables' | 'invalid_credentials'>('disconnected');

  // Seeding State
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'seeker' | 'employer'>('seeker');
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCompany, setRegCompany] = useState<string>('');
  const [regLineId, setRegLineId] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Phone OTP Auth State
  const [loginAuthMode, setLoginAuthMode] = useState<'password' | 'otp'>('password');
  const [loginOtpSent, setLoginOtpSent] = useState<boolean>(false);
  const [loginOtpCode, setLoginOtpCode] = useState<string>('');
  const [loginOtpCountdown, setLoginOtpCountdown] = useState<number>(0);

  // Main App Navigation State (inside mobile frame)
  // Seekers: 'jobs' | 'external' | 'applied' | 'profile'
  // Employers: 'myjobs' | 'post' | 'profile'
  // Admin: 'dashboard' | 'verify' | 'database'
  const [activeTab, setActiveTab] = useState<string>('jobs');
  const [appliedSubTab, setAppliedSubTab] = useState<'applications' | 'external'>('applications');
  const [showResumeBuilder, setShowResumeBuilder] = useState<boolean>(false);
  const [showNavigationDrawer, setShowNavigationDrawer] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Material Design 3 Profile & Employer State
  const [selectedProfileSection, setSelectedProfileSection] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editLineId, setEditLineId] = useState<string>('');
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [editCompanySize, setEditCompanySize] = useState<string>('1-10');
  const [editCompanyIndustry, setEditCompanyIndustry] = useState<string>('Logistics & Warehouse');
  const [editCompanyLocation, setEditCompanyLocation] = useState<string>('Bangkok');
  const [editCompanyBio, setEditCompanyBio] = useState<string>('');

  // Network connectivity status state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showSyncInfoModal, setShowSyncInfoModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile details with current user on load/role-change
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.fullName || '');
      setEditPhone(currentUser.phone || '');
      setEditLineId(currentUser.lineId || '');
      setEditCompanyName(currentUser.companyName || '');
      setEditCompanySize(currentUser.companySize || '1-10');
      setEditCompanyIndustry(currentUser.companyIndustry || 'Logistics & Warehouse');
      setEditCompanyLocation(currentUser.companyLocation || 'Bangkok');
      setEditCompanyBio(currentUser.companyBio || '');
    }
  }, [currentUser]);

  // Job Search/Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [filterMinSalary, setFilterMinSalary] = useState<number>(0);
  const [isAggregatorSyncing, setIsAggregatorSyncing] = useState<boolean>(false);

  // Pagination & Infinite Scroll State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [browseMode, setBrowseMode] = useState<'pagination' | 'infinite'>('infinite');
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(15);

  // AI Job Matching State
  const [jobsSubTab, setJobsSubTab] = useState<'all' | 'matching'>('all');
  const [matchSkills, setMatchSkills] = useState<string>(() => localStorage.getItem('wb_match_skills') || 'Construction, General labor');
  const [matchSalary, setMatchSalary] = useState<number>(() => parseInt(localStorage.getItem('wb_match_salary') || '15000') || 15000);
  const [matchProvince, setMatchProvince] = useState<string>(() => localStorage.getItem('wb_match_province') || 'Bangkok');
  const [matchExperience, setMatchExperience] = useState<number>(() => parseInt(localStorage.getItem('wb_match_experience') || '2') || 2);
  const [isMatchingLoading, setIsMatchingLoading] = useState<boolean>(false);
  const [matchedJobsList, setMatchedJobsList] = useState<any[]>(() => {
    const saved = localStorage.getItem('wb_matched_jobs_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Reset pagination/infinite scroll when filters change
  useEffect(() => {
    setCurrentPage(1);
    setVisibleItemsCount(15);
  }, [searchQuery, filterLocation, filterCategory, filterSource, filterMinSalary, jobsSubTab]);

  // Admin Search/Filter States
  const [adminUserSearch, setAdminUserSearch] = useState<string>('');
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState<'all' | 'seeker' | 'employer' | 'admin'>('all');
  const [adminAppSearch, setAdminAppSearch] = useState<string>('');
  const [adminAppStatusFilter, setAdminAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminJobSearch, setAdminJobSearch] = useState<string>('');
  const [adminJobStatusFilter, setAdminJobStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');

  // Selected Job Details State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Saved External Jobs State (Job Seeker Hub)
  const [savedExternalJobs, setSavedExternalJobs] = useState<ExternalJob[]>(() => {
    const saved = localStorage.getItem('wb_saved_external_jobs');
    return saved ? JSON.parse(saved) : [];
  });

  const handleImportExternalJob = (extJob: ExternalJob) => {
    if (!currentUser) return;
    
    // Avoid duplicates
    if (savedExternalJobs.some(j => j.id === extJob.id)) return;
    
    const updated = [...savedExternalJobs, extJob];
    setSavedExternalJobs(updated);
    localStorage.setItem('wb_saved_external_jobs', JSON.stringify(updated));
    
    // Add a welcoming notification for the user
    db.createNotification({
      userId: currentUser.id,
      title: 'External Job Saved! 💼',
      message: `Saved "${extJob.title}" at "${extJob.company}" to your profile. View original anytime.`
    }).then(refreshData).catch(err => console.warn("Failed to create notification:", err));
  };

  const handleRemoveExternalJob = (jobId: string) => {
    const updated = savedExternalJobs.filter(j => j.id !== jobId);
    setSavedExternalJobs(updated);
    localStorage.setItem('wb_saved_external_jobs', JSON.stringify(updated));
  };
  
  // Application State
  const [appDocs, setAppDocs] = useState<string[]>([]);
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantPhone, setApplicantPhone] = useState<string>('');
  const [applicantLineId, setApplicantLineId] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [activePaymentJob, setActivePaymentJob] = useState<Job | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Post Job State
  const [postTitle, setPostTitle] = useState<string>('');
  const [postSalary, setPostSalary] = useState<number>(15000);
  const [postAddress, setPostAddress] = useState<string>('');
  const [postLocation, setPostLocation] = useState<string>('Bangkok');
  const [postLat, setPostLat] = useState<number>(13.7563);
  const [postLng, setPostLng] = useState<number>(100.5018);
  const [postRequiredDocs, setPostRequiredDocs] = useState<string[]>(['passport']);
  const [postFee, setPostFee] = useState<number>(1000);
  const [postPhone, setPostPhone] = useState<string>('');
  const [postLine, setPostLine] = useState<string>('');
  const [postDescription, setPostDescription] = useState<string>('');
  const [postVacancies, setPostVacancies] = useState<number>(1);
  const [postCategory, setPostCategory] = useState<string>('General');
  const [postSuccess, setPostSuccess] = useState<string>('');
  const [postError, setPostError] = useState<string>('');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);

  // Splash Screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Job Aggregator Hourly Auto-Refresh Scheduler
  useEffect(() => {
    // Initial check on mount
    checkAndAutoRefreshAggregator(() => {
      refreshData();
    });

    // Background interval check every minute for hourly trigger
    const interval = setInterval(() => {
      checkAndAutoRefreshAggregator(() => {
        refreshData();
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch initial data once on mount
  useEffect(() => {
    refreshData();
    
    // Simulate real phone clock
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Close popup if inside OAuth callback flow
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_callback') === 'true' || window.location.hash.includes('access_token=')) {
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
        window.close();
      }
    }

    // Listen for OAuth Success Messages
    const handleOauthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        try {
          const sessionUser = await db.getCurrentUserFromSession();
          if (sessionUser) {
            setCurrentUser(sessionUser);
            if (sessionUser.role === 'seeker') {
              setActiveTab('jobs');
            } else if (sessionUser.role === 'employer') {
              setActiveTab('myjobs');
            } else {
              setActiveTab('dashboard');
            }
          }
        } catch (err) {
          console.error("Error retrieving user from OAuth message:", err);
        }
      }
    };
    window.addEventListener('message', handleOauthMessage);

    // Load Supabase config if present
    const config = db.getSupabaseConfig();
    if (config.url) {
      setDbUrl(config.url);
      setDbAnonKey(config.anonKey);
      setDbStatus('testing');
      db.verifyConnection().then(async ({ status }) => {
        setDbStatus(status);
        refreshData();
        if (status === 'connected') {
          try {
            const sessionUser = await db.getCurrentUserFromSession();
            if (sessionUser) {
              setCurrentUser(sessionUser);
              if (sessionUser.role === 'seeker') {
                setActiveTab('jobs');
              } else if (sessionUser.role === 'employer') {
                setActiveTab('myjobs');
              } else {
                setActiveTab('dashboard');
              }
            }
          } catch (err) {
            console.error("Error retrieving initial session user:", err);
          }
        }
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleOauthMessage);
    };
  }, []);

  // Update HTML Lang tag dynamically and store in localStorage
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('workbridge_lang', lang);
  }, [lang]);

  // OTP countdown timer
  useEffect(() => {
    if (loginOtpCountdown > 0) {
      const timer = setTimeout(() => {
        setLoginOtpCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loginOtpCountdown]);

  // Sync applicant information and reset docs when selectedJob changes
  useEffect(() => {
    if (selectedJob && currentUser) {
      setApplicantName(currentUser.fullName || '');
      setApplicantPhone(currentUser.phone || '');
      setApplicantLineId(currentUser.lineId || '');
      setAppDocs([]); // Start checklist fresh
    }
  }, [selectedJob, currentUser]);

  // Real-time synchronization subscription
  useEffect(() => {
    let unsubUsers = () => {};
    let unsubJobs = () => {};
    let unsubApps = () => {};
    let unsubPayments = () => {};
    let unsubNotifs = () => {};

    if (dbStatus === 'connected' || db.isUsingSupabase()) {
      console.log("Setting up Supabase real-time subscriptions...");
      unsubUsers = db.subscribeToChanges('users', () => {
        console.log("Real-time: 'users' updated in Supabase.");
        refreshData();
      });
      unsubJobs = db.subscribeToChanges('jobs', () => {
        console.log("Real-time: 'jobs' updated in Supabase.");
        refreshData();
      });
      unsubApps = db.subscribeToChanges('applications', () => {
        console.log("Real-time: 'applications' updated in Supabase.");
        refreshData();
      });
      unsubPayments = db.subscribeToChanges('payments', () => {
        console.log("Real-time: 'payments' updated in Supabase.");
        refreshData();
      });
      unsubNotifs = db.subscribeToChanges('notifications', () => {
        console.log("Real-time: 'notifications' updated in Supabase.");
        refreshData();
      });
    }

    return () => {
      unsubUsers();
      unsubJobs();
      unsubApps();
      unsubPayments();
      unsubNotifs();
    };
  }, [dbStatus]);

  const refreshData = async () => {
    try {
      const u = await db.getUsers();
      const emp = await db.getEmployers();
      const j = await db.getJobs();
      const a = await db.getApplications();
      const p = await db.getPayments();
      const n = await db.getNotifications();
      setUsers(u);
      setEmployers(emp);
      setJobs(j);
      setApplications(a);
      setPayments(p);
      setNotifications(n);
    } catch (err) {
      console.error("Error updating WorkBridge data state:", err);
    }
  };

  const handleTestDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbStatus('testing');
    setTimeout(async () => {
      db.setSupabaseConfig(dbUrl, dbAnonKey);
      if (dbUrl && dbAnonKey) {
        const { status } = await db.verifyConnection();
        setDbStatus(status);
        refreshData();
      } else {
        setDbStatus('disconnected');
      }
    }, 1000);
  };

  const handleResetDatabase = () => {
    setDbUrl('');
    setDbAnonKey('');
    db.setSupabaseConfig('', '');
    setDbStatus('disconnected');
    setTimeout(() => {
      refreshData();
    }, 200);
  };

  const handleSeedFiveHundredJobs = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const seededJobs = generateSeedJobs();
      let successCount = 0;
      
      // Seed in chunks of 25 parallel requests for performance
      const chunkSize = 25;
      for (let i = 0; i < seededJobs.length; i += chunkSize) {
        const chunk = seededJobs.slice(i, i + chunkSize);
        const results = await Promise.all(
          chunk.map(async (job) => {
            const success = await db.upsertJob(job as any);
            return success;
          })
        );
        successCount += results.filter(Boolean).length;
      }
      
      setSeedMessage({
        success: true,
        text: `Successfully seeded ${successCount} out of 500 realistic Thailand jobs into ${db.isUsingSupabase() ? 'Supabase' : 'LocalStorage'}!`
      });
      refreshData();
    } catch (err: any) {
      console.error("Seeding failed:", err);
      setSeedMessage({
        success: false,
        text: `Seeding failed: ${err.message || String(err)}`
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearSeededJobs = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      if (db.isUsingSupabase()) {
        const client = (db as any).client;
        if (client) {
          const { error } = await client.from('jobs').delete().gte('id', '00000000-0000-4000-a000-000000000000').lte('id', '00000000-0000-4000-a000-999999999999');
          if (error) throw error;
        }
      } else {
        const localJobs = localStorage.getItem('wb_jobs');
        if (localJobs) {
          const parsed = JSON.parse(localJobs);
          const filtered = parsed.filter((j: any) => !j.id.startsWith('00000000-0000-4000-a000-'));
          localStorage.setItem('wb_jobs', JSON.stringify(filtered));
        }
      }
      setSeedMessage({
        success: true,
        text: "Successfully removed all seeded Thailand jobs!"
      });
      refreshData();
    } catch (err: any) {
      console.error("Clear seeding failed:", err);
      setSeedMessage({
        success: false,
        text: `Clear seeding failed: ${err.message || String(err)}`
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Auth Handlers
  const handleRequestOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginPhone) {
      setAuthError("Please enter a phone number first");
      return;
    }
    setLoginOtpSent(true);
    setLoginOtpCountdown(60);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (loginAuthMode === 'otp') {
        if (!loginOtpSent) {
          setAuthError("Please request an OTP first");
          return;
        }
        if (loginOtpCode !== '123456') {
          setAuthError("Invalid OTP code. Enter 123456 for demo.");
          return;
        }

        // Authenticate via Supabase OTP verification or local/transient fallback
        const user = await db.signInWithOtpVerify(loginPhone, loginOtpCode);
        setCurrentUser(user);
        await refreshData();

        if (user.role === 'seeker') {
          setActiveTab('jobs');
        } else if (user.role === 'employer') {
          setActiveTab('myjobs');
        } else {
          setActiveTab('dashboard');
        }
      } else {
        let user: User | null = null;
        if (db.isUsingSupabase()) {
          user = await db.signInWithPhoneAndPassword(loginPhone, loginPassword);
        } else {
          // Offline fallback
          const localUser = users.find(u => u.phone === loginPhone && u.password === loginPassword);
          if (localUser) {
            user = localUser;
          } else {
            throw new Error(t.invalidCredentials);
          }
        }

        if (user) {
          setCurrentUser(user);
          await refreshData();
          if (user.role === 'seeker') {
            setActiveTab('jobs');
          } else if (user.role === 'employer') {
            setActiveTab('myjobs');
          } else {
            setActiveTab('dashboard');
          }
        }
      }
    } catch (err: any) {
      console.error("Login failure:", err);
      setAuthError(err.message || "An error occurred during authentication");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regPhone || !regPassword || !regName) {
      setAuthError(t.requiredField);
      return;
    }

    // Check if phone exists locally if offline
    if (!db.isUsingSupabase() && users.some(u => u.phone === regPhone)) {
      setAuthError("Phone number already registered");
      return;
    }

    try {
      const newUser = await db.signUp({
        phone: regPhone,
        password: regPassword,
        role: regRole,
        fullName: regName,
        companyName: regRole === 'employer' ? regCompany : undefined,
        lineId: regLineId || undefined
      });

      setCurrentUser(newUser);
      await refreshData();
      if (newUser.role === 'seeker') {
        setActiveTab('jobs');
      } else {
        setActiveTab('myjobs');
      }
    } catch (err: any) {
      console.error("Registration failure:", err);
      setAuthError(err.message || "Failed to complete registration");
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'line' | 'tiktok') => {
    setAuthError('');
    setIsSocialLoading(provider);
    try {
      const socialUser = await db.signInWithSocial(provider);
      setCurrentUser(socialUser);
      await refreshData();
      if (socialUser.role === 'seeker') {
        setActiveTab('jobs');
      } else if (socialUser.role === 'employer') {
        setActiveTab('myjobs');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      console.error(`Social Auth Error with ${provider}:`, err);
      setAuthError(err.message || `Failed to authenticate with ${provider}.`);
    } finally {
      setIsSocialLoading(null);
    }
  };

  // Quick switch between demo roles (reviewer favorite!)
  const handleQuickSwitch = (role: 'seeker' | 'employer' | 'admin') => {
    let demoUser: User | undefined;
    if (role === 'seeker') {
      demoUser = users.find(u => u.phone === '0977777777') || users.find(u => u.role === 'seeker');
    } else if (role === 'employer') {
      demoUser = users.find(u => u.phone === '0811111111') || users.find(u => u.role === 'employer');
    } else {
      demoUser = users.find(u => u.phone === '0900000000') || users.find(u => u.role === 'admin');
    }

    if (demoUser) {
      setCurrentUser(demoUser);
      if (role === 'seeker') {
        setActiveTab('jobs');
      } else if (role === 'employer') {
        setActiveTab('myjobs');
      } else {
        setActiveTab('dashboard');
      }
      setSelectedJob(null);
    }
  };

  const handleRunAIMatching = async () => {
    if (isMatchingLoading) return;
    setIsMatchingLoading(true);

    // Save preferences
    localStorage.setItem('wb_match_skills', matchSkills);
    localStorage.setItem('wb_match_salary', matchSalary.toString());
    localStorage.setItem('wb_match_province', matchProvince);
    localStorage.setItem('wb_match_experience', matchExperience.toString());

    try {
      // We pass the currently active list of jobs (only active ones)
      const activeJobs = jobs.filter(j => j.status === 'active');
      const response = await fetch('/api/ai/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: matchSkills,
          salary: matchSalary,
          province: matchProvince,
          experience: matchExperience,
          jobs: activeJobs,
          lang: lang
        })
      });

      if (!response.ok) {
        throw new Error('AI match API call failed');
      }

      const data = await response.json();
      if (data && Array.isArray(data.matchedJobs)) {
        setMatchedJobsList(data.matchedJobs);
        localStorage.setItem('wb_matched_jobs_list', JSON.stringify(data.matchedJobs));
      }
    } catch (e) {
      console.error("AI Matching failed:", e);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob || !currentUser) return;
    setIsApplying(true);
    
    // Create new application
    await db.createApplication({
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      employerName: selectedJob.employerName,
      seekerId: currentUser.id,
      seekerName: applicantName.trim() || currentUser.fullName,
      seekerPhone: applicantPhone.trim() || currentUser.phone,
      seekerLineId: applicantLineId.trim() || currentUser.lineId || undefined,
      docsAttached: appDocs,
      receiptUrl: undefined // Needs payment uploader
    });

    refreshData();
    setIsApplying(false);
    
    // Set active payment target to immediately prompt payment uploader
    setActivePaymentJob(selectedJob);
    setShowPaymentModal(true);
    setSelectedJob(null);
  };

  const handleReceiptSubmit = async (receiptUrl: string) => {
    if (!currentUser || !activePaymentJob) return;

    // Find the application we just created
    const app = applications.find(
      a => a.jobId === activePaymentJob.id && a.seekerId === currentUser.id && !a.receiptUrl
    );

    if (app) {
      await db.updateApplicationReceipt(app.id, receiptUrl);
    } else {
      // Find latest application by this user for the job
      const userApps = applications.filter(a => a.jobId === activePaymentJob.id && a.seekerId === currentUser.id);
      if (userApps.length > 0) {
        await db.updateApplicationReceipt(userApps[userApps.length - 1].id, receiptUrl);
      }
    }

    setShowPaymentModal(false);
    setActivePaymentJob(null);
    setActiveTab('applied');
    refreshData();
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!postTitle || !postSalary || !postAddress || !postPhone) {
      setPostError("Please fill in all mandatory fields");
      return;
    }

    setPostError('');
    setPostSuccess('');

    try {
      await db.createJob({
        employerId: currentUser.id,
        employerName: currentUser.companyName || currentUser.fullName,
        title: postTitle,
        salary: postSalary,
        address: postAddress,
        location: postLocation,
        lat: postLat,
        lng: postLng,
        requiredDocs: postRequiredDocs,
        applicationFee: postFee,
        phoneContact: postPhone,
        lineIdContact: postLine,
        description: postDescription,
        vacancies: postVacancies,
        category: postCategory
      });

      setPostSuccess(t.saveSuccess);
      refreshData();

      // Reset Form
      setTimeout(() => {
        setPostTitle('');
        setPostSalary(15000);
        setPostAddress('');
        setPostLocation('Bangkok');
        setPostRequiredDocs(['passport']);
        setPostFee(1000);
        setPostPhone('');
        setPostLine('');
        setPostDescription('');
        setPostVacancies(1);
        setPostCategory('General');
        setPostSuccess('');
        setPostError('');
        setActiveTab('myjobs');
      }, 1200);
    } catch (err: any) {
      console.error("Job post failed:", err);
      setPostError(err?.message || "Failed to post job. Please try again.");
    }
  };

  const handleEditJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    await db.updateJob(editingJob.id, editingJob);
    setEditingJob(null);
    setPostSuccess("Job updated successfully");
    refreshData();
    setTimeout(() => {
      setPostSuccess('');
    }, 2000);
  };

  const handleApprovePayment = async (appId: string) => {
    await db.updateApplicationStatus(appId, 'approved');
    refreshData();
  };

  const handleRejectPayment = async (appId: string) => {
    await db.updateApplicationStatus(appId, 'rejected');
    refreshData();
  };

  const handleApproveJob = async (jobId: string) => {
    await db.updateJobStatus(jobId, 'active');
    refreshData();
  };

  const handleRejectJob = async (jobId: string) => {
    await db.updateJobStatus(jobId, 'rejected');
    refreshData();
  };

  const handleRemoveJob = async (jobId: string) => {
    await db.deleteJob(jobId);
    refreshData();
  };

  const handleApproveEmployer = async (empId: string) => {
    await db.updateEmployerStatus(empId, 'approved');
    refreshData();
  };

  const handleRejectEmployer = async (empId: string) => {
    await db.updateEmployerStatus(empId, 'rejected');
    refreshData();
  };

  const handleDeleteUser = async (userId: string) => {
    await db.deleteUser(userId);
    refreshData();
  };

  const handleUpdateUserRole = async (userId: string, role: 'seeker' | 'employer' | 'admin') => {
    await db.updateUserRole(userId, role);
    refreshData();
  };

  // Filter and Search job listings (Supports Search by: Job title, Province, Salary, Company, Category and Filters by Category, Location, Source)
  const filteredJobs = jobs.filter(job => {
    const titleMatch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = job.employerName.toLowerCase().includes(searchQuery.toLowerCase());
    const addressMatch = job.address.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = (job.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const salarySearchMatch = String(job.salary).includes(searchQuery);

    const matchesSearch = titleMatch || companyMatch || addressMatch || categoryMatch || locationMatch || salarySearchMatch;

    const matchesLocation = filterLocation === 'All' || job.location === filterLocation;

    const matchesCategory = filterCategory === 'All' || job.category === filterCategory;

    const matchesSource = 
      filterSource === 'All' ? true :
      filterSource === 'Direct' ? (!job.source || job.source === 'Direct' || job.source === 'WorkBridge') :
      job.source === filterSource;

    const matchesSalary = job.salary >= filterMinSalary;

    return matchesSearch && matchesLocation && matchesCategory && matchesSource && matchesSalary && job.status === 'active';
  });

  // Admin filtered jobs
  const adminFilteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(adminJobSearch.toLowerCase()) ||
                          job.employerName.toLowerCase().includes(adminJobSearch.toLowerCase()) ||
                          (job.description || '').toLowerCase().includes(adminJobSearch.toLowerCase());
    const matchesStatus = adminJobStatusFilter === 'all' || job.status === adminJobStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Admin filtered applications
  const adminFilteredApps = applications.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(adminAppSearch.toLowerCase()) ||
                          app.seekerName.toLowerCase().includes(adminAppSearch.toLowerCase()) ||
                          (app.seekerPhone || '').includes(adminAppSearch.toLowerCase());
    const matchesStatus = adminAppStatusFilter === 'all' || app.status === adminAppStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Admin filtered users
  const adminFilteredUsers = users.filter(u => {
    const matchesSearch = (u.fullName || '').toLowerCase().includes(adminUserSearch.toLowerCase()) ||
                          (u.phone || '').includes(adminUserSearch.toLowerCase()) ||
                          (u.lineId || '').toLowerCase().includes(adminUserSearch.toLowerCase());
    const matchesRole = adminUserRoleFilter === 'all' || u.role === adminUserRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate stats for Admin
  const totalApplications = applications.length;
  const pendingPayments = applications.filter(a => a.status === 'pending' && a.receiptUrl).length;
  const approvedSeekers = applications.filter(a => a.status === 'approved').length;
  const totalFeesCollected = applications
    .filter(a => a.status === 'approved')
    .reduce((sum, app) => {
      const job = jobs.find(j => j.id === app.jobId);
      return sum + (job ? job.applicationFee : 0);
    }, 0);

  // List of unique job locations for filtering
  const locationsList = ['All', ...Array.from(new Set(jobs.map(j => j.location)))];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans transition-all">
      
      {/* Top Banner & Quick Selector */}
      <div className="w-full bg-white border-b border-slate-200 p-3 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
              alt="WorkBridge Thailand Logo" 
              className="w-10 h-10 object-contain rounded-lg shadow-sm border border-slate-100 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-base font-extrabold font-display text-slate-900 tracking-tight">WorkBridge</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Thailand Operations</p>
            </div>
          </div>

          {/* Easy Role switcher for quick review */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-[10px] text-slate-400 mr-1 hidden md:inline">QUICK TEST:</span>
            <button 
              id="switch-seeker"
              onClick={() => handleQuickSwitch('seeker')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                currentUser?.role === 'seeker' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" /> Job Seeker
            </button>
            <button 
              id="switch-employer"
              onClick={() => handleQuickSwitch('employer')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                currentUser?.role === 'employer' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <Building className="w-3.5 h-3.5" /> Employer
            </button>
            <button 
              id="switch-admin"
              onClick={() => handleQuickSwitch('admin')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                currentUser?.role === 'admin' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> System Admin
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button 
              id="lang-en"
              onClick={() => setLang('en')}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${lang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              English
            </button>
            <button 
              id="lang-th"
              onClick={() => setLang('th')}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${lang === 'th' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ไทย
            </button>
            <button 
              id="lang-my"
              onClick={() => setLang('my')}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${lang === 'my' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              မြန်မာ
            </button>
            <button 
              id="lang-lo"
              onClick={() => setLang('lo')}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${lang === 'lo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ລາວ
            </button>
            <button 
              id="lang-km"
              onClick={() => setLang('km')}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${lang === 'km' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ខ្មែរ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Project Specs & Live Supabase Integration Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Supabase Connection Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-800" />
                <h2 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider">Supabase Connection</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {dbStatus === 'connected' ? 'Connected' :
                   dbStatus === 'missing_tables' ? 'Schema Missing' :
                   dbStatus === 'testing' ? 'Testing...' :
                   dbStatus === 'invalid_credentials' ? 'Connection Error' :
                   'Offline Mode'}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                  dbStatus === 'missing_tables' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                  dbStatus === 'testing' ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]' :
                  dbStatus === 'invalid_credentials' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                  'bg-slate-300'
                }`} />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connect this mockup app directly to your own Supabase database! Enter credentials below to enable live cloud synchronization. If left blank, WorkBridge falls back to high-fidelity LocalStorage storage.
            </p>

            {dbStatus === 'missing_tables' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">⚠️ Supabase Connected, but Tables are Missing!</p>
                <p className="leading-relaxed text-amber-700">
                  We successfully connected to your Supabase project, but could not find the required database tables. Please click the button below to display the <strong>SQL Schema</strong>, copy it, and run it in your <strong>Supabase SQL Editor</strong> to initialize the tables!
                </p>
                <button
                  type="button"
                  onClick={() => setIsDbSettingOpen(true)}
                  className="text-[10px] font-bold text-amber-900 underline hover:text-amber-950 block pt-1"
                >
                  Show SQL Schema Code →
                </button>
              </div>
            )}

            {dbStatus === 'invalid_credentials' && (
              <div className="bg-rose-50/80 border border-rose-100 rounded-lg p-3 text-[11px] text-rose-800 space-y-0.5">
                <p className="font-bold">❌ Connection Error</p>
                <p className="leading-relaxed text-rose-700">
                  Could not reach your Supabase endpoint. Please verify your <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong>, make sure there are no typos, and click Save & Sync again.
                </p>
              </div>
            )}

            {dbStatus === 'connected' && (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-3 text-[11px] text-emerald-800 space-y-0.5">
                <p className="font-bold">✅ Fully Synchronized!</p>
                <p className="leading-relaxed text-emerald-700">
                  Your WorkBridge application is successfully connected to your live cloud database. All jobs, applications, and payments are syncing in real time!
                </p>
              </div>
            )}

            <form onSubmit={handleTestDatabase} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">SUPABASE_URL</label>
                <input 
                  id="db-url-input"
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">SUPABASE_ANON_KEY</label>
                <input 
                  id="db-key-input"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={dbAnonKey}
                  onChange={(e) => setDbAnonKey(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  id="db-test-btn"
                  type="submit"
                  disabled={dbStatus === 'testing'}
                  className={`flex-1 text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    dbStatus === 'testing' 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {dbStatus === 'testing' ? 'Testing Sync...' : 'Save & Sync Connection'}
                </button>

                {(dbUrl || dbAnonKey) && (
                  <button
                    id="db-reset-btn"
                    type="button"
                    onClick={handleResetDatabase}
                    className="text-[11px] bg-white hover:bg-slate-50 text-slate-700 font-semibold px-2.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100">
              <button 
                id="db-schema-toggle"
                onClick={() => setIsDbSettingOpen(!isDbSettingOpen)}
                className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>{isDbSettingOpen ? 'Hide Database Schema Guide' : 'Show Required Supabase Tables Schema'}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${isDbSettingOpen ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDbSettingOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 space-y-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200"
                  >
                    <p className="font-semibold text-slate-700">Please create these 6 tables in your Supabase SQL editor:</p>
                    <pre className="p-2 bg-slate-900 rounded text-[9px] font-mono overflow-x-auto text-emerald-400 max-h-60 border border-slate-800">
{`-- 1. USERS TABLE
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'seeker' NOT NULL,
  full_name text NOT NULL,
  line_id text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. EMPLOYERS TABLE
CREATE TABLE employers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text UNIQUE NOT NULL,
  company_name text NOT NULL,
  phone text NOT NULL,
  line_id text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. JOBS TABLE
CREATE TABLE jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id text NOT NULL,
  employer_name text NOT NULL,
  title text NOT NULL,
  salary integer NOT NULL,
  address text NOT NULL,
  location text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  required_docs text NOT NULL, -- JSON array of strings or simple string
  application_fee integer NOT NULL,
  phone_contact text NOT NULL,
  line_id_contact text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  description text DEFAULT '' NOT NULL,
  vacancies integer DEFAULT 1 NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. APPLICATIONS TABLE
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  job_title text,
  employer_name text,
  seeker_id text NOT NULL,
  seeker_name text NOT NULL,
  seeker_phone text NOT NULL,
  seeker_line_id text,
  docs_attached text NOT NULL, -- JSON array of strings
  receipt_url text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id text UNIQUE NOT NULL,
  seeker_id text NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  slip_url text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CONVERSATIONS TABLE
CREATE TABLE conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id text NOT NULL,
  employer_id text NOT NULL,
  last_message text,
  last_message_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()),
  unread_by_seeker integer DEFAULT 0,
  unread_by_employer integer DEFAULT 0,
  seeker_typing boolean DEFAULT false,
  employer_typing boolean DEFAULT false,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. MESSAGES TABLE
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  recipient_id text NOT NULL,
  text text,
  file_url text,
  file_name text,
  file_type text,
  status text DEFAULT 'sent', -- 'sent', 'seen'
  is_deleted boolean DEFAULT false,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. CALLS TABLE
CREATE TABLE calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id text NOT NULL,
  receiver_id text NOT NULL,
  type text NOT NULL, -- 'voice', 'video'
  status text NOT NULL, -- 'ringing', 'accepted', 'rejected', 'missed', 'ended'
  duration integer DEFAULT 0, -- in seconds
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. BLOCKED_USERS TABLE
CREATE TABLE blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id text NOT NULL,
  blocked_id text NOT NULL,
  reason text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- 11. EXTERNAL_JOBS TABLE
CREATE TABLE external_jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  salary text NOT NULL,
  location text NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  description text NOT NULL,
  category text,
  language_required text,
  date_added text NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Chat tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Create Security Policies: Users can only see/modify their own conversations & messages
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid()::text = seeker_id OR auth.uid()::text = employer_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = seeker_id OR auth.uid()::text = employer_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid()::text = seeker_id OR auth.uid()::text = employer_id);

CREATE POLICY "Users can access messages of their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.seeker_id = auth.uid()::text OR conversations.employer_id = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.seeker_id = auth.uid()::text OR conversations.employer_id = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update messages they received or sent" ON messages
  FOR UPDATE USING (
    auth.uid()::text = sender_id OR auth.uid()::text = recipient_id
  );
`}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Guidelines / Help Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-xs text-slate-500 space-y-3 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              WorkBridge Thailand Features
            </h3>
            <ul className="space-y-2.5 list-none">
              <li className="flex gap-2"><span className="text-blue-500">•</span> <span><strong className="text-slate-800">Multi-Language:</strong> Instantly toggle English, Thai, and Myanmar (Burmese) translation sets.</span></li>
              <li className="flex gap-2"><span className="text-blue-500">•</span> <span><strong className="text-slate-800">Role Workflows:</strong> Seekers can browse, filter, map out positions, submit docs, and upload fees. Employers can post jobs, configure fees, and view applicant details. Admins verify payments.</span></li>
              <li className="flex gap-2"><span className="text-blue-500">•</span> <span><strong className="text-slate-800">Interactive Pinning:</strong> Mock Google Maps with draggable pins, coordinates, and local hub helpers.</span></li>
              <li className="flex gap-2"><span className="text-blue-500">•</span> <span><strong className="text-slate-800">PromptPay QR:</strong> Dynamically calculates fee and layers details directly onto a scan panel.</span></li>
            </ul>
          </div>
        </div>

        {/* Center/Right: Flutter Viewport and Toggle View Controller */}
        <div className={`col-span-1 lg:col-span-8 flex flex-col items-center justify-center`}>
          
          {/* Switch View Controllers */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 mb-4 gap-1 shadow-sm">
            <button
              id="view-mobile"
              onClick={() => setIsFullscreen(false)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                !isFullscreen 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Flutter Mobile Mockup
            </button>
            <button
              id="view-desktop"
              onClick={() => setIsFullscreen(true)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                isFullscreen 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Full Desktop Dashboard
            </button>
          </div>

          {/* Main App Canvas */}
          <div 
            id="workbridge-main-canvas"
            className={`transition-all duration-300 w-full flex justify-center ${
              isFullscreen 
                ? 'max-w-5xl' 
                : 'max-w-sm'
            }`}
          >
            {/* Phone Bezel Simulator if NOT fullscreen */}
            <div className={`w-full relative flex flex-col ${
              isFullscreen 
                ? 'min-h-[700px] bg-white border border-slate-200 rounded-2xl shadow-md p-0 overflow-hidden' 
                : 'h-[750px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 overflow-hidden'
            }`}>
              
              {/* Dynamic Camera Notch / Header Detail on Phone */}
              {!isFullscreen && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-800 rounded-full" />
                  <div className="w-12 h-1 bg-slate-950 rounded-full" />
                </div>
              )}

              {/* Internal Screen Area */}
              <div id="flutter-viewport-screen" className={`flex-1 bg-white text-slate-800 overflow-hidden flex flex-col relative ${
                isFullscreen ? 'rounded-none' : 'rounded-[30px]'
              }`}>
                
                {/* Brand-consistent Splash Screen & Navigation Drawer */}
                <AnimatePresence>
                  {isSplashActive && (
                    <motion.div
                      key="splash-screen"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="absolute inset-0 bg-white z-[99] flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <motion.img
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                          src="/src/assets/images/workbridge_logo_1782977402938.jpg"
                          alt="WorkBridge Thailand Logo"
                          className="w-28 h-28 object-contain rounded-2xl shadow-md border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <h1 className="text-xl font-black font-display text-slate-950 tracking-tight">WorkBridge</h1>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Thailand Operations</p>
                        </div>
                      </div>
                      
                      <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden mb-8 relative">
                        <motion.div 
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                          className="absolute top-0 bottom-0 w-1/2 bg-blue-600 rounded-full"
                        />
                      </div>
                      
                      <p className="text-[9px] text-slate-400 font-medium">Connecting Talent, Building Futures</p>
                    </motion.div>
                  )}

                  {showNavigationDrawer && currentUser && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        key="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNavigationDrawer(false)}
                        className="absolute inset-0 bg-slate-950 z-[90] cursor-pointer"
                      />
                      
                      {/* Sliding Drawer Panel */}
                      <motion.div
                        key="drawer-panel"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute left-0 top-0 bottom-0 w-4/5 max-w-[280px] bg-slate-900 text-slate-100 z-[95] flex flex-col shadow-2xl border-r border-slate-800"
                      >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between select-none">
                          <div className="flex items-center gap-2">
                            <img 
                              src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
                              alt="WorkBridge Thailand Logo" 
                              className="w-8 h-8 object-contain rounded-md bg-white border border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h3 className="text-xs font-black font-display uppercase tracking-widest text-white leading-tight">WorkBridge</h3>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">Thailand Operations</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNavigationDrawer(false)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Drawer Body (User Info + Navigation) */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                          {/* User Brief Card */}
                          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 space-y-2 select-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                {currentUser.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-white truncate leading-tight">{currentUser.fullName}</div>
                                <div className="text-[8px] text-slate-400 leading-tight truncate">{currentUser.phone}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[7px] bg-blue-500/25 text-blue-300 font-extrabold uppercase px-1.5 py-0.5 rounded border border-blue-500/20">
                                {currentUser.role === 'seeker' ? 'Job Seeker' : currentUser.role === 'employer' ? 'Thai Employer' : 'Administrator'}
                              </span>
                              {currentUser.lineId && (
                                <span className="text-[7px] text-emerald-400 font-mono">LINE: {currentUser.lineId}</span>
                              )}
                            </div>
                          </div>

                          {/* Navigation Links */}
                          <div className="space-y-1.5">
                            <h5 className="text-[8px] font-black uppercase tracking-wider text-slate-500 px-2 select-none">Navigation</h5>
                            
                            {currentUser.role === 'seeker' && (
                              <>
                                <button
                                  onClick={() => { setActiveTab('jobs'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>{t.findJobs}</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('external'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'external' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                  <span>
                                    {lang === 'th' ? 'งานภายนอก' : lang === 'my' ? 'ပြင်ပအလုပ်' : 'External Jobs'}
                                  </span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('applied'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'applied' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{t.myApplications}</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('messages'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{lang === 'th' ? 'ข้อความแชท' : 'Messages'}</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('profile'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <UserIcon className="w-3.5 h-3.5" />
                                  <span>My Profile</span>
                                </button>

                                <button
                                  onClick={() => { setShowResumeBuilder(true); setShowNavigationDrawer(false); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>AI Resume Builder</span>
                                </button>
                              </>
                            )}

                            {currentUser.role === 'employer' && (
                              <>
                                <button
                                  onClick={() => { setActiveTab('myjobs'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'myjobs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>{t.myJobs}</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('post'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'post' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Post a New Job</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('verify'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'verify' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Verify Payments</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('messages'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Messages / Chat</span>
                                </button>

                                <button
                                  onClick={() => { setActiveTab('profile'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <UserIcon className="w-3.5 h-3.5" />
                                  <span>My Profile</span>
                                </button>
                              </>
                            )}

                            {currentUser.role === 'admin' && (
                              <>
                                <button
                                  onClick={() => { setActiveTab('dashboard'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Layout className="w-3.5 h-3.5" />
                                  <span>Admin Dashboard</span>
                                </button>
                                <button
                                  onClick={() => { setActiveTab('verify'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'verify' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Verify Payments</span>
                                </button>
                                <button
                                  onClick={() => { setActiveTab('database'); setShowNavigationDrawer(false); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold rounded-lg text-left transition-colors cursor-pointer ${
                                    activeTab === 'database' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <span>Database Control</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-800 space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNavigationDrawer(false);
                              setShowLogoutConfirm(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-red-500/20"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>{t.logout}</span>
                          </button>

                          <div className="text-center">
                            <p className="text-[7px] text-slate-500 uppercase tracking-widest font-black">WorkBridge Thailand © 2026</p>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                
                {/* Simulated Phone Top Info Bar */}
                {!isFullscreen && (
                  <div className="h-9 bg-slate-950 text-slate-300 flex items-center justify-between px-6 text-[10px] font-semibold pt-2 select-none z-30">
                    <span>{timeStr}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-white/10 px-1 py-0.5 rounded-[3px] text-[8px]">5G</span>
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Main App Shell */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  
                  {/* APP NAV BAR */}
                  <header className="bg-slate-900 text-slate-100 p-4 shadow-sm flex items-center justify-between shrink-0 select-none border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      {currentUser && (
                        <button
                          id="btn-toggle-drawer"
                          type="button"
                          onClick={() => setShowNavigationDrawer(true)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer mr-0.5 shrink-0"
                          title="Open navigation menu"
                        >
                          <Menu className="w-5 h-5" />
                        </button>
                      )}
                      <img 
                        src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
                        alt="WorkBridge Thailand Logo" 
                        className="w-7 h-7 object-contain rounded-md bg-white border border-slate-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h2 className="text-xs font-bold font-display uppercase tracking-widest text-white">WorkBridge</h2>
                        <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Thailand</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Sync Status Pill Indicator */}
                      <button
                        id="sync-status-indicator"
                        type="button"
                        onClick={() => setShowSyncInfoModal(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          isOnline 
                            ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/60' 
                            : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-950/80 animate-pulse'
                        }`}
                        title={isOnline 
                          ? "Connected & Synced with Cloud" 
                          : "Offline Mode - Actions will be synced when connected"
                        }
                      >
                        {isOnline ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="hidden xs:inline">Synced</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>Offline</span>
                          </>
                        )}
                      </button>

                      {currentUser ? (
                        <div className="flex items-center gap-2.5">
                          {/* My Applications top-right notification icon */}
                          {currentUser.role === 'seeker' && (
                            <button
                              id="header-applications-btn"
                              type="button"
                              onClick={() => setActiveTab('applied')}
                              className={`relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all border cursor-pointer ${
                                activeTab === 'applied' 
                                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' 
                                  : 'border-slate-800 bg-slate-800/40'
                              }`}
                              title={t.myApplications}
                            >
                              <FileText className="w-4 h-4" />
                              {applications.filter(a => a.seekerId === currentUser.id).length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-slate-900 shadow-xs">
                                  {applications.filter(a => a.seekerId === currentUser.id).length}
                                </span>
                              )}
                            </button>
                          )}
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-white max-w-[120px] truncate">{currentUser.fullName}</div>
                            <div className="text-[8px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded capitalize font-bold border border-slate-700">{currentUser.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-bold border border-slate-700 uppercase tracking-wider">
                          Offline Mode
                        </span>
                      )}
                    </div>
                  </header>

                  {/* Offline/Sync Warning Banner */}
                  <AnimatePresence>
                    {!isOnline && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-500 text-slate-950 px-4 py-2.5 text-[10px] font-bold flex items-center gap-2.5 border-b border-amber-600 shadow-sm shrink-0 overflow-hidden"
                      >
                        <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
                        <div className="flex-1">
                          <span className="uppercase tracking-wider font-black mr-1">Connection Interrupted:</span>
                          Your actions are being queued for automatic sync once connectivity is restored.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* MAIN SHELL SCREENS */}
                  <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
                    
                    {/* AUTHENTICATION VIEW */}
                    {!currentUser ? (
                      <div id="auth-view" className="p-5 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                        <div className="text-center space-y-2 mb-6">
                          <img 
                            src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
                            alt="WorkBridge Thailand Logo" 
                            className="w-24 h-24 object-contain rounded-2xl shadow-sm border border-slate-100 mx-auto mb-2 animate-pulse-soft"
                            referrerPolicy="no-referrer"
                          />
                          <h3 className="text-lg font-bold font-display text-slate-800">{t.appTitle}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">{t.tagline}</p>
                        </div>

                        {/* Login/Register Tabs */}
                        <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100 mb-4">
                          <button
                            id="tab-login"
                            onClick={() => { setAuthTab('login'); setAuthError(''); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              authTab === 'login' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {t.login}
                          </button>
                          <button
                            id="tab-register"
                            onClick={() => { setAuthTab('register'); setAuthError(''); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              authTab === 'register' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {t.register}
                          </button>
                        </div>

                        {authError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-xl flex items-center gap-1.5 mb-3">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <form onSubmit={authTab === 'login' ? handleLogin : handleRegister} className="space-y-3">
                          {authTab === 'register' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.fullName} *</label>
                                <input
                                  id="reg-name"
                                  type="text"
                                  value={regName}
                                  onChange={(e) => setRegName(e.target.value)}
                                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                  placeholder="Min Naing / Somchai"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.selectRole}</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    id="reg-role-seeker"
                                    type="button"
                                    onClick={() => setRegRole('seeker')}
                                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                                      regRole === 'seeker' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.jobSeeker}
                                  </button>
                                  <button
                                    id="reg-role-employer"
                                    type="button"
                                    onClick={() => setRegRole('employer')}
                                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                                      regRole === 'employer' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t.employer}
                                  </button>
                                </div>
                              </div>

                              {regRole === 'employer' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.companyName} *</label>
                                  <input
                                    id="reg-company"
                                    type="text"
                                    value={regCompany}
                                    onChange={(e) => setRegCompany(e.target.value)}
                                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                    placeholder="Siam Logistics Co., Ltd"
                                    required={regRole === 'employer'}
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.lineId}</label>
                                <input
                                  id="reg-line"
                                  type="text"
                                  value={regLineId}
                                  onChange={(e) => setRegLineId(e.target.value)}
                                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                  placeholder="LINE id/username"
                                />
                              </div>
                            </>
                          )}

                          {authTab === 'login' && (
                            <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50 mb-3 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => { setLoginAuthMode('password'); setAuthError(''); }}
                                className={`flex-1 py-1 rounded transition-all ${
                                  loginAuthMode === 'password' ? 'bg-white text-blue-600 shadow-2xs border border-slate-100' : 'text-slate-500'
                                }`}
                              >
                                Password Sign In
                              </button>
                              <button
                                type="button"
                                onClick={() => { setLoginAuthMode('otp'); setAuthError(''); }}
                                className={`flex-1 py-1 rounded transition-all ${
                                  loginAuthMode === 'otp' ? 'bg-white text-blue-600 shadow-2xs border border-slate-100' : 'text-slate-500'
                                }`}
                              >
                                Phone OTP Sign In
                              </button>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.phone} *</label>
                            <div className="flex gap-2">
                              <input
                                id="auth-phone"
                                type="tel"
                                value={authTab === 'login' ? loginPhone : regPhone}
                                onChange={(e) => authTab === 'login' ? setLoginPhone(e.target.value) : setRegPhone(e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                placeholder="0977777777"
                                required
                              />
                              {authTab === 'login' && loginAuthMode === 'otp' && (
                                <button
                                  type="button"
                                  onClick={handleRequestOtp}
                                  disabled={loginOtpCountdown > 0}
                                  className="shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold px-3 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                  {loginOtpCountdown > 0 ? `Resend (${loginOtpCountdown}s)` : (loginOtpSent ? 'Resend' : 'Send OTP')}
                                </button>
                              )}
                            </div>
                          </div>

                          {authTab === 'login' && loginAuthMode === 'otp' ? (
                            loginOtpSent && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1"
                              >
                                <label className="block text-[10px] font-bold text-slate-700 mb-1">Enter 6-digit OTP Code *</label>
                                <input
                                  id="auth-otp-code"
                                  type="text"
                                  maxLength={6}
                                  value={loginOtpCode}
                                  onChange={(e) => setLoginOtpCode(e.target.value)}
                                  className="w-full text-center text-sm tracking-widest font-bold border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                  placeholder="123456"
                                  required
                                />
                                <span className="block text-[8px] text-emerald-600 font-semibold text-center mt-1">
                                  ✓ Simulated SMS OTP sent! Use code <strong className="underline">123456</strong>
                                </span>
                              </motion.div>
                            )
                          ) : (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.password} *</label>
                              <input
                                id="auth-password"
                                type="password"
                                value={authTab === 'login' ? loginPassword : regPassword}
                                onChange={(e) => authTab === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                placeholder="••••••••"
                                required
                              />
                            </div>
                          )}

                          <button
                            id="auth-submit-btn"
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs mt-2"
                          >
                            {authTab === 'login' ? t.login : t.register}
                          </button>
                        </form>

                        {/* Premium Social Login Divider */}
                        <div className="relative my-5 select-none">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-extrabold">
                            <span className="bg-slate-50 px-3 text-slate-400">Or Continue With</span>
                          </div>
                        </div>

                        {/* High-Fidelity Social Login Buttons */}
                        <div className="space-y-2.5">
                          {/* Google Button (PRIMARY) */}
                          <button
                            id="social-login-google"
                            type="button"
                            disabled={isSocialLoading !== null}
                            onClick={() => handleSocialLogin('google')}
                            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                          >
                            {isSocialLoading === 'google' ? (
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                            )}
                            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-800">Sign In with Google</span>
                          </button>

                          {/* Facebook Button (SECONDARY) */}
                          <button
                            id="social-login-facebook"
                            type="button"
                            disabled={isSocialLoading !== null}
                            onClick={() => handleSocialLogin('facebook')}
                            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#1565C0] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                          >
                            {isSocialLoading === 'facebook' ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                            )}
                            <span className="text-[10px] uppercase tracking-wide font-extrabold">Continue with Facebook</span>
                          </button>
                        </div>

                        <div className="mt-5 text-center">
                          <p className="text-[10px] text-slate-500">
                            Or utilize one of the pre-configured mock developer accounts in the header switcher above!
                          </p>
                        </div>
                      </div>
                    ) : (
                      
                      // LOGGED-IN USERS SCREENS
                      <div className="flex-1 flex flex-col overflow-hidden relative">
                        
                        {/* 1. JOB SEEKER ROLE WORKFLOWS */}
                        {currentUser.role === 'seeker' && (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {showResumeBuilder ? (
                              <AIResumeBuilder 
                                currentUser={currentUser} 
                                lang={lang} 
                                onClose={() => setShowResumeBuilder(false)} 
                              />
                            ) : (
                              <>
                                {/* SEEKER TABS */}
                                {activeTab === 'jobs' && (
                              <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
                                
                                {/* Sub Tab Switcher */}
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl select-none shrink-0 border border-slate-200">
                                  <button
                                    id="btn-subtab-all-jobs"
                                    type="button"
                                    onClick={() => setJobsSubTab('all')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                      jobsSubTab === 'all'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Briefcase className="w-3.5 h-3.5" />
                                    <span>{lang === 'th' ? 'ค้นหางานทั้งหมด' : lang === 'my' ? 'အလုပ်အားလုံး' : 'All Job Listings'}</span>
                                  </button>
                                  <button
                                    id="btn-subtab-ai-matching"
                                    type="button"
                                    onClick={() => setJobsSubTab('matching')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
                                      jobsSubTab === 'matching'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{lang === 'th' ? 'จับคู่ตำแหน่งงาน AI' : lang === 'my' ? 'AI အလုပ်ကိုက်ညီမှု' : 'AI Job Matching'}</span>
                                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-500 text-white text-[7px] font-black uppercase rounded-full tracking-wider animate-bounce">
                                      NEW
                                    </span>
                                  </button>
                                </div>

                                {jobsSubTab === 'all' ? (
                                  <>
                                    {/* Search and Location Headers */}
                                    <div className="space-y-2 select-none">
                                      <div className="relative">
                                        <input 
                                          id="job-search-input"
                                          type="text"
                                          placeholder={t.searchPlaceholder}
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          className="w-full text-xs bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                      </div>

                                      {/* Advanced Aggregator Control Bar */}
                                      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3.5 shadow-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Filter className="w-3.5 h-3.5 text-blue-600" />
                                            Feed Filtering & Sync
                                          </span>
                                          
                                          {/* Manual sync refresh button */}
                                          <button
                                            id="manual-sync-aggregator"
                                            type="button"
                                            disabled={isAggregatorSyncing}
                                            onClick={async () => {
                                              setIsAggregatorSyncing(true);
                                              try {
                                                await fetchAndAggregateJobs();
                                                await refreshData();
                                                // Trigger success notification
                                                if (currentUser) {
                                                  await db.createNotification({
                                                    userId: currentUser.id,
                                                    title: 'Aggregator Synchronized 🔄',
                                                    message: 'Successfully synchronized jobs from external sources. Added & verified listings.'
                                                  });
                                                  await refreshData();
                                                }
                                              } catch (e) {
                                                console.error(e);
                                              } finally {
                                                setIsAggregatorSyncing(false);
                                              }
                                            }}
                                            className="text-[9px] bg-blue-50 text-blue-600 hover:bg-blue-100 font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Auto refreshed hourly. Click to sync manually."
                                          >
                                            <RefreshCw className={`w-3 h-3 ${isAggregatorSyncing ? 'animate-spin text-blue-700' : ''}`} />
                                            <span>{isAggregatorSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
                                          </button>
                                        </div>

                                        {/* Filter Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          {/* Category Dropdown */}
                                          <div className="space-y-1">
                                            <label className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Category</label>
                                            <select
                                              id="filter-category-select"
                                              value={filterCategory}
                                              onChange={(e) => setFilterCategory(e.target.value)}
                                              className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium text-slate-700 cursor-pointer"
                                            >
                                              <option value="All">All Categories</option>
                                              <option value="Technology">Technology</option>
                                              <option value="Sales & Marketing">Sales & Marketing</option>
                                              <option value="Customer Service">Customer Service</option>
                                              <option value="Creative & Design">Creative & Design</option>
                                              <option value="Finance & Accounting">Finance & Accounting</option>
                                              <option value="Administrative">Administrative</option>
                                              <option value="Hospitality & Food">Hospitality & Food</option>
                                              <option value="Logistics & Warehouse">Logistics & Warehouse</option>
                                              <option value="General">General</option>
                                            </select>
                                          </div>

                                          {/* Source Dropdown */}
                                          <div className="space-y-1">
                                            <label className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Job Source</label>
                                            <select
                                              id="filter-source-select"
                                              value={filterSource}
                                              onChange={(e) => setFilterSource(e.target.value)}
                                              className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium text-slate-700 cursor-pointer"
                                            >
                                              <option value="All">All Sources</option>
                                              <option value="Direct">WorkBridge Direct</option>
                                              <option value="Arbeitnow">Arbeitnow Feed</option>
                                              <option value="We Work Remotely">We Work Remotely</option>
                                              <option value="The Muse">The Muse API</option>
                                            </select>
                                          </div>

                                          {/* Salary Range Filter Slider */}
                                          <div className="col-span-2 space-y-1">
                                            <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider text-[8px]">
                                              <span>Minimum Salary</span>
                                              <span className="text-blue-600 font-black">฿{filterMinSalary.toLocaleString()}</span>
                                            </div>
                                            <input
                                              id="filter-salary-slider"
                                              type="range"
                                              min="0"
                                              max="120000"
                                              step="5000"
                                              value={filterMinSalary}
                                              onChange={(e) => setFilterMinSalary(parseInt(e.target.value) || 0)}
                                              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Fast Filter Location chips */}
                                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                                        {locationsList.map((loc, idx) => (
                                          <button
                                            id={`loc-chip-${idx}`}
                                            key={idx}
                                            type="button"
                                            onClick={() => setFilterLocation(loc)}
                                            className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                                              filterLocation === loc 
                                                ? 'bg-blue-600 text-white shadow-xs' 
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                          >
                                            {loc === 'All' ? '🌐 All Thailand' : loc}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Jobs Feed list */}
                                    <div className="flex-1 overflow-y-auto space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.activeJobs} ({filteredJobs.length})</h3>
                                        
                                        {/* Browse Mode Switcher */}
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                          <button
                                            type="button"
                                            onClick={() => setBrowseMode('infinite')}
                                            className={`text-[8px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                                              browseMode === 'infinite' 
                                                ? 'bg-white text-blue-700 shadow-3xs' 
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                          >
                                            ♾️ Infinite
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setBrowseMode('pagination')}
                                            className={`text-[8px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                                              browseMode === 'pagination' 
                                                ? 'bg-white text-blue-700 shadow-3xs' 
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                          >
                                            📄 Pages
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {filteredJobs.length === 0 ? (
                                        <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                                          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                          <p className="text-xs font-semibold text-slate-500">No matching jobs found</p>
                                        </div>
                                      ) : (
                                        (browseMode === 'infinite' 
                                          ? filteredJobs.slice(0, visibleItemsCount) 
                                          : filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        ).map((job) => {
                                          // Check application status for this job
                                          const userApp = applications.find(a => a.jobId === job.id && a.seekerId === currentUser.id);

                                          return (
                                            <div 
                                              id={`job-card-${job.id}`}
                                              key={job.id}
                                              onClick={() => setSelectedJob(job)}
                                              className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group shadow-2xs"
                                            >
                                              <div className="flex justify-between items-start gap-2">
                                                <div className="flex gap-3 min-w-0 flex-1">
                                                  {/* Company Logo */}
                                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-150">
                                                    {job.logoUrl ? (
                                                      <img 
                                                        src={job.logoUrl} 
                                                        alt={job.employerName} 
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                      />
                                                    ) : (
                                                      <Briefcase className="w-5 h-5 text-slate-400" />
                                                    )}
                                                  </div>

                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                      <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                                                        📍 {job.location}
                                                      </span>
                                                      {job.source && job.source !== 'Direct' && job.source !== 'WorkBridge' ? (
                                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100 flex items-center gap-0.5">
                                                          🌐 {job.source}
                                                        </span>
                                                      ) : (
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100 flex items-center gap-0.5">
                                                          💼 Direct
                                                        </span>
                                                      )}
                                                      {job.category && (
                                                        <span className="text-[9px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded uppercase border border-slate-150">
                                                          🏷️ {job.category}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors truncate">
                                                      {job.title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-semibold truncate">{job.employerName}</p>
                                                  </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                  <span className="text-xs font-extrabold text-slate-900">
                                                    ฿{job.salary.toLocaleString()}
                                                  </span>
                                                  <p className="text-[8px] text-slate-400">/ month</p>
                                                </div>
                                              </div>

                                              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5">
                                                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>Fee: ฿{job.applicationFee}</span>
                                                </div>

                                                {userApp ? (
                                                  <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase border ${
                                                    userApp.status === 'approved' 
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                      : userApp.status === 'rejected' 
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                  }`}>
                                                    {userApp.status === 'approved' ? t.approved : userApp.status === 'rejected' ? t.rejected : t.pending}
                                                  </span>
                                                ) : (
                                                  <div className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
                                                    <span>{t.applyNow}</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}

                                      {/* Controls Footer */}
                                      <div className="pt-2 border-t border-slate-100">
                                        {browseMode === 'infinite' ? (
                                          filteredJobs.length > visibleItemsCount && (
                                            <button
                                              type="button"
                                              onClick={() => setVisibleItemsCount(prev => prev + 20)}
                                              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-600 font-bold py-2.5 px-4 rounded-xl text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                              <span>Load More Jobs (+{filteredJobs.length - visibleItemsCount} remaining)</span>
                                              <ChevronRight className="w-3.5 h-3.5 transform rotate-90" />
                                            </button>
                                          )
                                        ) : (
                                          /* Numeric Pagination */
                                          <div className="flex flex-col items-center gap-2 py-2">
                                            <div className="flex items-center justify-center gap-1">
                                              <button
                                                type="button"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                                              >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                              </button>
                                              
                                              {Array.from({ length: Math.ceil(filteredJobs.length / itemsPerPage) })
                                                .map((_, idx) => idx + 1)
                                                .filter(page => page === 1 || page === Math.ceil(filteredJobs.length / itemsPerPage) || Math.abs(page - currentPage) <= 1)
                                                .map((page, index, array) => {
                                                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                                  return (
                                                    <React.Fragment key={page}>
                                                      {showEllipsisBefore && <span className="text-slate-400 text-[10px] px-1">...</span>}
                                                      <button
                                                        type="button"
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-6 h-6 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                                          currentPage === page 
                                                            ? 'bg-blue-600 text-white shadow-xs' 
                                                            : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                                                        }`}
                                                      >
                                                        {page}
                                                      </button>
                                                    </React.Fragment>
                                                  );
                                                })
                                              }

                                              <button
                                                type="button"
                                                disabled={currentPage === Math.ceil(filteredJobs.length / itemsPerPage)}
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredJobs.length / itemsPerPage), prev + 1))}
                                                className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                                              >
                                                <ChevronRight className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold">
                                              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} active jobs
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  /* AI JOB MATCHING SUBTAB VIEW */
                                  <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                                    
                                    {/* Preference Form Card */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 shrink-0">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                          <Sparkles className="w-4 h-4 animate-spin-slow" />
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                                            {lang === 'th' ? 'ข้อมูลความพร้อมเพื่อความแม่นยำสูงสุด' : lang === 'my' ? 'ပိုမိုတိကျသော ကိုက်ညီမှုအတွက် သင့်ပရိုဖိုင်' : 'Match Preferences Profile'}
                                          </h4>
                                          <p className="text-[9px] text-slate-400 font-medium">
                                            {lang === 'th' ? 'ระบบ AI จะวิเคราะห์งานที่ได้ค่าจ้างดีที่สุดในจังหวัดที่คุณต้องการ' : lang === 'my' ? 'AI သည် သင့်အရည်အချင်းနှင့် ကိုက်ညီသောအလုပ်များကို ရှာဖွေပေးပါမည်' : 'AI will match active listings matching your skill set and goals.'}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        {/* Skills Input */}
                                        <div className="col-span-2 space-y-1">
                                          <label className="block text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">{lang === 'th' ? 'ทักษะความสามารถ' : 'My Core Skills / Experience Keywords'}</label>
                                          <input
                                            type="text"
                                            value={matchSkills}
                                            onChange={(e) => {
                                              setMatchSkills(e.target.value);
                                              localStorage.setItem('wb_match_skills', e.target.value);
                                            }}
                                            placeholder="e.g. welding, cleaning, factory, driving, cook"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-semibold"
                                          />
                                          
                                          {/* Suggestion Chips */}
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {['Construction', 'Agriculture', 'Housekeeping', 'Cooking', 'Factory', 'Welding', 'Driver', 'Hospitality'].map(tag => {
                                              const isIncluded = matchSkills.toLowerCase().includes(tag.toLowerCase());
                                              return (
                                                <button
                                                  key={tag}
                                                  type="button"
                                                  onClick={() => {
                                                    let newSkills = matchSkills.trim();
                                                    if (isIncluded) {
                                                      newSkills = newSkills.split(/,\s*/).filter(s => s.toLowerCase() !== tag.toLowerCase()).join(', ');
                                                    } else {
                                                      newSkills = newSkills ? `${newSkills}, ${tag}` : tag;
                                                    }
                                                    setMatchSkills(newSkills);
                                                    localStorage.setItem('wb_match_skills', newSkills);
                                                  }}
                                                  className={`text-[8px] px-2 py-0.5 rounded-full font-bold transition-all border ${
                                                    isIncluded 
                                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                  }`}
                                                >
                                                  {isIncluded ? '✓ ' : '+ '}{tag}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Salary Input */}
                                        <div className="space-y-1">
                                          <label className="block text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">{lang === 'th' ? 'เงินเดือนขั้นต่ำที่ต้องการ' : 'Expected Salary (฿)'}</label>
                                          <input
                                            type="number"
                                            value={matchSalary}
                                            step="1000"
                                            min="0"
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              setMatchSalary(val);
                                              localStorage.setItem('wb_match_salary', val.toString());
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                          />
                                        </div>

                                        {/* Experience Input */}
                                        <div className="space-y-1">
                                          <label className="block text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">{lang === 'th' ? 'ประสบการณ์ทำงาน (ปี)' : 'Years of Experience'}</label>
                                          <input
                                            type="number"
                                            value={matchExperience}
                                            min="0"
                                            max="40"
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              setMatchExperience(val);
                                              localStorage.setItem('wb_match_experience', val.toString());
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                          />
                                        </div>

                                        {/* Preferred Province Selector */}
                                        <div className="col-span-2 space-y-1">
                                          <label className="block text-slate-400 font-extrabold uppercase tracking-wider text-[8px]">{lang === 'th' ? 'จังหวัดที่สะดวกทำงาน' : 'Preferred Thai Province'}</label>
                                          <select
                                            value={matchProvince}
                                            onChange={(e) => {
                                              setMatchProvince(e.target.value);
                                              localStorage.setItem('wb_match_province', e.target.value);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                                          >
                                            {locationsList.map((loc) => (
                                              <option key={loc} value={loc}>
                                                {loc === 'All' ? '🌐 Anywhere in Thailand' : loc}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      {/* Run matching button */}
                                      <button
                                        id="btn-run-ai-match"
                                        type="button"
                                        disabled={isMatchingLoading}
                                        onClick={handleRunAIMatching}
                                        className="w-full py-3 px-4 rounded-xl font-black text-xs text-white uppercase tracking-wider cursor-pointer shadow-md select-none transition-all duration-300 disabled:opacity-50 relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 active:scale-98"
                                      >
                                        {isMatchingLoading ? (
                                          <span className="flex items-center justify-center gap-2">
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Analyzing Career Fit...</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center justify-center gap-1.5">
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                            <span>{lang === 'th' ? 'คำนวณจับคู่ตำแหน่งงานด้วย AI' : lang === 'my' ? 'AI ဖြင့် အလုပ်ရှာဖွေကိုက်ညီမည်' : 'Calculate My AI Job Matches'}</span>
                                          </span>
                                        )}
                                      </button>
                                    </div>

                                    {/* Results Feed List */}
                                    <div className="flex-1 overflow-y-auto space-y-4 pb-2">
                                      
                                      {isMatchingLoading ? (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-3.5 shadow-xs select-none">
                                          <div className="relative w-12 h-12 mx-auto">
                                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                                            <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest animate-pulse">Running Match Engine</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                              Scanning real-time Thai recruitment database...
                                            </p>
                                            <p className="text-[9px] text-slate-300 italic mt-0.5">
                                              Comparing skills compatibility, expected salaries, and documents...
                                            </p>
                                          </div>
                                        </div>
                                      ) : matchedJobsList.length === 0 ? (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                                          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2.5 animate-bounce" />
                                          <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                                            {lang === 'th' ? 'ยังไม่มีการคำนวณผลลัพธ์' : lang === 'my' ? 'ကိုက်ညီမှုအဖြေများ မရှိသေးပါ' : 'No Match Results Yet'}
                                          </h5>
                                          <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto font-medium">
                                            {lang === 'th' ? 'กรุณากรอกข้อมูลของคุณและกดปุ่มคำนวณจับคู่ด้านบน' : lang === 'my' ? 'အပေါ်ရှိ အချက်အလက်များဖြည့်သွင်းပြီး အလုပ်ရှာဖွေပါ' : 'Fill in your preference details and click the calculate button to load matching recommendations!'}
                                          </p>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between px-1 shrink-0">
                                            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                              {lang === 'th' ? 'พบตำแหน่งงานแนะนำที่ดีที่สุด' : lang === 'my' ? 'အကောင်းဆုံး ကိုက်ညီသောအလုပ်များ' : 'Your Best Fit Match Recommendations'} ({matchedJobsList.length})
                                            </h4>
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setMatchedJobsList([]);
                                                localStorage.removeItem('wb_matched_jobs_list');
                                              }}
                                              className="text-[8px] text-red-500 hover:underline uppercase font-bold"
                                            >
                                              {lang === 'th' ? 'ล้างผลลัพธ์' : 'Clear Results'}
                                            </button>
                                          </div>

                                          <div className="space-y-3.5">
                                            {matchedJobsList.map((job) => {
                                              const userApp = applications.find(a => a.jobId === job.id && a.seekerId === currentUser.id);
                                              const score = job.score || job.initialScore || 0;

                                              // Setup styling based on match tier
                                              const scoreColorClass = score >= 85 
                                                ? 'from-emerald-500 to-teal-500 text-white' 
                                                : score >= 60 
                                                  ? 'from-blue-500 to-indigo-500 text-white' 
                                                  : 'from-slate-400 to-slate-500 text-white';

                                              return (
                                                <div
                                                  id={`matched-job-${job.id}`}
                                                  key={job.id}
                                                  onClick={() => setSelectedJob(job)}
                                                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3 relative overflow-hidden group border-l-4 border-l-blue-600"
                                                >
                                                  <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                                                          📍 {job.location}
                                                        </span>
                                                        {job.category && (
                                                          <span className="text-[8px] font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded uppercase border border-slate-150">
                                                            🏷️ {job.category}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <h4 className="text-xs font-extrabold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                                                        {job.title}
                                                      </h4>
                                                      <p className="text-[10px] text-slate-500 font-bold">{job.employerName}</p>
                                                    </div>

                                                    {/* Match Score Radial Indicator Badge */}
                                                    <div className={`shrink-0 bg-gradient-to-br ${scoreColorClass} px-3 py-1.5 rounded-xl shadow-xs text-center min-w-[70px]`}>
                                                      <div className="text-xs font-black leading-none">{score}%</div>
                                                      <div className="text-[7px] font-black uppercase tracking-wider mt-0.5 opacity-90">
                                                        {score >= 85 ? 'Excellent' : score >= 60 ? 'Good Fit' : 'Fair fit'}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* AI Personalized advice box */}
                                                  <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-3 flex gap-2 items-start relative">
                                                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                                                    <div className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                                                      <span className="text-blue-800 font-black uppercase tracking-wider text-[8px] block mb-0.5">AI Match Analyst:</span>
                                                      {job.aiReason || `This job is a suitable opportunity matched with your target salary of ฿${matchSalary.toLocaleString()}/month in ${job.location}.`}
                                                    </div>
                                                  </div>

                                                  {/* Bottom Details Bar */}
                                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-150/70">
                                                    <div className="flex items-center gap-3">
                                                      <div>
                                                        <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold block">Salary</span>
                                                        <span className="font-extrabold text-slate-900">฿{job.salary.toLocaleString()}</span>
                                                      </div>
                                                      <div className="border-l border-slate-200 h-6" />
                                                      <div>
                                                        <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold block">Application Fee</span>
                                                        <span className="font-bold text-slate-700">฿{job.applicationFee}</span>
                                                      </div>
                                                    </div>

                                                    {userApp ? (
                                                      <span className={`px-2.5 py-1 rounded font-black text-[8px] uppercase tracking-wider border ${
                                                        userApp.status === 'approved' 
                                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                          : userApp.status === 'rejected' 
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                      }`}>
                                                        {userApp.status === 'approved' ? t.approved : userApp.status === 'rejected' ? t.rejected : t.pending}
                                                      </span>
                                                    ) : (
                                                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:bg-blue-600 transition-colors">
                                                        <span>{lang === 'th' ? 'ดูข้อมูลและสมัคร' : 'View & Apply'}</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* EXTERNAL JOBS VIEW */}
                            {activeTab === 'external' && (
                              <ExternalJobs 
                                t={t} 
                                lang={lang} 
                                onImportToProfile={handleImportExternalJob} 
                                savedJobIds={savedExternalJobs.map(j => j.id)}
                              />
                            )}

                            {/* MY APPLICATIONS VIEW */}
                            {activeTab === 'applied' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Sub Tabs Switcher */}
                                <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100 select-none">
                                  <button
                                    id="btn-sub-applications"
                                    type="button"
                                    onClick={() => setAppliedSubTab('applications')}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                      appliedSubTab === 'applications' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    WorkBridge Applications
                                  </button>
                                  <button
                                    id="btn-sub-external"
                                    type="button"
                                    onClick={() => setAppliedSubTab('external')}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                      appliedSubTab === 'external' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Saved External Jobs ({savedExternalJobs.length})</span>
                                  </button>
                                </div>

                                {appliedSubTab === 'applications' ? (
                                  <>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.myApplications}</h3>
                                    
                                    {applications.filter(a => a.seekerId === currentUser.id).length === 0 ? (
                                  <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-500">You haven't applied to any jobs yet</p>
                                  </div>
                                ) : (
                                  applications
                                    .filter(a => a.seekerId === currentUser.id)
                                    .map((app) => {
                                      const matchedJob = jobs.find(j => j.id === app.jobId);
                                      return (
                                        <div 
                                          id={`app-card-${app.id}`}
                                          key={app.id}
                                          className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-2xs"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <h4 className="text-xs font-bold text-slate-900">{app.jobTitle}</h4>
                                              <p className="text-[10px] text-slate-500 font-semibold">{app.employerName}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                                              app.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : app.status === 'rejected' 
                                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                              {app.status === 'approved' ? t.approved : app.status === 'rejected' ? t.rejected : t.pending}
                                            </span>
                                          </div>

                                          {/* Documents detail */}
                                          <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl space-y-1">
                                            <div className="font-bold text-slate-800 text-[9px] uppercase">Submitted Docs:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {app.docsAttached.map((doc, idx) => (
                                                <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[8px] px-1.5 py-0.5 rounded capitalize">
                                                  {doc}
                                                </span>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Action / Fee block */}
                                          <div className="flex items-center justify-between text-[10px] pt-1">
                                            {!app.receiptUrl ? (
                                              <div className="w-full flex flex-col gap-2">
                                                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 p-1.5 rounded-lg text-[9px] font-semibold">
                                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                  <span>Application fee payment receipt required to activate processing</span>
                                                </div>
                                                <button
                                                  id={`pay-btn-${app.id}`}
                                                  onClick={() => {
                                                    if (matchedJob) {
                                                      setActivePaymentJob(matchedJob);
                                                      setShowPaymentModal(true);
                                                    }
                                                  }}
                                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-[10px]"
                                                >
                                                  {t.uploadReceipt} (฿{matchedJob?.applicationFee || 1000})
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between w-full">
                                                <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                                  <CheckCircle className="w-3 h-3" />
                                                  Receipt Submitted
                                                </span>
                                                
                                                {app.status === 'approved' && matchedJob && (
                                                  <div className="flex items-center gap-2">
                                                    <a 
                                                      href={`tel:${matchedJob.phoneContact}`}
                                                      className="bg-blue-50 text-blue-600 p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                                                      title="Call Employer"
                                                    >
                                                      <Phone className="w-3.5 h-3.5" />
                                                    </a>
                                                    {matchedJob.lineIdContact && (
                                                      <a 
                                                        href={`https://line.me/ti/p/~${matchedJob.lineIdContact}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-extrabold hover:bg-emerald-100"
                                                      >
                                                        LINE ID: {matchedJob.lineIdContact}
                                                      </a>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                  </>
                                ) : (
                                  /* Saved External Jobs List */
                                  <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Saved External Listings</h3>
                                    
                                    {savedExternalJobs.length === 0 ? (
                                      <div className="p-8 text-center bg-white border border-slate-150 rounded-2xl">
                                        <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-slate-500">No saved external jobs yet</p>
                                        <button
                                          id="btn-switch-tab-external"
                                          type="button"
                                          onClick={() => setActiveTab('external')}
                                          className="text-[10px] bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100/80 transition-all cursor-pointer inline-block mt-2"
                                        >
                                          Browse External Jobs Hub
                                        </button>
                                      </div>
                                    ) : (
                                      savedExternalJobs.map((job) => (
                                        <div 
                                          id={`saved-ext-card-${job.id}`}
                                          key={job.id}
                                          className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2.5 relative shadow-3xs"
                                        >
                                          <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                              <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                                {job.sourceName}
                                              </span>
                                              <h4 className="text-xs font-bold text-slate-900 mt-1.5">{job.title}</h4>
                                              <p className="text-[10px] text-slate-500 font-bold">{job.company}</p>
                                            </div>

                                            <div className="text-right">
                                              <span className="text-xs font-black text-slate-900">{job.salary}</span>
                                              <p className="text-[8px] text-slate-400">/ month</p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-[9px] text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{job.location}</span>
                                          </div>

                                          <div className="flex gap-2 border-t border-slate-100 pt-2.5">
                                            <a
                                              id={`btn-saved-ext-view-${job.id}`}
                                              href={job.sourceUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-slate-200/50 cursor-pointer"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                              View Original Job
                                            </a>
                                            <button
                                              id={`btn-saved-ext-remove-${job.id}`}
                                              type="button"
                                              onClick={() => handleRemoveExternalJob(job.id)}
                                              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-rose-100 cursor-pointer"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* PROFILE VIEW */}
                            {activeTab === 'profile' && (
                              <MD3Profile
                                currentUser={currentUser}
                            onUpdateUser={async (updatedFields) => {
                              const updated = { ...currentUser, ...updatedFields };
                              setCurrentUser(updated);
                              await db.updateUser(currentUser.id, {
                                fullName: updated.fullName,
                                lineId: updated.lineId,
                                phone: updated.phone
                              });
                              refreshData();
                            }}
                                onSignOut={() => setShowLogoutConfirm(true)}
                                applications={applications}
                                jobs={jobs}
                                notifications={notifications}
                                markNotificationAsRead={async (id) => {
                                  await db.markNotificationAsRead(id);
                                  refreshData();
                                }}
                                lang={lang}
                                setLang={setLang}
                                t={t}
                                setShowResumeBuilder={setShowResumeBuilder}
                              />
                            )}

                            {activeTab === 'messages' && (
                              <ChatSystem 
                                currentUser={currentUser} 
                                refreshParentData={refreshData}
                                lang={lang}
                              />
                            )}

                            {/* Job Seeker Navigation Footer */}
                            <footer className="h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shrink-0 select-none shadow-sm">
                              <button 
                                id="btn-tab-jobs"
                                onClick={() => setActiveTab('jobs')}
                                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Briefcase className="w-4 h-4" />
                                <span>{t.findJobs}</span>
                              </button>
                              <button 
                                id="btn-tab-external"
                                onClick={() => setActiveTab('external')}
                                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'external' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Globe className="w-4 h-4" />
                                <span>
                                  {lang === 'th' ? 'งานภายนอก' : lang === 'my' ? 'ပြင်ပအလုပ်' : lang === 'lo' ? 'ວຽກພາຍນອກ' : lang === 'km' ? 'ការងារខាងក្រៅ' : 'External Jobs'}
                                </span>
                              </button>
                              <button 
                                id="btn-tab-applied"
                                onClick={() => setActiveTab('applied')}
                                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'applied' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <FileText className="w-4 h-4" />
                                <span>{t.myApplications}</span>
                              </button>
                              <button 
                                id="btn-tab-messages"
                                onClick={() => setActiveTab('messages')}
                                className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${activeTab === 'messages' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>{lang === 'th' ? 'ข้อความ' : 'Messages'}</span>
                              </button>
                              <button 
                                id="btn-tab-profile"
                                onClick={() => setActiveTab('profile')}
                                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <UserIcon className="w-4 h-4" />
                                <span>Profile</span>
                              </button>
                            </footer>
                          </>
                        )}
                      </div>
                    )}

                        {/* 2. EMPLOYER ROLE WORKFLOWS */}
                        {currentUser.role === 'employer' && (
                          <EmployerWorkflows
                            currentUser={currentUser}
                            onUpdateUser={async (updatedFields) => {
                              const updated = { ...currentUser, ...updatedFields };
                              setCurrentUser(updated);
                              await db.updateUser(currentUser.id, {
                                fullName: updated.fullName,
                                lineId: updated.lineId,
                                phone: updated.phone
                              });
                              refreshData();
                            }}
                            onSignOut={() => setShowLogoutConfirm(true)}
                            jobs={jobs}
                            applications={applications}
                            payments={payments}
                            notifications={notifications}
                            markNotificationAsRead={async (id) => {
                              await db.markNotificationAsRead(id);
                              refreshData();
                            }}
                            lang={lang}
                            setLang={setLang}
                            t={t}
                            refreshData={refreshData}
                          />
                        )}
                        {/* OLD WORKFLOWS CLEANED UP */}

                        {/* 3. SYSTEM ADMIN WORKFLOWS */}
                        {currentUser.role === 'admin' && (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            
                            {/* ADMIN DASHBOARD OVERVIEW */}
                            {activeTab === 'dashboard' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.overview}</h3>
                                
                                {/* Analytics Bento Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Applications</div>
                                    <div className="text-xl font-bold font-display text-slate-900">{totalApplications}</div>
                                    <div className="text-[8px] text-emerald-600 font-semibold">↑ Platform registrations</div>
                                  </div>

                                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Slips</div>
                                    <div className="text-xl font-bold font-display text-amber-600">{pendingPayments}</div>
                                    <div className="text-[8px] text-slate-400">Verifications needed</div>
                                  </div>

                                  <div className="bg-white border border-slate-200 p-4 rounded-xl col-span-2 flex justify-between items-center shadow-2xs">
                                    <div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Fee Revenue</div>
                                      <div className="text-xl font-bold font-display text-emerald-600">฿{totalFeesCollected.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100">
                                      <DollarSign className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>

                                {/* Database Seeding and Administration */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-purple-600" />
                                    <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Database Seeding Tool</h4>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Populate the active database with 500 realistic blue-collar and service jobs across all 77 provinces of Thailand (Factory, Warehouse, Construction, Hospitality, Caregivers, Welder, Electrician, etc.).
                                  </p>

                                  {seedMessage && (
                                    <div className={`p-2.5 rounded-lg text-[10px] font-medium border ${
                                      seedMessage.success 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                        : 'bg-rose-50 text-rose-800 border-rose-100'
                                    }`}>
                                      {seedMessage.text}
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      id="btn-seed-jobs"
                                      disabled={isSeeding}
                                      onClick={handleSeedFiveHundredJobs}
                                      className={`flex-1 text-[10px] font-bold py-2.5 px-3 rounded-lg text-white transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                        isSeeding 
                                          ? 'bg-slate-300 cursor-not-allowed' 
                                          : 'bg-purple-600 hover:bg-purple-700 shadow-xs'
                                      }`}
                                    >
                                      {isSeeding ? "Seeding..." : "Seed 500 Thailand Jobs"}
                                    </button>

                                    <button
                                      type="button"
                                      id="btn-clear-seed"
                                      disabled={isSeeding}
                                      onClick={handleClearSeededJobs}
                                      className={`text-[10px] font-bold py-2.5 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer ${
                                        isSeeding ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>

                                {/* Active Job Stats */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Platform Totals</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-slate-100 pb-1">
                                      <span className="text-slate-500">Active Job Postings</span>
                                      <span className="font-bold text-slate-900">{jobs.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1">
                                      <span className="text-slate-500">Verified Connections</span>
                                      <span className="font-bold text-slate-900">{approvedSeekers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Registered Users</span>
                                      <span className="font-bold text-slate-900">{users.length}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* App Branding Footer */}
                                <div className="flex flex-col items-center justify-center pt-6 pb-2 border-t border-slate-100 space-y-2 select-none opacity-90">
                                  <img 
                                    src="/src/assets/images/workbridge_logo_1782977402938.jpg" 
                                    alt="WorkBridge Thailand Logo" 
                                    className="w-12 h-12 object-contain rounded-xl shadow-xs border border-slate-200"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-700 font-display uppercase tracking-wider">WorkBridge Thailand</div>
                                    <div className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Connecting Talent, Building Futures</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* VERIFY PAYMENTS VIEW */}
                            {activeTab === 'verify' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.pendingVerifications} ({pendingPayments})</h3>
                                
                                {applications.filter(a => a.status === 'pending' && a.receiptUrl).length === 0 ? (
                                  <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                                    <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-500">No payment receipts pending verification</p>
                                  </div>
                                ) : (
                                  applications
                                    .filter(a => a.status === 'pending' && a.receiptUrl)
                                    .map((app) => {
                                      const matchedJob = jobs.find(j => j.id === app.jobId);
                                      return (
                                        <div key={app.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3">
                                          <div className="flex justify-between">
                                            <div>
                                              <h4 className="text-xs font-bold text-slate-800">{app.jobTitle}</h4>
                                              <p className="text-[10px] text-slate-500">Applicant: {app.seekerName} ({app.seekerPhone})</p>
                                              <p className="text-[9px] text-blue-600 font-semibold">Fee amount: ฿{matchedJob?.applicationFee || 1000}</p>
                                            </div>
                                            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                                              Verify Receipt
                                            </span>
                                          </div>

                                          {/* Scan Receipt Slip Preview Mock */}
                                          {app.receiptUrl && (
                                            <div className="bg-slate-100 p-2 rounded-xl flex flex-col items-center gap-1 border border-slate-200">
                                              <div className="text-[8px] text-slate-500 font-mono">PROMPTPAY SLIP SCREENSHOT</div>
                                              <img 
                                                src={app.receiptUrl} 
                                                alt="Receipt slip preview" 
                                                className="w-32 h-40 object-cover rounded-md border border-slate-300 shadow-sm"
                                                referrerPolicy="no-referrer"
                                              />
                                            </div>
                                          )}

                                          <div className="flex gap-2">
                                            <button
                                              id={`decline-btn-${app.id}`}
                                              onClick={() => handleRejectPayment(app.id)}
                                              className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold py-1.5 rounded-lg"
                                            >
                                              Decline Slip
                                            </button>
                                            <button
                                              id={`approve-btn-${app.id}`}
                                              onClick={() => handleApprovePayment(app.id)}
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg"
                                            >
                                              Approve Payment
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                )}
                              </div>
                            )}

                            {/* ADMIN JOBS APPROVAL & SCAM REMOVAL VIEW */}
                            {activeTab === 'jobs' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job Postings Moderation</h3>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                                    {adminFilteredJobs.length} listed
                                  </span>
                                </div>

                                {/* Moderation Search & Filter Bar */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                  <input 
                                    type="text"
                                    placeholder="Search jobs by title, company, or details..."
                                    value={adminJobSearch}
                                    onChange={(e) => setAdminJobSearch(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                                  />
                                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                                    {(['all', 'pending', 'active', 'rejected'] as const).map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => setAdminJobStatusFilter(status)}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold capitalize whitespace-nowrap transition-colors border ${
                                          adminJobStatusFilter === status 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  {adminFilteredJobs.length === 0 ? (
                                    <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                                      <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                      <p className="text-xs font-semibold text-slate-500">No matching job postings found</p>
                                    </div>
                                  ) : (
                                    adminFilteredJobs.map((job) => {
                                      // Simple automatic scam detection rules
                                      const isHighSalary = job.salary > 80000;
                                      const containsScamKeywords = /(easy money|guaranteed|crypto|telegram|investment|agent|scam|no experience required)/i.test(job.description || '');
                                      const isPotentialFake = isHighSalary || containsScamKeywords;

                                      return (
                                        <div key={job.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 relative overflow-hidden">
                                          {isPotentialFake && (
                                            <div className="absolute top-0 right-0 left-0 bg-rose-50 border-b border-rose-100 px-3 py-1 flex items-center gap-1.5 text-[9px] font-bold text-rose-700 animate-pulse">
                                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                              <span>⚠️ FLAG: Potential Scam or High Risk Job</span>
                                            </div>
                                          )}

                                          <div className={`flex justify-between items-start ${isPotentialFake ? 'pt-4' : ''}`}>
                                            <div>
                                              <div className="flex gap-1.5 items-center flex-wrap">
                                                <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                                  {job.location}
                                                </span>
                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                                  job.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                    : job.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    : job.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                  {job.status}
                                                </span>
                                              </div>
                                              <h4 className="text-xs font-bold text-slate-800 mt-1">{job.title}</h4>
                                              <p className="text-[10px] text-slate-500 font-semibold">{job.employerName}</p>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-xs font-extrabold text-slate-800 block">฿{job.salary.toLocaleString()}</span>
                                              <span className="text-[8px] text-slate-400">Fee: ฿{job.applicationFee}</span>
                                            </div>
                                          </div>

                                          <p className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-normal">
                                            {job.description || "No description provided"}
                                          </p>

                                          <div className="text-[9px] text-slate-500 space-y-1">
                                            <div>📞 Contact Phone: <span className="font-semibold text-slate-700">{job.phoneContact}</span></div>
                                            {job.lineIdContact && (
                                              <div>💬 LINE ID: <span className="font-semibold text-slate-700">{job.lineIdContact}</span></div>
                                            )}
                                            <div>📄 Required Documents: <span className="font-semibold text-slate-700 capitalize">{job.requiredDocs.join(', ')}</span></div>
                                            <div>👥 Vacancies: <span className="font-semibold text-slate-700">{job.vacancies || 1} Positions</span></div>
                                          </div>

                                          {/* Actions */}
                                          <div className="flex gap-2 pt-1 border-t border-slate-50">
                                            <button
                                              onClick={() => handleRemoveJob(job.id)}
                                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100 transition-colors"
                                            >
                                              Delete Posting
                                            </button>
                                            
                                            {job.status !== 'rejected' && (
                                              <button
                                                onClick={() => handleRejectJob(job.id)}
                                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                              >
                                                Flag Scam / Reject
                                              </button>
                                            )}
                                            
                                            {job.status !== 'active' && (
                                              <button
                                                onClick={() => handleApproveJob(job.id)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                              >
                                                Approve Job
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ADMIN EMPLOYERS APPROVAL VIEW */}
                            {activeTab === 'employers' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employers Verification</h3>
                                <div className="space-y-3">
                                  {employers.length === 0 ? (
                                    <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                                      <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                      <p className="text-xs font-semibold text-slate-500">No registered employers on the platform</p>
                                    </div>
                                  ) : (
                                    employers.map((emp) => (
                                      <div key={emp.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                              emp.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : emp.status === 'pending'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                            }`}>
                                              {emp.status}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-800 mt-1">{emp.companyName}</h4>
                                            <p className="text-[10px] text-slate-400 font-mono">Employer ID: {emp.id}</p>
                                          </div>
                                        </div>

                                        <div className="text-[9px] text-slate-500 space-y-1">
                                          <div>📞 Contact Phone: <span className="font-semibold text-slate-700">{emp.phone}</span></div>
                                          {emp.lineId && (
                                            <div>💬 LINE ID: <span className="font-semibold text-slate-700">{emp.lineId}</span></div>
                                          )}
                                          <div>📅 Registered On: <span className="text-slate-600">{new Date(emp.createdAt).toLocaleDateString()}</span></div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1 border-t border-slate-50">
                                          {emp.status !== 'rejected' && (
                                            <button
                                              onClick={() => handleRejectEmployer(emp.id)}
                                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold py-1.5 rounded-lg"
                                            >
                                              Block / Reject
                                            </button>
                                          )}
                                          
                                          {emp.status !== 'approved' && (
                                            <button
                                              onClick={() => handleApproveEmployer(emp.id)}
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg"
                                            >
                                              Approve Company
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ADMIN VIEW APPLICATIONS VIEW */}
                            {activeTab === 'applications' && (
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">All Applications</h3>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                                    {adminFilteredApps.length} total
                                  </span>
                                </div>

                                {/* Applications Search & Filter Bar */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                  <input 
                                    type="text"
                                    placeholder="Search apps by candidate, company, or job..."
                                    value={adminAppSearch}
                                    onChange={(e) => setAdminAppSearch(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                                  />
                                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => setAdminAppStatusFilter(status)}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold capitalize whitespace-nowrap transition-colors border ${
                                          adminAppStatusFilter === status 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {adminFilteredApps.length === 0 ? (
                                    <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                                      <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                      <p className="text-xs font-semibold text-slate-500">No applications found</p>
                                    </div>
                                  ) : (
                                    adminFilteredApps.map((app) => (
                                      <div key={app.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                              app.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : app.status === 'pending'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                            }`}>
                                              {app.status}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-800 mt-1.5">{app.jobTitle}</h4>
                                            <p className="text-[10px] text-slate-500">Company: {app.employerName}</p>
                                          </div>
                                          <span className="text-[8px] text-slate-400 font-mono">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>

                                        <div className="text-[9px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                          <div className="font-bold text-slate-700 uppercase text-[8px] tracking-wider mb-1">Candidate Profile:</div>
                                          <div>👤 Full Name: <span className="font-semibold text-slate-700">{app.seekerName}</span></div>
                                          <div>📞 Phone Number: <span className="font-semibold text-slate-700">{app.seekerPhone}</span></div>
                                          {app.seekerLineId && (
                                            <div>💬 LINE ID: <span className="font-semibold text-slate-700">{app.seekerLineId}</span></div>
                                          )}
                                          {app.docsAttached && app.docsAttached.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {app.docsAttached.map((doc, idx) => (
                                                <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                                  📄 {doc}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {app.receiptUrl && (
                                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                            <span className="text-[9px] font-bold text-slate-500">Receipt uploaded</span>
                                            <a 
                                              href={app.receiptUrl} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                              View Slip <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          </div>
                                        )}

                                        <div className="flex gap-2">
                                          {app.status !== 'rejected' && (
                                            <button
                                              onClick={() => handleRejectPayment(app.id)}
                                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold py-1.5 rounded-lg border border-rose-200 transition-colors"
                                            >
                                              Reject / Decline
                                            </button>
                                          )}
                                          {app.status !== 'approved' && (
                                            <button
                                              onClick={() => handleApprovePayment(app.id)}
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                                            >
                                              Approve Payment
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ADMIN MANAGE USERS VIEW */}
                            {activeTab === 'users' && (
                              <AdminUsersView 
                                users={adminFilteredUsers}
                                adminUserSearch={adminUserSearch}
                                setAdminUserSearch={setAdminUserSearch}
                                adminUserRoleFilter={adminUserRoleFilter}
                                setAdminUserRoleFilter={setAdminUserRoleFilter}
                                onDeleteUser={handleDeleteUser}
                                onUpdateRole={handleUpdateUserRole}
                              />
                            )}

                            {/* Admin Footer Tabs */}
                            <footer className="h-14 bg-white border-t border-slate-150 grid grid-cols-6 items-center px-1 shrink-0 select-none">
                              <button 
                                id="btn-admin-dashboard"
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Layout className="w-4 h-4" />
                                <span>Overview</span>
                              </button>
                              <button 
                                id="btn-admin-verify"
                                onClick={() => setActiveTab('verify')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'verify' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <FileCheck className="w-4 h-4" />
                                <span>Slips ({pendingPayments})</span>
                              </button>
                              <button 
                                id="btn-admin-jobs"
                                onClick={() => setActiveTab('jobs')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Briefcase className="w-4 h-4" />
                                <span>Jobs</span>
                              </button>
                              <button 
                                id="btn-admin-employers"
                                onClick={() => setActiveTab('employers')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'employers' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Building className="w-4 h-4" />
                                <span>Employers</span>
                              </button>
                              <button 
                                id="btn-admin-applications"
                                onClick={() => setActiveTab('applications')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'applications' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <ClipboardList className="w-4 h-4" />
                                <span>Apps</span>
                              </button>
                              <button 
                                id="btn-admin-users"
                                onClick={() => setActiveTab('users')}
                                className={`flex flex-col items-center gap-1 text-[9px] font-bold truncate ${activeTab === 'users' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Users className="w-4 h-4" />
                                <span>Users</span>
                              </button>
                            </footer>

                          </div>
                        )}

                      </div>
                    )}

                  </div>

                </div>

                {/* Simulated Bottom Indicator Bar on Mobile device */}
                {!isFullscreen && (
                  <div className="h-6 bg-white flex items-center justify-center shrink-0 select-none pb-2">
                    <div className="w-32 h-1 bg-slate-300 rounded-full" />
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* DETAILED JOB DESCRIPTION OVERLAY SLIDEOUT */}
      <AnimatePresence>
        {selectedJob && currentUser && (
          <motion.div 
            id="job-description-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white text-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[85vh]"
            >
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex gap-1 items-center flex-wrap">
                    <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full capitalize">
                      {selectedJob.location}
                    </span>
                    {selectedJob.source && selectedJob.source !== 'Direct' && selectedJob.source !== 'WorkBridge' ? (
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">
                        🌐 Source: {selectedJob.source}
                      </span>
                    ) : (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                        💼 Direct Job
                      </span>
                    )}
                    {selectedJob.category && (
                      <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-full">
                        🏷️ {selectedJob.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">{selectedJob.title}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{selectedJob.employerName}</p>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                
                {/* Job Description & Details */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Details & Requirements</h4>
                  
                  {selectedJob.description && (
                    <div className="text-slate-700 leading-relaxed space-y-1">
                      <p className="font-semibold text-slate-800">Job Description:</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">District</span>
                      <span className="text-slate-800 font-bold">{selectedJob.district || selectedJob.location || 'N/A'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">Working Hours</span>
                      <span className="text-slate-800 font-bold">{selectedJob.workingHours || '08:00 - 17:00'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">Accommodation</span>
                      <span className={`font-bold ${selectedJob.accommodation === 'Yes' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        🏠 {selectedJob.accommodation || 'No'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">Overtime (OT)</span>
                      <span className={`font-bold ${selectedJob.overtime === 'Yes' ? 'text-blue-600' : 'text-slate-600'}`}>
                        ⚡ {selectedJob.overtime || 'No'}
                      </span>
                    </div>
                  </div>

                  {selectedJob.benefits && (
                    <div className="text-[10px] bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/30 flex flex-col gap-0.5">
                      <span className="text-emerald-700 font-bold uppercase text-[8px]">🎁 Benefits & Welfare</span>
                      <span className="text-slate-700 font-semibold">{selectedJob.benefits}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                    <span className="text-slate-400">Vacancies Available:</span>
                    <span className="font-extrabold text-blue-600">{selectedJob.vacancies || 1} spots</span>
                  </div>
                </div>
                
                {/* Contact info */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Contact Information</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Phone Contact:</span>
                    <span className="font-semibold text-slate-800">{selectedJob.phoneContact}</span>
                  </div>
                  {selectedJob.lineIdContact && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">LINE ID:</span>
                      <span className="font-semibold text-blue-600">{selectedJob.lineIdContact}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[200px]">{selectedJob.address}</span>
                  </div>
                </div>

                {/* Applicant Info Form */}
                <div className="bg-blue-50/40 p-4 rounded-xl space-y-3 border border-blue-100/50">
                  <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Your Applicant Information</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">Full Name (Thai or English) *</label>
                      <input 
                        id="applicant-name"
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="e.g. Somchai Sawasdee"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">Phone Number *</label>
                        <input 
                          id="applicant-phone"
                          type="text"
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          placeholder="e.g. 091-234-5678"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1">LINE ID (Optional)</label>
                        <input 
                          id="applicant-lineid"
                          type="text"
                          value={applicantLineId}
                          onChange={(e) => setApplicantLineId(e.target.value)}
                          placeholder="e.g. somchai_line"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-blue-600/80">Please ensure these contact details match your documents so employers can reach you.</p>
                </div>

                {/* Docs checklists */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">{t.requiredDocs}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['passport', 'workPermit', 'visa', 'idCard', 'photo'].map((doc) => {
                      const isRequired = selectedJob.requiredDocs.includes(doc);
                      return (
                        <div 
                          key={doc} 
                          onClick={() => {
                            if (isRequired) {
                              if (appDocs.includes(doc)) {
                                setAppDocs(appDocs.filter(d => d !== doc));
                              } else {
                                setAppDocs([...appDocs, doc]);
                              }
                            }
                          }}
                          className={`p-2 rounded-xl border text-[10px] flex items-center justify-between cursor-pointer transition-all ${
                            isRequired 
                              ? appDocs.includes(doc)
                                ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              : 'opacity-40 border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="capitalize">{doc === 'workPermit' ? t.workPermit : doc === 'idCard' ? t.idCard : doc}</span>
                          {isRequired && (
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${appDocs.includes(doc) ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                              {appDocs.includes(doc) && <Check className="w-2.5 h-2.5" />}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400">Please verify you possess the mandatory highlighted documents before submitting.</p>
                </div>

                {/* Application Fee */}
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div>
                    <h5 className="text-[10px] font-bold text-blue-900">{t.applicationFee}</h5>
                    <p className="text-[8px] text-blue-600 font-semibold">Includes translation and administrative handling</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-900">฿{selectedJob.applicationFee}</span>
                  </div>
                </div>

                {/* Google Map location pinpoint preview */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">{t.mapLocation}</h4>
                  {hasValidKey ? (
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <div className="h-32 w-full border border-slate-200 rounded-xl overflow-hidden relative">
                        <Map
                          defaultCenter={{ lat: selectedJob.lat || 13.7563, lng: selectedJob.lng || 100.5018 }}
                          defaultZoom={12}
                          mapId="DEMO_MAP_ID_DETAILS"
                          disableDefaultUI={true}
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <AdvancedMarker position={{ lat: selectedJob.lat || 13.7563, lng: selectedJob.lng || 100.5018 }}>
                            <Pin background="#ea4335" glyphColor="#fff" />
                          </AdvancedMarker>
                        </Map>
                        <div className="absolute bottom-1 right-1 text-[8px] font-mono bg-white/80 px-1 py-0.5 rounded text-slate-500 z-10">
                          Lat: {(selectedJob.lat || 13.7563).toFixed(4)}, Lng: {(selectedJob.lng || 100.5018).toFixed(4)}
                        </div>
                      </div>
                    </APIProvider>
                  ) : (
                    <div className="h-32 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                      }} />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="bg-red-600 text-white p-1 rounded-full shadow-md">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] bg-white font-bold px-1.5 py-0.5 rounded shadow-xs mt-1 border border-slate-200 whitespace-nowrap">
                          Workplace: {selectedJob.location}
                        </span>
                      </div>
                      <div className="absolute bottom-1 right-1 text-[8px] font-mono bg-white/80 px-1 py-0.5 rounded text-slate-500">
                        Lat: {selectedJob.lat}, Lng: {selectedJob.lng}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                {selectedJob.sourceUrl && selectedJob.sourceUrl !== 'default' && (
                  <a
                    href={selectedJob.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>View & Apply Directly on {selectedJob.source || 'Original Site'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-apply-btn"
                    onClick={handleApply}
                    disabled={isApplying || !applicantName.trim() || !applicantPhone.trim() || selectedJob.requiredDocs.some(d => !appDocs.includes(d))}
                    className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition-all ${
                      (!applicantName.trim() || !applicantPhone.trim() || selectedJob.requiredDocs.some(d => !appDocs.includes(d)))
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                    }`}
                  >
                    {isApplying ? 'Applying...' : selectedJob.sourceUrl ? 'Concierge Apply' : 'Confirm Apply'}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROMPTPAY PAYMENT SHEET */}
      {showPaymentModal && activePaymentJob && (
        <PaymentModal 
          t={t}
          feeAmount={activePaymentJob.applicationFee}
          jobTitle={activePaymentJob.title}
          employerName={activePaymentJob.employerName}
          onClose={() => {
            setShowPaymentModal(false);
            setActivePaymentJob(null);
            setActiveTab('applied');
          }}
          onReceiptSubmit={handleReceiptSubmit}
        />
      )}

      {/* Footer Branding credits */}
      <footer className="w-full bg-slate-950 p-4 border-t border-slate-900 mt-auto text-center text-[11px] text-slate-500">
        <p>© 2026 WorkBridge Thailand Co., Ltd. Under supervision of the Ministry of Labour (Thailand & Myanmar).</p>
      </footer>

      {/* CONFIRM LOGOUT MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <LogOut className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Confirm Logout</h4>
                <p className="text-xs text-slate-500 font-semibold">Are you sure you want to log out?</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    await db.signOutUser();
                    setCurrentUser(null);
                    setSelectedJob(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYNC STATUS INFO MODAL */}
      <AnimatePresence>
        {showSyncInfoModal && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100"
            >
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                }`}>
                  {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6 animate-bounce" />}
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isOnline ? 'System Fully Synced' : 'Offline Mode Active'}
                </h4>
                <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed text-left bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                  {isOnline ? (
                    <p>
                      Your application is fully online. All your job applications, profile changes, and messages are synchronized with the <strong>WorkBridge live database</strong> in real-time.
                    </p>
                  ) : (
                    <p>
                      We have detected network loss. <strong>Do not worry!</strong> Your actions are being queued securely in your browser's local queue. They will <strong>automatically sync</strong> back to the main servers once your connectivity is restored.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncInfoModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant Chat Bot */}
      <AIChatBot lang={lang} />

    </div>
  );
}
