import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Trash2, 
  Globe, 
  ChevronDown, 
  FileText, 
  UserCheck, 
  FileSpreadsheet, 
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { Language } from "../translations";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatBotProps {
  lang: Language;
}

const botTranslations = {
  en: {
    title: "WorkBridge AI Assistant",
    subtitle: "Online • Ask me anything",
    placeholder: "Type your question...",
    helpText: "Need help? Ask our AI Assistant!",
    apply: "How to apply for a job",
    docs: "Required documents",
    resume: "Resume tips",
    interview: "Interview tips",
    clear: "Clear Chat",
    errorMessage: "Something went wrong. Please try again.",
    welcome: "Hello! I am your WorkBridge AI Assistant. I can help you with applying for jobs in Thailand, required legal documents, resume tips, and interview preparation. How can I assist you today?"
  },
  th: {
    title: "ผู้ช่วย AI WorkBridge",
    subtitle: "ออนไลน์ • ถามฉันได้ทุกเรื่อง",
    placeholder: "พิมพ์คำถามของคุณ...",
    helpText: "ต้องการความช่วยเหลือ? ถามผู้ช่วย AI ของเรา!",
    apply: "วิธีการสมัครงาน",
    docs: "เอกสารที่จำเป็น",
    resume: "เคล็ดลับเรซูเม",
    interview: "เคล็ดลับการสัมภาษณ์",
    clear: "ล้างประวัติ",
    errorMessage: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    welcome: "สวัสดีครับ! ผมคือผู้ช่วย AI ของ WorkBridge ผมสามารถช่วยเหลือคุณเกี่ยวกับการสมัครงานในไทย เอกสารที่จำเป็น เคล็ดลับเรซูเม และการเตรียมตัวสัมภาษณ์ วันนี้ต้องการให้ผมช่วยเหลือเรื่องอะไรดีครับ?"
  },
  my: {
    title: "WorkBridge AI ကူညီသူ",
    subtitle: "အွန်လိုင်း • ကြိုက်တာမေးပါ",
    placeholder: "မေးခွန်းရိုက်ထည့်ပါ...",
    helpText: "အကူအညီလိုပါသလား။ AI ကိုမေးမြန်းပါ။",
    apply: "အလုပ်လျှောက်ထားနည်း",
    docs: "လိုအပ်သောစာရွက်စာတမ်းများ",
    resume: "ကိုယ်ရေးရာဇဝင်အကျဉ်း အကြံပြုချက်များ",
    interview: "အင်တာဗျူး အကြံပြုချက်များ",
    clear: "စကားပြောမှတ်တမ်း ဖျက်ရန်",
    errorMessage: "တစ်ခုခုမှားယွင်းနေပါသည်။ ထပ်မံကြိုးစားပါ။",
    welcome: "မင်္ဂလာပါ! ကျွန်တော်က WorkBridge ရဲ့ AI ကူညီသူဖြစ်ပါတယ်။ ထိုင်းနိုင်ငံတွင် အလုပ်လျှောက်ထားခြင်း၊ လိုအပ်သော တရားဝင်စာရွက်စာတမ်းများ၊ ကိုယ်ရေးရာဇဝင်အကျဉ်းနှင့် အင်တာဗျူးပြင်ဆင်ခြင်းများတွင် ကူညီပေးနိုင်ပါသည်။ ယနေ့ ဘာများကူညီပေးရမလဲခင်ဗျာ။"
  },
  lo: {
    title: "ຜູ້ຊ່ວຍ AI WorkBridge",
    subtitle: "ອອນລາຍ • ຖາມຂ້ອຍໄດ້ທຸກເລື່ອງ",
    placeholder: "ພິມຄຳຖາມຂອງທ່ານ...",
    helpText: "ຕ້ອງການຄວາມຊ່ວຍເຫຼືອ? ຖາມຜູ້ຊ່ວຍ AI ຂອງພວກເຮົາ!",
    apply: "ວິທີການສະໝັກວຽກ",
    docs: "ເອກະສານທີ່ຈຳເປັນ",
    resume: "ເຄັດລັບຊີວະປະຫວັດ",
    interview: "ເຄັດລັບການສຳພາດ",
    clear: "ລ້າງປະຫວັດ",
    errorMessage: "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ອີកຄັ້ງ",
    welcome: "ສະບາຍດີ! ຂ້ອຍແມ່ນຜູ້ຊ່ວຍ AI ຂອງ WorkBridge. ຂ້ອຍສາມາດຊ່ວຍເຈົ້າໃນການສະໝັກວຽກຢູ່ໄທ, ເອກະສານທີ່ຈຳເປັນ, ເຄັດລັບຊີວະປະຫວັດ ແລະ ການກຽມຕົວສຳພາດ. ມື້ນີ້ມີຫຍັງໃຫ້ຊ່ວຍບໍ່?"
  },
  km: {
    title: "ជំនួយការ AI WorkBridge",
    subtitle: "អនឡាញ • សួរខ្ញុំបានគ្រប់រឿង",
    placeholder: "សរសេរសំណួររបស់អ្នក...",
    helpText: "ត្រូវការជំនួយ? សួរជំនួយការ AI របស់យើង!",
    apply: "របៀបដាក់ពាក្យធ្វើការ",
    docs: "ឯកសារដែលត្រូវការ",
    resume: "គន្លឹះសរសេរប្រវត្តិរូបសង្ខេប",
    interview: "គន្លឹះត្រៀមសម្ភាសន៍",
    clear: "សម្អាតប្រវត្តិ",
    errorMessage: "មានបញ្ហាខុសឆ្គង។ សូមព្យាយាមម្តងទៀត។",
    welcome: "សួស្តី! ខ្ញុំជាជំនួយការ AI របស់ WorkBridge។ ខ្ញុំអាចជួយអ្នកក្នុងការដាក់ពាក្យធ្វើការនៅប្រទេសថៃ, ឯកសារច្បាប់តម្រូវ, គន្លឹះសរសេរប្រវត្តិរូបសង្ខេប និងការត្រៀមសម្ភាសន៍។ តើខ្ញុំអាចជួយអ្វីអ្នកបានខ្លះនៅថ្ងៃនេះ?"
  }
};

