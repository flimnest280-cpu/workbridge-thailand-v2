import React, { useState } from 'react';
import { 
  Briefcase, 
  Globe, 
  MapPin, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Bookmark, 
  FileText, 
  Home, 
  Clock, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { ExternalJob } from '../lib/preset_external_jobs';

// We define the enriched interface here too
export interface ExternalJobEnriched extends ExternalJob {
  province: string;
  district: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Daily';
  postedTime: string;
  requiredDocuments: string[];
  accommodation: 'Yes' | 'No';
  overtime: 'Yes' | 'No';
  label: 'hiring' | 'urgent' | 'featured';
  verified: boolean;
  logoBg: string;
  logoUrl?: string | null;
}

interface ExternalJobCardProps {
  key?: React.Key;
  job: ExternalJobEnriched;
  isSaved: boolean;
  onImportToProfile: (job: ExternalJob) => void;
  onViewDetails: (job: ExternalJobEnriched) => void;
  lang: string;
  t: any;
  localTranslations: any;
}

export default function ExternalJobCard({ 
  job, 
  isSaved, 
  onImportToProfile, 
  onViewDetails, 
  lang, 
  t,
  localTranslations
}: ExternalJobCardProps) {
  const currentLang = localTranslations[lang] || localTranslations.en;
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle Share link
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `*${job.title}* at *${job.company}*\n📍 Location: ${job.district}, ${job.province}\n💰 Salary: ${job.salary}\n🔗 Apply here: ${job.sourceUrl}\n\nShared via WorkBridge Thailand`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Apply flow
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplied(true);
      setTimeout(() => {
        // Open original URL in a new window/tab
        window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
      }, 800);
    }, 1500);
  };

  // Extract letter for avatar
  const initial = job.company ? job.company.charAt(0).toUpperCase() : 'W';

  return (
    <motion.div 
      id={`ext-job-card-${job.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col gap-4"
    >
      {/* Label Badges - absolute top-right */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        {job.label === 'hiring' && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            {currentLang.hiringNow || 'Hiring Now'}
          </span>
        )}
        {job.label === 'urgent' && (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
            {currentLang.urgent || 'Urgent'}
          </span>
        )}
        {job.label === 'featured' && (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            {currentLang.featured || 'Featured'}
          </span>
        )}
      </div>

      {/* Top row: Company details */}
      <div className="flex gap-4 items-start pr-20">
        {/* Company Logo / MD3 Initial representation */}
        <div className="shrink-0">
          {job.logoUrl ? (
            <img 
              src={job.logoUrl} 
              alt={job.company} 
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If it fails to load, fallback to initial avatar representation
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-3xs"
            />
          ) : (
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${job.logoBg} flex items-center justify-center text-white font-extrabold text-base shadow-3xs`}>
              {initial}
            </div>
          )}
        </div>

        {/* Company & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{job.company}</span>
            {job.verified && (
              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-100/50">
                <CheckCircle2 className="w-2.5 h-2.5 text-blue-500 fill-blue-500 text-white" />
                Verified
              </span>
            )}
          </div>
          <h3 className="text-sm font-black text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
            <Globe className="w-3 h-3" />
            <span>Via {job.sourceName}</span>
          </div>
        </div>
      </div>

      {/* Salary Highlight Section */}
      <div className="bg-slate-50/50 rounded-2xl p-3 flex justify-between items-center border border-slate-100/50">
        <div className="space-y-0.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{currentLang.salary || 'Salary'}</span>
          <p className="text-sm font-extrabold text-blue-600">{job.salary}</p>
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{currentLang.employmentType || 'Type'}</span>
          <p className="text-xs font-bold text-slate-700">{job.employmentType}</p>
        </div>
      </div>

      {/* Grid of details: Province, District, Accommodation, Overtime */}
      <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-600 font-semibold">
        <div className="flex items-center gap-2 bg-slate-50/30 p-2 rounded-xl border border-slate-100/30">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-400 font-medium">{currentLang.province || 'Province'}:</strong> {job.province}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50/30 p-2 rounded-xl border border-slate-100/30">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-400 font-medium">{currentLang.district || 'District'}:</strong> {job.district}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50/30 p-2 rounded-xl border border-slate-100/30">
          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-400 font-medium">{currentLang.accommodation || 'Housing'}:</strong> {job.accommodation === 'Yes' ? '🏠 Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50/30 p-2 rounded-xl border border-slate-100/30">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-400 font-medium">{currentLang.overtime || 'OT'}:</strong> {job.overtime === 'Yes' ? '⚡ Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Description Snippet (max 3 lines) */}
      <div className="border-t border-dashed border-slate-100 pt-3">
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-3">
          {job.description || 'No description provided.'}
        </p>
      </div>

      {/* Documents Required */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">{currentLang.requiredDocs || 'Docs'}:</span>
        {job.requiredDocuments.map((doc, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[8px] font-bold px-2 py-0.5 rounded-full border border-slate-200/40">
            <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            {doc}
          </span>
        ))}
        <span className="ml-auto text-[8px] text-slate-400 font-bold flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {job.postedTime}
        </span>
      </div>

      {/* Interactive Actions - MD3 button groupings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100/80 mt-1">
        {/* View Details */}
        <button
          id={`btn-ext-details-${job.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(job);
          }}
          className="py-2 px-2.5 bg-blue-50/60 hover:bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors border border-blue-100/30 active:scale-95"
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          {currentLang.viewDetails || 'Details'}
        </button>

        {/* Apply Now */}
        <button
          id={`btn-ext-apply-${job.id}`}
          onClick={handleApply}
          disabled={isApplying || applied}
          className={`py-2 px-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
            applied 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {isApplying ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          ) : applied ? (
            <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          )}
          {applied ? 'Applied' : (currentLang.applyNow || 'Apply')}
        </button>

        {/* Save Job */}
        <button
          id={`btn-ext-import-${job.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onImportToProfile(job);
          }}
          disabled={isSaved}
          className={`py-2 px-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
            isSaved
              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/40 shadow-3xs'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
          {isSaved ? (currentLang.saved || 'Saved') : (currentLang.saveJob || 'Save')}
        </button>

        {/* Share Button */}
        <button
          id={`btn-ext-share-${job.id}`}
          onClick={handleShare}
          className={`py-2 px-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
            copied
              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/40 shadow-3xs'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          {copied ? 'Copied!' : (currentLang.share || 'Share')}
        </button>
      </div>
    </motion.div>
  );
}
