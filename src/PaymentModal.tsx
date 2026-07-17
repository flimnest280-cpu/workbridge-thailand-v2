import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, RefreshCw, Landmark, QrCode } from 'lucide-react';
import { TranslationSet } from '../translations';

interface PaymentModalProps {
  t: TranslationSet;
  feeAmount: number;
  jobTitle: string;
  employerName: string;
  onClose: () => void;
  onReceiptSubmit: (receiptUrl: string) => void;
}

export default function PaymentModal({ t, feeAmount, jobTitle, employerName, onClose, onReceiptSubmit }: PaymentModalProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Set simulated receipt uploader preview URL
          setPreviewUrl('https://images.unsplash.com/photo-1628258334864-3f0890274127?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3');
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!previewUrl) return;
    onReceiptSubmit(previewUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t.paymentDetails}</h3>
              <p className="text-[10px] text-slate-500">{jobTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 flex flex-col gap-5">
          {/* Fee Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
              <QrCode className="w-32 h-32" />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">
              WorkBridge Processing Fee
            </div>
            <div className="text-2xl font-bold font-display mt-1">
              ฿{feeAmount.toLocaleString()}
            </div>
            <div className="mt-3 pt-3 border-t border-blue-500/30 flex items-center justify-between text-[10px] text-blue-100">
              <div>Employer: <span className="font-semibold text-white">{employerName}</span></div>
              <div className="bg-blue-500/40 px-2 py-0.5 rounded text-white font-medium">Payable via PromtPay</div>
            </div>
          </div>

          {/* QR Code Segment */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              {/* Custom PromptPay QR mockup */}
              <div className="relative w-40 h-40 bg-white flex flex-col items-center justify-center border border-slate-100 rounded-lg">
                <div className="absolute top-1 left-1 right-1 h-5 bg-blue-900 rounded flex items-center justify-center text-white text-[8px] font-bold tracking-wider">
                  Prompt Pay
                </div>
                {/* Simulated QR block lines */}
                <div className="w-28 h-28 bg-slate-100 border border-slate-300 rounded mt-4 flex items-center justify-center relative overflow-hidden">
                  <div className="grid grid-cols-5 gap-1.5 p-2 opacity-80">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded-xs ${
                          (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24) 
                            ? 'bg-blue-950' 
                            : 'bg-transparent'
                        }`} 
                      />
                    ))}
                  </div>
                  {/* Prompt Pay central logo */}
                  <div className="absolute inset-0 m-auto w-8 h-8 bg-white border border-blue-900 flex items-center justify-center rounded">
                    <span className="text-[6px] font-bold text-blue-900">PROMPT</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center max-w-xs">
              Please scan this QR Code using any Thai Mobile Banking Application (SCB, K-Bank, Bangkok Bank) to settle the secure application fee.
            </p>
          </div>

          {/* Drag & Drop File Uploader */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-700">{t.uploadReceipt}</label>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                dragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
              onClick={onButtonClick}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />

              {isUploading ? (
                <div className="flex flex-col items-center py-2 gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  <div className="text-xs font-semibold text-slate-700">Uploading receipt image...</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-xs">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 text-white p-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-slate-800 line-clamp-1">{selectedFileName || "slip-receipt.png"}</div>
                      <div className="text-[9px] text-emerald-700">Scan verified • Ready for submission</div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl('');
                      setSelectedFileName('');
                    }}
                    className="text-[9px] text-red-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3">
                  <div className="bg-white p-2 rounded-full border border-slate-100 text-slate-400 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-600">Click to upload</span>
                    <span className="text-xs text-slate-500"> or drag and drop image</span>
                  </div>
                  <p className="text-[9px] text-slate-400">Supports PNG, JPG (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            type="button"
            disabled={!previewUrl}
            onClick={handleSubmit}
            className={`flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 ${
              previewUrl 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {t.submit}
          </button>
        </div>

      </div>
    </div>
  );
}
