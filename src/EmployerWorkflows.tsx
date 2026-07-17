import React, { useState } from 'react';
import { 
  LayoutDashboard,
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
  Check,
  TrendingUp,
  BarChart2,
  Settings,
  DollarSign,
  Users,
  MessageSquare,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Language, TranslationSet } from '../translations';
import { db, User, Job, Application, Payment, Notification } from '../lib/db';
import ChatSystem from './ChatSystem';
import MD3Profile from './MD3Profile';

interface EmployerWorkflowsProps {
  currentUser: User;
  onUpdateUser: (updatedFields: Partial<User>) => Promise<void>;
  onSignOut: () => void;
  jobs: Job[];
  applications: Application[];
  payments: Payment[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationSet;
  refreshData: () => void;
}

export default function EmployerWorkflows({
  currentUser,
  onUpdateUser,
  onSignOut,
  jobs,
  applications,
  payments,
  notifications,
  markNotificationAsRead,
  lang,
  setLang,
  t,
  refreshData
}: EmployerWorkflowsProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Job Post states
  const [postTitle, setPostTitle] = useState('');
  const [postSalary, setPostSalary] = useState(15000);
  const [postAddress, setPostAddress] = useState('');
  const [postLocation, setPostLocation] = useState('Bangkok');
  const [postRequiredDocs, setPostRequiredDocs] = useState<string[]>(['passport']);
  const [postFee, setPostFee] = useState(49); // default ฿49
  const [postPhone, setPostPhone] = useState('');
  const [postLine, setPostLine] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postVacancies, setPostVacancies] = useState(1);
  const [postCategory, setPostCategory] = useState('General');
  const [postSuccess, setPostSuccess] = useState('');
  const [postError, setPostError] = useState('');

  // Editing Job state
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Company Profile states
  const [companyName, setCompanyName] = useState((currentUser as any).companyName || '');
  const [companySize, setCompanySize] = useState((currentUser as any).companySize || '1-10');
  const [companyIndustry, setCompanyIndustry] = useState((currentUser as any).companyIndustry || 'Logistics & Warehouse');
  const [companyLocation, setCompanyLocation] = useState((currentUser as any).companyLocation || 'Bangkok');
  const [companyBio, setCompanyBio] = useState((currentUser as any).companyBio || '');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Company Verification state
  const [regNo, setRegNo] = useState('0105569081234');
  const [isSubmitVerify, setIsSubmitVerify] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

