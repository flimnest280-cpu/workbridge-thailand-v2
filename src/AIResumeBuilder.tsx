import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash, 
  Download, 
  Printer, 
  Save, 
  Languages, 
  Briefcase, 
  GraduationCap, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Loader2, 
  FileText, 
  Share2,
  Trash2,
  RefreshCw,
  Eye,
  Edit2
} from 'lucide-react';
import { db, User as DBUser } from '../lib/db';

export interface ResumeWorkExperience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export interface ResumeData {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  location: string;
  targetRole: string;
  professionalSummary: string;
  skills: string[];
  languages: string[];
  workExperience: ResumeWorkExperience[];
  education: ResumeEducation[];
}

interface AIResumeBuilderProps {
  currentUser: DBUser;
  lang: string;
  onClose?: () => void;
}

type TemplateId = 'classic' | 'modern' | 'minimal';

export default function AIResumeBuilder({ currentUser, lang, onClose }: AIResumeBuilderProps) {
  // Try loading initial state from DB / LocalStorage
  const [resume, setResume] = useState<ResumeData>({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    email: '',
    lineId: currentUser.lineId || '',
    location: '',
    targetRole: '',
    professionalSummary: '',
    skills: [],
    languages: ['Burmese', 'Thai'],
    workExperience: [],
    education: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPolishingSummary, setIsPolishingSummary] = useState(false);
  const [polishingExpId, setPolishingExpId] = useState<string | null>(null);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic');

  // Interactive Form Field States
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Load from database on mount
  useEffect(() => {
    async function loadResume() {
      setIsLoading(true);
      try {
        const saved = await db.getResume(currentUser.id);
        if (saved) {
          // Merge with current user defaults if some fields are missing
          setResume({
            ...saved,
            fullName: saved.fullName || currentUser.fullName || '',
            phone: saved.phone || currentUser.phone || '',
            lineId: saved.lineId || currentUser.lineId || ''
          });
        } else {
          // Setup a placeholder resume so it's not totally blank and serves as a nice starting point
          setResume({
            fullName: currentUser.fullName || '',
            phone: currentUser.phone || '',
            email: currentUser.fullName.toLowerCase().replace(/\s+/g, '') + '@gmail.com',
            lineId: currentUser.lineId || '',
            location: 'Bangkok, Thailand',
            targetRole: 'Hotel Restaurant Cook',
            professionalSummary: 'Hardworking culinary professional with 3+ years of experience preparing authentic Thai and Burmese dishes. Highly skilled in kitchen operations, food safety standards, and working efficiently in high-volume hospitality environments.',
            skills: ['Food Preparation', 'Kitchen Hygiene', 'Inventory Control', 'Team Collaboration', 'Menu Planning'],
            languages: ['Burmese (Native)', 'Thai (Conversational)', 'English (Basic)'],
            workExperience: [
              {
                id: 'exp-1',
                company: 'Siam Palace Restaurant',
                role: 'Line Cook',
                duration: '2023 - Present',
                description: 'Prepared authentic stir-fry and curry dishes to order. Maintained top-grade kitchen safety and sanitation benchmarks. Guided prep cooks and managed inventory reorders weekly.'
              },
              {
                id: 'exp-2',
                company: 'Yangon Central Bistro',
                role: 'Assistant Chef',
                duration: '2021 - 2023',
                description: 'Prepped fresh ingredients and handled cold appetizers. Directed food storage operations and sanitized kitchen stations daily. Accelerated food prep workflows by 15% through optimal workspace planning.'
              }
            ],
            education: [
              {
                id: 'edu-1',
                school: 'Yangon Culinary Institute',
                degree: 'Certificate in Professional Cooking & Kitchen Operations',
                year: '2020'
              }
            ]
          });
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResume();
  }, [currentUser]);

  // Handle saving resume
  const handleSave = async (silent = false) => {
    if (!silent) setSaveStatus('saving');
    try {
      await db.saveResume(currentUser.id, resume);
      if (!silent) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to save resume:', err);
      if (!silent) setSaveStatus('error');
    }
  };

  // Auto-save silently on changes
  useEffect(() => {
    if (resume.fullName) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resume]);

  // Update specific fields
  const updateField = (key: keyof ResumeData, value: any) => {
    setResume(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add work experience
  const addWorkExperience = () => {
    const newExp: ResumeWorkExperience = {
      id: `exp-${Math.random().toString(36).substr(2, 9)}`,
      company: '',
      role: '',
      duration: '',
      description: ''
    };
    setResume(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExp]
    }));
  };

  // Update work experience
  const updateWorkExperience = (id: string, key: keyof ResumeWorkExperience, value: string) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => exp.id === id ? { ...exp, [key]: value } : exp)
    }));
  };

  // Delete work experience
  const deleteWorkExperience = (id: string) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  // Add Education
  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: `edu-${Math.random().toString(36).substr(2, 9)}`,
      school: '',
      degree: '',
      year: ''
    };
    setResume(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  // Update Education
  const updateEducation = (id: string, key: keyof ResumeEducation, value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [key]: value } : edu)
    }));
  };

  // Delete Education
  const deleteEducation = (id: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // Add Skill Tag
  const addSkill = () => {
    if (newSkill.trim() && !resume.skills.includes(newSkill.trim())) {
      setResume(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Remove Skill Tag
  const removeSkill = (skillToRemove: string) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Add Language Tag
  const addLanguage = () => {
    if (newLanguage.trim() && !resume.languages.includes(newLanguage.trim())) {
      setResume(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  // Remove Language Tag
  const removeLanguage = (langToRemove: string) => {
    setResume(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== langToRemove)
    }));
  };

  // --- SERVER-SIDE AI ACTIONS ---

  // AI Polish Summary Action
  const handleAIPolishSummary = async () => {
    if (!resume.targetRole) {
      alert(lang === 'th' ? 'กรุณาระบุตำแหน่งงานเป้าหมายก่อนใช้ AI' : 'Please specify a target role before using AI');
      return;
    }
    setIsPolishingSummary(true);
    try {
      const resData = await fetch('/api/ai/resume-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'polish-summary',
          targetRole: resume.targetRole,
          currentSummary: resume.professionalSummary,
          skills: resume.skills,
          lang: lang
        })
      });
      const data = await resData.json();
      if (data.polishedSummary) {
        updateField('professionalSummary', data.polishedSummary);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('AI summary polish failed:', err);
      alert('AI failed to optimize summary: ' + (err.message || err));
    } finally {
      setIsPolishingSummary(false);
    }
  };

  // AI Polish Job Achievements Action
  const handleAIPolishExperience = async (expId: string, currentExp: ResumeWorkExperience) => {
    if (!resume.targetRole) {
      alert(lang === 'th' ? 'กรุณาระบุตำแหน่งงานเป้าหมายก่อนใช้ AI' : 'Please specify a target role before using AI');
      return;
    }
    setPolishingExpId(expId);
    try {
      const resData = await fetch('/api/ai/resume-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'polish-experience',
          targetRole: resume.targetRole,
          company: currentExp.company,
          role: currentExp.role,
          description: currentExp.description,
          lang: lang
        })
      });
      const data = await resData.json();
      if (data.polishedDescription) {
        updateWorkExperience(expId, 'description', data.polishedDescription);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('AI experience polish failed:', err);
      alert('AI failed to polish description: ' + (err.message || err));
    } finally {
      setPolishingExpId(null);
    }
  };

  // AI Suggest Relevant Skills Action
  const handleAISuggestSkills = async () => {
    if (!resume.targetRole) {
      alert(lang === 'th' ? 'กรุณาระบุตำแหน่งงานเป้าหมายก่อนใช้ AI' : 'Please specify a target role before using AI');
      return;
    }
    setIsSuggestingSkills(true);
    try {
      const resData = await fetch('/api/ai/resume-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest-skills',
          targetRole: resume.targetRole,
          currentSkills: resume.skills,
          lang: lang
        })
      });
      const data = await resData.json();
      if (data.suggestedSkills && Array.isArray(data.suggestedSkills)) {
        // Merge without duplicates
        const unique = Array.from(new Set([...resume.skills, ...data.suggestedSkills]));
        updateField('skills', unique);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('AI skill suggestion failed:', err);
      alert('AI failed to suggest skills: ' + (err.message || err));
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  // Trigger browser print dialog for dynamic printable layout
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest animate-pulse">
          Retrieving Professional Resume Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden" id="resume-builder-root">
      
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between shadow-xs z-10 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
              WorkBridge AI Resume Builder
              <span className="bg-red-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full">
                LIVE AI
              </span>
            </h3>
            <p className="text-[9px] text-slate-400 font-semibold">
              Optimize with Gemini • Standard ATS-Friendly Layouts • Export PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status badge */}
          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />}
            {saveStatus === 'saved' && <Check className="w-3 h-3 text-emerald-500" />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All changes saved' : 'Auto-saved'}
          </span>

          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              {lang === 'th' ? 'กลับ' : 'Back'}
            </button>
          )}
        </div>
      </header>

      {/* View Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex items-center justify-between print:hidden">
        <div className="flex border border-slate-200 bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-1 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'edit' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            {lang === 'th' ? 'แก้ไขเรซูเม' : '1. Edit Resume Information'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1 text-[10px] font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preview' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3 h-3" />
            {lang === 'th' ? 'ดูตัวอย่างและส่งออก' : '2. Preview & Export PDF'}
          </button>
        </div>

        {activeTab === 'preview' && (
          <div className="flex items-center gap-2">
            {/* Design selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-250 rounded-lg p-0.5 mr-2">
              {(['classic', 'modern', 'minimal'] as TemplateId[]).map((tId) => (
                <button
                  key={tId}
                  onClick={() => setSelectedTemplate(tId)}
                  className={`px-2.5 py-1 text-[9px] font-extrabold rounded uppercase transition-all cursor-pointer ${
                    selectedTemplate === tId 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tId}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'พิมพ์ / ดาวน์โหลด PDF' : 'Download PDF / Print'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Builder Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* TAB 1: EDIT FORM */}
        {activeTab === 'edit' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-16 print:hidden">
            
            {/* Target Job Role - CRITICAL FOR AI OPTIMIZATION */}
            <section className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-2xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    Target Job Vocation & Industry
                    <span className="bg-amber-200 text-amber-900 text-[7px] font-extrabold uppercase px-1 rounded">AI Driver</span>
                  </h4>
                  <p className="text-[10px] text-amber-800 leading-normal">
                    AI needs to know your target industry/role to custom-tune your professional summary, achievements, and skills dynamically!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-amber-900 uppercase tracking-wide mb-1">
                  What job role are you applying for?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Waiter, Delivery Truck Driver, General Maid, Office Admin..."
                  value={resume.targetRole}
                  onChange={(e) => updateField('targetRole', e.target.value)}
                  className="w-full bg-white border border-amber-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </section>

            {/* Personal Details */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-600" />
                1. Contact & Personal Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resume.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={resume.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">LINE ID</label>
                  <input
                    type="text"
                    value={resume.lineId}
                    onChange={(e) => updateField('lineId', e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Location (Province / City)</label>
                  <input
                    type="text"
                    value={resume.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g. Pathum Thani, Bangkok, Thailand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Professional Summary */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  2. Professional Summary
                </h4>
                <button
                  type="button"
                  onClick={handleAIPolishSummary}
                  disabled={isPolishingSummary}
                  className="text-[9px] font-extrabold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                >
                  {isPolishingSummary ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Polishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>✨ Optimize Summary with AI</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 font-semibold mb-2">
                  Tell employers about your strengths, years of experience, and specialized skills in 2-3 short sentences.
                </p>
                <textarea
                  rows={3}
                  value={resume.professionalSummary}
                  onChange={(e) => updateField('professionalSummary', e.target.value)}
                  placeholder="Enter a short professional introduction, or write a rough draft and let Gemini polish it."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>
            </section>

            {/* Work Experience */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  3. Work Experience & Employment History
                </h4>
                <button
                  type="button"
                  onClick={addWorkExperience}
                  className="text-[9px] font-black text-slate-800 hover:text-slate-950 uppercase flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  Add Position
                </button>
              </div>

              {resume.workExperience.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">No employment history added</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Click "Add Position" to catalog your career history.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resume.workExperience.map((exp, idx) => (
                    <div key={exp.id} className="relative border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 space-y-3 group">
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => deleteWorkExperience(exp.id)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Delete this position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        POSITION #{idx + 1}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Job Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Line Cook, Assistant Chef"
                            value={exp.role}
                            onChange={(e) => updateWorkExperience(exp.id, 'role', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company / Shop Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Siam Palace Restaurant"
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Duration (Years/Months)</label>
                          <input
                            type="text"
                            placeholder="e.g. 2023 - Present, or 6 Months"
                            value={exp.duration}
                            onChange={(e) => updateWorkExperience(exp.id, 'duration', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Duties & Key Achievements</label>
                          <button
                            type="button"
                            onClick={() => handleAIPolishExperience(exp.id, exp)}
                            disabled={polishingExpId !== null}
                            className="text-[8px] font-extrabold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded px-2 py-0.5 flex items-center gap-1 transition-all"
                          >
                            {polishingExpId === exp.id ? (
                              <>
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                <span>AI Polishing Achievements...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                                <span>AI Professional Bullet-Points</span>
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="List your day-to-day work tasks, accomplishments, or what you learned at this job. Use bullet points or plain paragraphs."
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Education History */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  4. Education, Diplomas & Certificates
                </h4>
                <button
                  type="button"
                  onClick={addEducation}
                  className="text-[9px] font-black text-slate-800 hover:text-slate-950 uppercase flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  Add Education
                </button>
              </div>

              {resume.education.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">No educational history listed</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Add high schools, technical courses, or professional diplomas.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {resume.education.map((edu, idx) => (
                    <div key={edu.id} className="relative border border-slate-150 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-2 group">
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => deleteEducation(edu.id)}
                        className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                        title="Delete education"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                        EDUCATION #{idx + 1}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">School / Academy</label>
                          <input
                            type="text"
                            placeholder="e.g. Yangon High School"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Degree / Certificate</label>
                          <input
                            type="text"
                            placeholder="e.g. Secondary Education Certificate"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Year of Completion</label>
                          <input
                            type="text"
                            placeholder="e.g. 2020"
                            value={edu.year}
                            onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Skills & Vocabularies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Skills Tags Column */}
              <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    5. Job Vocation Skills
                  </h4>
                  <button
                    type="button"
                    onClick={handleAISuggestSkills}
                    disabled={isSuggestingSkills}
                    className="text-[8px] font-extrabold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-0.5 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    {isSuggestingSkills ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Recommending...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AI Suggest Skills</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    {resume.skills.length === 0 ? (
                      <span className="text-[9px] text-slate-400 italic m-auto font-medium">Add professional vocational strengths</span>
                    ) : (
                      resume.skills.map((skill) => (
                        <span 
                          key={skill}
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full"
                        >
                          {skill}
                          <button 
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-blue-500 hover:text-blue-800 font-black text-[10px] ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* Language skills */}
              <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Languages className="w-4 h-4 text-blue-600" />
                  6. Languages
                </h4>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Thai, Burmese, Laos..."
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLanguage();
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    {resume.languages.length === 0 ? (
                      <span className="text-[9px] text-slate-400 italic m-auto font-medium">Add languages you speak</span>
                    ) : (
                      resume.languages.map((l) => (
                        <span 
                          key={l}
                          className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          {l}
                          <button 
                            type="button"
                            onClick={() => removeLanguage(l)}
                            className="text-slate-500 hover:text-slate-800 font-bold text-[10px] ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </section>

            </div>

          </div>
        )}

        {/* TAB 2: LIVE PREVIEW CONTAINER */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-500/10 min-h-0 print:bg-white print:p-0 print:overflow-visible">
            
            {/* The printable sheet */}
            <div 
              id="resume-printable-canvas"
              className={`w-full max-w-[800px] bg-white p-8 sm:p-12 shadow-md rounded-lg min-h-[1050px] flex flex-col justify-between print:shadow-none print:rounded-none print:p-0 print:max-w-none print:w-full print:min-h-0 ${
                selectedTemplate === 'classic' ? 'font-serif' : 'font-sans'
              }`}
            >
              
              <div className="space-y-6">
                
                {/* TEMPLATE 1: CLASSIC EXECUTIVE */}
                {selectedTemplate === 'classic' && (
                  <div className="space-y-6">
                    {/* Header: Centered */}
                    <div className="text-center space-y-1.5 pb-4 border-b border-slate-900">
                      <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wider">{resume.fullName || 'YOUR FULL NAME'}</h1>
                      {resume.targetRole && (
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest italic">{resume.targetRole}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-center gap-y-1 gap-x-4 text-[10px] text-slate-600 font-medium font-mono">
                        {resume.phone && <span className="flex items-center gap-1">📞 {resume.phone}</span>}
                        {resume.email && <span className="flex items-center gap-1">✉️ {resume.email}</span>}
                        {resume.lineId && <span className="flex items-center gap-1">💬 LINE: {resume.lineId}</span>}
                        {resume.location && <span className="flex items-center gap-1">📍 {resume.location}</span>}
                      </div>
                    </div>

                    {/* Professional Summary */}
                    {resume.professionalSummary && (
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-200">Professional Summary</h2>
                        <p className="text-[11px] text-slate-800 leading-relaxed text-justify">{resume.professionalSummary}</p>
                      </div>
                    )}

                    {/* Work Experience */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-200">Professional Experience</h2>
                      {resume.workExperience.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No work experience listed.</p>
                      ) : (
                        <div className="space-y-4">
                          {resume.workExperience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xs font-extrabold text-slate-950">{exp.role || 'Job Role'}</h3>
                                  <p className="text-[10px] font-bold text-slate-600">{exp.company || 'Company Name'}</p>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 font-mono">{exp.duration || 'Dates'}</span>
                              </div>
                              {exp.description && (
                                <p className="text-[10px] text-slate-700 leading-relaxed pl-2 border-l border-slate-200 whitespace-pre-line text-justify">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Skills & Languages Grid */}
                    <div className="grid grid-cols-2 gap-6 pt-2">
                      {/* Skills */}
                      <div className="space-y-1.5">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-200">Core Expertise</h2>
                        <ul className="list-disc pl-4 text-[10px] text-slate-800 space-y-1">
                          {resume.skills.map((s, idx) => (
                            <li key={idx} className="font-semibold">{s}</li>
                          ))}
                          {resume.skills.length === 0 && <span className="text-slate-400 italic">No skills listed.</span>}
                        </ul>
                      </div>

                      {/* Languages & Education */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-200">Languages</h2>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.languages.map((l, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-850 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200">{l}</span>
                            ))}
                            {resume.languages.length === 0 && <span className="text-slate-400 italic">No languages listed.</span>}
                          </div>
                        </div>

                        {/* Education */}
                        <div className="space-y-1.5">
                          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-200">Education</h2>
                          {resume.education.length === 0 ? (
                            <p className="text-[9px] text-slate-400 italic">No educational background listed.</p>
                          ) : (
                            <div className="space-y-2">
                              {resume.education.map((edu) => (
                                <div key={edu.id} className="text-[10px] leading-snug">
                                  <div className="flex justify-between font-bold text-slate-950">
                                    <span>{edu.degree || 'Certificate/Degree'}</span>
                                    <span className="font-mono text-[9px] text-slate-500 font-medium">{edu.year}</span>
                                  </div>
                                  <p className="text-slate-600 text-[9px] font-semibold">{edu.school || 'School'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: MODERN CORPORATE */}
                {selectedTemplate === 'modern' && (
                  <div className="grid grid-cols-12 gap-8">
                    
                    {/* Column 1: Left Profile Details */}
                    <div className="col-span-12 md:col-span-4 space-y-6 md:border-r md:border-slate-200 md:pr-6">
                      
                      <div className="space-y-1">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg select-none">
                          {resume.fullName ? resume.fullName.charAt(0) : 'U'}
                        </div>
                        <h1 className="text-lg font-black text-slate-950 uppercase leading-none mt-2">{resume.fullName || 'FULL NAME'}</h1>
                        <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{resume.targetRole || 'TARGET ROLE'}</p>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contact Details</h3>
                        <div className="space-y-1.5 text-[9px] text-slate-700 font-semibold font-mono">
                          {resume.phone && <p className="flex items-center gap-1.5"><span>📞</span> {resume.phone}</p>}
                          {resume.email && <p className="flex items-center gap-1.5 truncate"><span>✉️</span> {resume.email}</p>}
                          {resume.lineId && <p className="flex items-center gap-1.5"><span>💬</span> LINE: {resume.lineId}</p>}
                          {resume.location && <p className="flex items-center gap-1.5"><span>📍</span> {resume.location}</p>}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Vocational Skills</h3>
                        <div className="flex flex-wrap gap-1">
                          {resume.skills.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-800 text-[8px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Languages spoken</h3>
                        <div className="flex flex-wrap gap-1">
                          {resume.languages.map((l, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-800 border border-blue-100 text-[8px] font-black px-2 py-0.5 rounded uppercase">{l}</span>
                          ))}
                        </div>
                      </div>

                      {/* Education */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Academic Record</h3>
                        {resume.education.map((edu) => (
                          <div key={edu.id} className="text-[9px] leading-tight space-y-0.5">
                            <p className="font-bold text-slate-900">{edu.degree || 'Degree/Certificate'}</p>
                            <p className="text-slate-500 font-semibold">{edu.school || 'School'}</p>
                            <p className="text-slate-400 font-mono">{edu.year}</p>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Column 2: Right Experience Block */}
                    <div className="col-span-12 md:col-span-8 space-y-6">
                      
                      {/* Summary */}
                      {resume.professionalSummary && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-1 border-b-2 border-slate-900">Career Statement</h3>
                          <p className="text-[10px] text-slate-700 leading-relaxed text-justify font-medium">{resume.professionalSummary}</p>
                        </div>
                      )}

                      {/* Experience list */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-1 border-b-2 border-slate-900">Work Experience History</h3>
                        {resume.workExperience.map((exp) => (
                          <div key={exp.id} className="space-y-1.5 relative pl-4 border-l-2 border-blue-600/30">
                            <div className="absolute w-2 h-2 rounded-full bg-blue-600 -left-[5px] top-1" />
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-black text-slate-950">{exp.role || 'Position Role'}</h4>
                                <p className="text-[10px] font-bold text-blue-700">{exp.company || 'Company'}</p>
                              </div>
                              <span className="text-[9px] font-extrabold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{exp.duration}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line text-justify font-medium">
                              {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                )}

                {/* TEMPLATE 3: SLEEK MINIMALIST */}
                {selectedTemplate === 'minimal' && (
                  <div className="space-y-6 text-slate-900">
                    
                    {/* Minimal Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <h1 className="text-2xl font-light tracking-tight text-slate-900">{resume.fullName || 'YOUR NAME'}</h1>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-0.5">{resume.targetRole || 'Target Career Profile'}</p>
                      </div>
                      
                      <div className="text-left sm:text-right text-[9px] font-mono font-medium text-slate-500 space-y-0.5">
                        {resume.phone && <p>📞 {resume.phone}</p>}
                        {resume.email && <p>✉️ {resume.email}</p>}
                        {resume.lineId && <p>💬 LINE: {resume.lineId}</p>}
                        {resume.location && <p>📍 {resume.location}</p>}
                      </div>
                    </div>

                    {/* Summary */}
                    {resume.professionalSummary && (
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-3">
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">About Me</h3>
                        </div>
                        <div className="col-span-12 sm:col-span-9">
                          <p className="text-[10.5px] text-slate-800 leading-relaxed text-justify">{resume.professionalSummary}</p>
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    <div className="grid grid-cols-12 gap-4 pt-2">
                      <div className="col-span-12 sm:col-span-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</h3>
                      </div>
                      <div className="col-span-12 sm:col-span-9 space-y-4">
                        {resume.workExperience.map((exp) => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-xs font-bold text-slate-950">{exp.role} <span className="font-medium text-slate-400">@</span> {exp.company}</h4>
                              <span className="text-[9px] font-mono text-slate-500">{exp.duration}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line text-justify">
                              {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="grid grid-cols-12 gap-4 pt-2">
                      <div className="col-span-12 sm:col-span-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expertise</h3>
                      </div>
                      <div className="col-span-12 sm:col-span-9">
                        <div className="flex flex-wrap gap-1.5">
                          {resume.skills.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-800 text-[9px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="grid grid-cols-12 gap-4 pt-2">
                      <div className="col-span-12 sm:col-span-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Languages</h3>
                      </div>
                      <div className="col-span-12 sm:col-span-9">
                        <p className="text-[10px] text-slate-800 font-semibold">{resume.languages.join(' • ')}</p>
                      </div>
                    </div>

                    {/* Education */}
                    <div className="grid grid-cols-12 gap-4 pt-2">
                      <div className="col-span-12 sm:col-span-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Education</h3>
                      </div>
                      <div className="col-span-12 sm:col-span-9 space-y-2">
                        {resume.education.map((edu) => (
                          <div key={edu.id} className="flex justify-between text-[10px]">
                            <p className="font-bold text-slate-950">{edu.degree} <span className="font-medium text-slate-400">({edu.school})</span></p>
                            <span className="font-mono text-slate-500">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Verified Badge Footer */}
              <div className="mt-12 pt-4 border-t border-slate-100 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <span>WorkBridge Verified Candidate profile</span>
                <span>Thailand Border-Worker Alliance</span>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Embedded print media helper css rules directly in the document */}
      <style>{`
        @media print {
          /* Hide web elements */
          body * {
            visibility: hidden;
          }
          /* Target only the printable sheet canvas */
          #resume-printable-canvas, #resume-printable-canvas * {
            visibility: visible;
          }
          #resume-printable-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Ensure backgrounds aren't stripped by browsers */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide builder root container */
          #resume-builder-root {
            background: transparent !important;
          }
        }
      `}</style>

    </div>
  );
}