export default function AIChatBot({ lang }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = botTranslations[lang] || botTranslations.en;

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("workbridge_ai_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading chat history", e);
      }
    } else {
      // Setup initial welcome message
      setMessages([
        { role: "assistant", content: t.welcome }
      ]);
    }

    // Show floating help tooltip after 3 seconds, hide after 10 seconds
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [lang]);

  // Update localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("workbridge_ai_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || inputVal.trim();
    if (!queryText || isLoading) return;

    // Clear input if we are sending from input field
    if (!textToSend) {
      setInputVal("");
    }

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: queryText }
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI server");
      }

      const data = await response.json();
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.text || t.errorMessage }
      ]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: t.errorMessage }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm(lang === 'th' ? "คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการสนทนา?" : "Are you sure you want to clear the chat history?")) {
      const initial = [{ role: "assistant" as const, content: t.welcome }];
      setMessages(initial);
      localStorage.setItem("workbridge_ai_history", JSON.stringify(initial));
    }
  };

  // Safe helper to render inline markdown format
  const formatInlineMarkdown = (text: string): string => {
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    return formatted;
  };

  // Safe helper to render complex text block (splits lists, bold etc)
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((paragraph, pIdx) => {
      // Process bullet list
      if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
        const lines = paragraph.split('\n');
        return (
          <ul key={pIdx} className="list-disc pl-5 mb-3 space-y-1 text-slate-700">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[-*]\s+/, '');
              return (
                <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanLine) }} />
              );
            })}
          </ul>
        );
      }
      
      // Process numbered list
      if (/^\d+\.\s+/.test(paragraph.trim())) {
        const lines = paragraph.split('\n');
        return (
          <ol key={pIdx} className="list-decimal pl-5 mb-3 space-y-1 text-slate-700">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^\d+\.\s+/, '');
              return (
                <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanLine) }} />
              );
            })}
          </ol>
        );
      }

      // Standard paragraph
      return (
        <p
          key={pIdx}
          className="mb-3 text-slate-700 leading-relaxed text-sm last:mb-0"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph) }}
        />
      );
    });
  };

  const getPresetIcon = (type: string) => {
    switch (type) {
      case "apply": return <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />;
      case "docs": return <FileText className="w-4 h-4 text-red-600 shrink-0" />;
      case "resume": return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "interview": return <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />;
      default: return <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
  };

  const presets = [
    { key: "apply", text: t.apply },
    { key: "docs", text: t.docs },
    { key: "resume", text: t.resume },
    { key: "interview", text: t.interview }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Help Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-3 mr-1 bg-slate-900 text-white text-xs py-2 px-3.5 rounded-lg shadow-xl flex items-center gap-2 pointer-events-auto border border-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{t.helpText}</span>
            <button 
              onClick={() => setShowTooltip(false)} 
              className="text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[360px] sm:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden pointer-events-auto mb-4 origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-tight leading-none text-white">{t.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-slate-300 font-medium">{t.subtitle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800"
                  title={t.clear}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold text-xs ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-900 text-slate-100"
                    }`}>
                      {msg.role === "user" ? "U" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div className={`rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none text-sm"
                        : "bg-white border border-slate-100 rounded-tl-none"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      ) : (
                        <div>
                          {renderFormattedText(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] flex gap-2.5 flex-row">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      AI
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap gap-2 shrink-0">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleSend(p.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 border border-slate-150 rounded-full px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 transition-all font-medium cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {getPresetIcon(p.key)}
                  <span>{p.text}</span>
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={t.placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isLoading}
                  className="bg-slate-900 hover:bg-blue-600 active:scale-95 text-white p-2 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-slate-900 disabled:scale-100 cursor-pointer shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="text-[9px] text-center text-slate-400 mt-2 font-medium flex items-center justify-center gap-1 select-none">
                <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                <span>WorkBridge Thailand AI Companion</span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        id="btn-ai-assistant"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl relative pointer-events-auto cursor-pointer focus:outline-hidden border-2 border-white dark:border-slate-800 hover:bg-blue-600 transition-colors duration-200"
      >
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping pointer-events-none scale-105" />
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-2 bg-slate-900 rounded-full p-0.5 animate-bounce" />
          </div>
        )}
      </motion.button>

    </div>
  );
}