  // Filter calculations
  const employerJobs = jobs.filter(j => j.employerId === currentUser.id);
  const employerJobsIds = employerJobs.map(j => j.id);
  const employerApps = applications.filter(a => employerJobsIds.includes(a.jobId));
  const pendingApps = employerApps.filter(a => a.status === 'pending');
  const approvedApps = employerApps.filter(a => a.status === 'approved');
  const rejectedApps = employerApps.filter(a => a.status === 'rejected');

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postSalary || !postAddress || !postPhone) {
      setPostError("Please fill in all mandatory fields");
      return;
    }
    setPostError('');
    setPostSuccess('');

    try {
      await db.createJob({
        employerId: currentUser.id,
        employerName: companyName || currentUser.fullName,
        title: postTitle,
        salary: postSalary,
        address: postAddress,
        location: postLocation,
        lat: 13.7563, // default Bangkok lat
        lng: 100.5018, // default Bangkok lng
        requiredDocs: postRequiredDocs,
        applicationFee: postFee,
        phoneContact: postPhone,
        lineIdContact: postLine,
        description: postDescription,
        vacancies: postVacancies,
        category: postCategory
      });

      setPostSuccess("Job posted successfully! Ready for applicant matching.");
      refreshData();

      setTimeout(() => {
        setPostTitle('');
        setPostSalary(15000);
        setPostAddress('');
        setPostLocation('Bangkok');
        setPostRequiredDocs(['passport']);
        setPostFee(49);
        setPostPhone('');
        setPostLine('');
        setPostDescription('');
        setPostVacancies(1);
        setPostCategory('General');
        setPostSuccess('');
        setActiveTab('myjobs');
      }, 1200);
    } catch (err: any) {
      setPostError(err?.message || "Failed to post job");
    }
  };

  const handleEditJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      await db.updateJob(editingJob.id, {
        title: editingJob.title,
        salary: editingJob.salary,
        address: editingJob.address,
        location: editingJob.location,
        applicationFee: editingJob.applicationFee,
        phoneContact: editingJob.phoneContact,
        lineIdContact: editingJob.lineIdContact,
        description: editingJob.description,
        vacancies: editingJob.vacancies
      });
      setEditingJob(null);
      refreshData();
    } catch (err) {
      console.error("Error editing job:", err);
    }
  };

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    await onUpdateUser({
      companyName,
      companySize,
      companyIndustry,
      companyLocation,
      companyBio
    } as any);
    setProfileSuccess("Company profile details updated successfully!");
    setTimeout(() => setProfileSuccess(''), 2500);
  };

  // Mock Analytics Data
  const viewsTrendData = [
    { day: 'Mon', views: 120, applicants: 5 },
    { day: 'Tue', views: 190, applicants: 12 },
    { day: 'Wed', views: 340, applicants: 28 },
    { day: 'Thu', views: 280, applicants: 18 },
    { day: 'Fri', views: 420, applicants: 35 },
    { day: 'Sat', views: 210, applicants: 15 },
    { day: 'Sun', views: 310, applicants: 22 },
  ];

  const categoryDistribution = [
    { name: 'Approved / Hired', value: approvedApps.length || 5, color: '#10b981' },
    { name: 'Pending Review', value: pendingApps.length || 8, color: '#f59e0b' },
    { name: 'Declined / Rejected', value: rejectedApps.length || 3, color: '#ef4444' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      
      {/* Tab Panel Switcher */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* WELCOME BANNER */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2.5 bg-white/15 rounded-xl shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] bg-white/20 text-white font-black uppercase px-2 py-0.5 rounded-full">
                    RECRUITER SUITE
                  </span>
                  <h3 className="text-sm font-black tracking-wide mt-0.5">
                    {companyName || currentUser.fullName}
                  </h3>
                  <p className="text-[10px] text-blue-100 font-medium">
                    Managing {employerJobs.length} Job Openings • {employerApps.length} Total Applicants
                  </p>
                </div>
              </div>

              {/* POST NEW JOB PRIMARY ACTION */}
              <button
                type="button"
                id="btn-dashboard-post-job"
                onClick={() => setActiveTab('post')}
                className="mt-5 w-full bg-white hover:bg-slate-50 text-blue-800 font-extrabold text-[10px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3] text-blue-700" />
                <span>Post a New Job Position (฿49)</span>
              </button>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs text-center">
                <span className="text-[8px] text-slate-400 font-bold uppercase block">Active Jobs</span>
                <span className="text-sm font-black text-slate-800 block mt-1">{employerJobs.length}</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs text-center relative">
                <span className="text-[8px] text-slate-400 font-bold uppercase block">Pending Review</span>
                <span className="text-sm font-black text-amber-500 block mt-1">{pendingApps.length}</span>
                {pendingApps.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs text-center">
                <span className="text-[8px] text-slate-400 font-bold uppercase block">Total Hired</span>
                <span className="text-sm font-black text-emerald-600 block mt-1">{approvedApps.length}</span>
              </div>
            </div>

            {/* BENTO GRID ACTION TILES */}
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Workspace Sections
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                
                <button
                  onClick={() => setActiveTab('myjobs')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <Briefcase className="w-5 h-5 text-blue-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">My Job Posts</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Manage positions and fees</p>
                </button>

                <button
                  onClick={() => setActiveTab('applicants')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <Users className="w-5 h-5 text-indigo-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">Applicants</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Review CVs and approve</p>
                </button>

                <button
                  onClick={() => setActiveTab('company_profile')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-emerald-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">Company Profile</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Details, logo, and sizes</p>
                </button>

                <button
                  onClick={() => setActiveTab('company_verification')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-5 h-5 text-teal-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">Verification</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Labour license status</p>
                </button>

                <button
                  onClick={() => setActiveTab('payment_history')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <DollarSign className="w-5 h-5 text-amber-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">Payment History</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">฿49 slips ledger receipts</p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white border border-slate-100 hover:border-blue-500 rounded-xl p-3.5 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <BarChart2 className="w-5 h-5 text-purple-600 mb-2" />
                  <h5 className="text-xs font-black text-slate-800">Analytics</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Impressions and charts</p>
                </button>

              </div>
            </div>

            {/* MINI INSIGHTS CHART */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Weekly Views Trend
                </h4>
                <span className="text-[8px] text-blue-600 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-full">
                  +12% views vs last week
                </span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#viewsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* 2. POST NEW JOB TAB */}
        {activeTab === 'post' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button onClick={() => setActiveTab('dashboard')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Post New Job Position</h3>
            </div>

            {postSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
                {postSuccess}
              </div>
            )}

            {postError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
                {postError}
              </div>
            )}

            <form onSubmit={handlePostJob} className="space-y-4 pb-12">
              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 text-[10px] leading-relaxed rounded-xl font-semibold">
                Standard pricing is set to <span className="text-blue-900 font-bold">฿49 per job posting</span>. There are absolutely no hidden fees. Once submitted, you can attach the transaction slip.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Title *</label>
                <input 
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  placeholder="e.g., Senior Warehouse Officer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Monthly Salary *</label>
                  <input 
                    type="number"
                    required
                    value={postSalary}
                    onChange={(e) => setPostSalary(parseInt(e.target.value) || 0)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Processing Listing Fee (฿) *</label>
                  <input 
                    type="number"
                    required
                    disabled
                    value={postFee}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Location / Hub *</label>
                  <select 
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  >
                    <option value="Bangkok">Bangkok Hub</option>
                    <option value="Mae Sot">Mae Sot Hub</option>
                    <option value="Samut Sakhon">Samut Sakhon Hub</option>
                    <option value="Pathum Thani">Pathum Thani Hub</option>
                    <option value="Ranong">Ranong Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Total Vacancies *</label>
                  <input 
                    type="number"
                    required
                    value={postVacancies}
                    onChange={(e) => setPostVacancies(parseInt(e.target.value) || 1)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone Contact *</label>
                <input 
                  type="text"
                  required
                  value={postPhone}
                  onChange={(e) => setPostPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                  placeholder="e.g., 081-234-5678"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">LINE ID Contact (Optional)</label>
                <input 
                  type="text"
                  value={postLine}
                  onChange={(e) => setPostLine(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono"
                  placeholder="e.g., recruiterline"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Detailed Address *</label>
                <input 
                  type="text"
                  required
                  value={postAddress}
                  onChange={(e) => setPostAddress(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  placeholder="e.g., 88/1 Viphavadi Road, Chatuchak, Bangkok"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Category</label>
                <select 
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                >
                  <option value="General">General / Factory</option>
                  <option value="Warehouse">Warehouse / Logistics</option>
                  <option value="Construction">Construction / Heavy Industry</option>
                  <option value="Service">Services / Hospitality</option>
                  <option value="Agriculture">Agriculture / Farming</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Description & Requirements</label>
                <textarea 
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  rows={4}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  placeholder="Detail the daily duties, required language skills, work shifts, and border pass assistance..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                SUBMIT JOB POST & INITIATE FEES
              </button>
            </form>
          </div>
        )}

        {/* 3. MY JOB POSTS TAB */}
        {activeTab === 'myjobs' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">My Job Posts</h3>
              <button
                onClick={() => setActiveTab('post')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-1.5 px-3 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Post Job
              </button>
            </div>

            <div className="space-y-3">
              {employerJobs.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">You haven't posted any jobs yet</p>
                </div>
              ) : (
                employerJobs.map((job) => {
                  const jobApps = applications.filter(a => a.jobId === job.id);
                  return (
                    <div key={job.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2.5 shadow-2xs text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase border border-slate-200/50">
                              {job.location}
                            </span>
                            <span className={`text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase border ${
                              job.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : job.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {job.status === 'active' ? 'Active' : job.status === 'pending' ? 'Pending Approval' : 'Closed'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-1.5">{job.title}</h4>
                          <p className="text-[9px] text-slate-500 font-medium">Fee: ฿{job.applicationFee} • Phone: {job.phoneContact} • Vacancies: {job.vacancies}</p>
                        </div>
                        <span className="text-xs font-black text-slate-800">฿{job.salary.toLocaleString()}</span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-semibold">Total Applicants:</span>
                        <button 
                          onClick={() => setActiveTab('applicants')} 
                          className="flex items-center gap-1 font-bold text-blue-600 cursor-pointer"
                        >
                          <span>{jobApps.length} Received</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-50">
                        <button
                          onClick={() => setEditingJob(job)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => {
                            const nextStatus = job.status === 'active' ? 'closed' : 'active';
                            db.updateJobStatus(job.id, nextStatus).then(refreshData);
                          }}
                          className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer ${
                            job.status === 'active'
                              ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {job.status === 'active' ? 'Close Position' : 'Open Position'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. APPLICANTS TAB */}
        {activeTab === 'applicants' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Applicant Applications</h3>
            
            <div className="space-y-3">
              {employerApps.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No applicants received yet</p>
                </div>
              ) : (
                employerApps.map((app) => {
                  const job = jobs.find(j => j.id === app.jobId);
                  return (
                    <div key={app.id} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-2xs text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            For Job: {job?.title || 'Unknown Position'}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 mt-1">{app.seekerName || 'Anonymous Candidate'}</h4>
                          <p className="text-[9px] text-slate-400 font-medium">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {app.status === 'approved' ? 'HIRED' : app.status === 'rejected' ? 'DECLINED' : 'PENDING REVIEW'}
                        </span>
                      </div>

                      {/* Contact details */}
                      <div className="bg-slate-50 p-2.5 rounded-xl grid grid-cols-2 gap-2 text-[9px] text-slate-600 font-semibold font-mono">
                        <div>Phone: <span className="text-slate-800 font-bold">{app.seekerPhone || 'N/A'}</span></div>
                        <div>LINE: <span className="text-slate-800 font-bold">{app.seekerLineId || 'N/A'}</span></div>
                      </div>

                      {/* Actions */}
                      {app.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100/50">
                          <button
                            onClick={() => {
                              db.updateApplicationStatus(app.id, 'rejected').then(refreshData);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[9px] px-3 py-1.5 rounded-lg border border-rose-150 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => {
                              db.updateApplicationStatus(app.id, 'approved').then(refreshData);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Hire Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatSystem 
              currentUser={currentUser} 
              refreshParentData={refreshData}
              lang={lang}
            />
          </div>
        )}

        {/* 6. COMPANY PROFILE TAB */}
        {activeTab === 'company_profile' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button onClick={() => setActiveTab('dashboard')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Company Recruiter Profile</h3>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveCompanyProfile} className="space-y-4 pb-12 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Company Registered Name *</label>
                <input 
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Company Size (Employees) *</label>
                  <select 
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="200+">200+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Company Location *</label>
                  <input 
                    type="text"
                    required
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Core Industry *</label>
                <input 
                  type="text"
                  required
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Company Bio & Overview</label>
                <textarea 
                  value={companyBio}
                  onChange={(e) => setCompanyBio(e.target.value)}
                  rows={4}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  placeholder="Tell potential candidates about your company values, facilities, benefits, and workplace standards..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                Save Profile Details
              </button>
            </form>
          </div>
        )}

        {/* 7. COMPANY VERIFICATION TAB */}
        {activeTab === 'company_verification' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button onClick={() => setActiveTab('dashboard')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Company Recruiter Verification</h3>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">RECRUITER STATUS: APPROVED</h4>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Verified by Ministry of Labour (MOU Standard)</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Company Registration Number</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{regNo}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">MOU Recruiter ID License</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px]">REC-TH-2026-0098</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Licensing Authority</span>
                  <span className="font-bold text-slate-800 text-[11px]">Employment Department, Bangkok Office</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-950 leading-relaxed text-[10px] font-semibold space-y-1">
              <span className="font-black text-blue-900 block">Ministry Regulations Checklist:</span>
              <p>✔ Active business registration within Thailand</p>
              <p>✔ Verified contact person (Phone & LINE ID matches)</p>
              <p>✔ Compliant workplace standard for international workers</p>
            </div>
          </div>
        )}

        {/* 8. PAYMENT HISTORY TAB */}
        {activeTab === 'payment_history' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button onClick={() => setActiveTab('dashboard')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Payment Slips Ledger</h3>
            </div>

            <div className="space-y-3">
              {payments.filter(p => p.seekerId === currentUser.id).length === 0 && employerJobs.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
                  <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No payment records found</p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-blue-50 border border-blue-100 text-blue-950 rounded-xl leading-relaxed font-semibold text-[10px]">
                    Showing the billing status of processing fees (฿49 per job listing). Transaction receipts are verified within 24 hours.
                  </div>

                  {employerJobs.map((job) => (
                    <div key={job.id} className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase border border-slate-200/40">
                            Job Posting Fee
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1">{job.title}</h4>
                          <p className="text-[8px] text-slate-400 font-medium">Date: {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-black text-slate-800">฿49.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100/50">
                        <span className="text-slate-500">Receipt Status:</span>
                        <span className="text-emerald-600 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Verified & Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* 9. ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button onClick={() => setActiveTab('dashboard')} className="p-1 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Recruitment Analytics</h3>
            </div>

            {/* VIEWS GRAPH */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-3">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Weekly Application Conversion Rates
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 6 }} name="Job Views" />
                    <Line type="monotone" dataKey="applicants" stroke="#10b981" strokeWidth={2} name="Applicants" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* STATUS SPLIT */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-3">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Applicant Status Split
              </h4>
              <div className="flex items-center justify-around">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-[9px] font-semibold text-slate-600">
                  {categoryDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: <span className="text-slate-800 font-bold">{item.value}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 10. PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <MD3Profile 
              currentUser={currentUser}
              onUpdateUser={onUpdateUser}
              onSignOut={onSignOut}
              applications={applications}
              jobs={jobs}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
              lang={lang}
              setLang={setLang}
              t={t}
              setShowResumeBuilder={() => {}}
            />
          </div>
        )}

      </div>

      {/* EDIT JOB MODAL */}
      <AnimatePresence>
        {editingJob && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-4 space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Edit Job Posting</h4>
                <button 
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleEditJobSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Title *</label>
                  <input 
                    type="text"
                    required
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Monthly Salary *</label>
                    <input 
                      type="number"
                      required
                      value={editingJob.salary}
                      onChange={(e) => setEditingJob({ ...editingJob, salary: parseInt(e.target.value) || 0 })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Vacancies *</label>
                    <input 
                      type="number"
                      required
                      value={editingJob.vacancies}
                      onChange={(e) => setEditingJob({ ...editingJob, vacancies: parseInt(e.target.value) || 1 })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone Contact *</label>
                  <input 
                    type="text"
                    required
                    value={editingJob.phoneContact}
                    onChange={(e) => setEditingJob({ ...editingJob, phoneContact: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">LINE ID Contact</label>
                  <input 
                    type="text"
                    value={editingJob.lineIdContact || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, lineIdContact: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Detailed Address *</label>
                  <input 
                    type="text"
                    required
                    value={editingJob.address}
                    onChange={(e) => setEditingJob({ ...editingJob, address: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Job Description</label>
                  <textarea 
                    value={editingJob.description || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    rows={4}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMPLOYER NAVIGATION FOOTER BAR */}
      <footer className="h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shrink-0 select-none shadow-sm">
        <button 
          id="btn-employer-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button 
          id="btn-employer-myjobs"
          onClick={() => setActiveTab('myjobs')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'myjobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Jobs</span>
        </button>
        <button 
          id="btn-employer-applicants"
          onClick={() => setActiveTab('applicants')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${activeTab === 'applicants' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users className="w-4 h-4" />
          <span>Applicants</span>
          {pendingApps.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-2xs">
              {pendingApps.length}
            </span>
          )}
        </button>
        <button 
          id="btn-employer-messages"
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${activeTab === 'messages' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messages</span>
        </button>
        <button 
          id="btn-employer-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </footer>

    </div>
  );
}
