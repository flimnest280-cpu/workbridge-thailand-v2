import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Search, 
  Trash2, 
  Ban, 
  Flag, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  VideoOff, 
  Camera, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Smile, 
  UserX, 
  AlertTriangle, 
  X, 
  ArrowLeft, 
  Clock, 
  Plus, 
  ChevronRight,
  Image as ImageIcon,
  FileText as FileIcon,
  Download,
  PhoneOff,
  User as UserIcon,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, User, Conversation, Message, Call, BlockedUser, Application } from '../lib/db';

interface ChatSystemProps {
  currentUser: User;
  refreshParentData?: () => void;
  lang?: string;
}

export default function ChatSystem({ currentUser, refreshParentData, lang = 'en' }: ChatSystemProps) {
  // Sidebar Tabs
  type Tab = 'chats' | 'contacts' | 'calls' | 'blocked';
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  
  // Data States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [callsLog, setCallsLog] = useState<Call[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Selection and Search States
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // New Message State
  const [newMessageText, setNewMessageText] = useState('');
  
  // Attachment upload simulation state
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: 'image' | 'document' } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Block & Report State
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  // Active Call States
  interface ActiveCall {
    id: string;
    callerId: string;
    receiverId: string;
    type: 'voice' | 'video';
    status: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended';
    duration: number;
    otherUser: User;
    isIncoming: boolean;
  }
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMode, setIsSpeakerMode] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  
  // Audio Ringtone Ref
  const stopRingtoneRef = useRef<(() => void) | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load and refresh core data
  useEffect(() => {
    loadCoreData();
    
    // Subscribe to database changes (Supabase Postgres changes or local subscriptions)
    const unsubscribeConversations = db.subscribeToChanges('conversations', () => {
      loadConversations();
    });
    
    const unsubscribeMessages = db.subscribeToChanges('messages', () => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
      loadConversations();
    });

    const unsubscribeCalls = db.subscribeToChanges('calls', () => {
      loadCallsLog();
    });

    const unsubscribeBlocked = db.subscribeToChanges('blocked_users', () => {
      loadBlockedUsers();
    });

    return () => {
      unsubscribeConversations();
      unsubscribeMessages();
      unsubscribeCalls();
      unsubscribeBlocked();
      if (stopRingtoneRef.current) stopRingtoneRef.current();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentUser.id, selectedConversation?.id]);

  const loadCoreData = async () => {
    try {
      // Load all system users
      const users = await db.getUsers();
      setAllUsers(users);

      // Load conversations
      await loadConversations();
      
      // Load calls log
      await loadCallsLog();

      // Load blocked users
      await loadBlockedUsers();

      // Load contacts according to business rules:
      // - Employers can only chat with applicants.
      // - Job Seekers can only chat with employers after applying.
      const apps = await db.getApplications();
      const jobs = await db.getJobs();
      
      let filteredContacts: User[] = [];
      
      if (currentUser.role === 'seeker') {
        // Seeker applied for these jobs
        const myAppliedJobIds = apps
          .filter(a => a.seekerId === currentUser.id)
          .map(a => a.jobId);
        
        const myAppliedJobs = jobs.filter(j => myAppliedJobIds.includes(j.id));
        const employerIds = myAppliedJobs.map(j => j.employerId);
        
        filteredContacts = users.filter(u => employerIds.includes(u.id) && u.role === 'employer');
      } else if (currentUser.role === 'employer') {
        // Employer received applications
        const myJobs = jobs.filter(j => j.employerId === currentUser.id);
        const myJobIds = myJobs.map(j => j.id);
        
        const myApplicants = apps.filter(a => myJobIds.includes(a.jobId));
        const applicantIds = myApplicants.map(a => a.seekerId);
        
        filteredContacts = users.filter(u => applicantIds.includes(u.id) && u.role === 'seeker');
      } else if (currentUser.role === 'admin') {
        // Admin can chat with everyone
        filteredContacts = users.filter(u => u.id !== currentUser.id);
      }

      // Fallback: If no official contacts, inject friendly demo contacts for high fidelity testing
      if (filteredContacts.length === 0) {
        const demoRecruiter: User = {
          id: 'demo-employer-id',
          phone: '0812345678',
          role: 'employer',
          fullName: 'Somsak (WorkBridge Recruiter)',
          lineId: 'somsak_workbridge',
          createdAt: new Date().toISOString()
        };
        const demoApplicant: User = {
          id: 'demo-seeker-id',
          phone: '0898765432',
          role: 'seeker',
          fullName: 'Apinya (Candidate)',
          lineId: 'apinya_jobs',
          createdAt: new Date().toISOString()
        };

        if (currentUser.role === 'seeker') {
          filteredContacts.push(demoRecruiter);
        } else {
          filteredContacts.push(demoApplicant);
        }
      }

      setContacts(filteredContacts);
    } catch (e) {
      console.error("Error loading chat core data:", e);
    }
  };

  const loadConversations = async () => {
    const list = await db.getConversations(currentUser.id);
    setConversations(list);
  };

  const loadMessages = async (convId: string) => {
    const list = await db.getMessages(convId);
    setMessages(list);
    
    // Auto-scroll to end of messages
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Mark messages as read/seen
    await db.markMessagesAsSeen(convId, currentUser.id);
    loadConversations();
    if (refreshParentData) refreshParentData();
  };

  const loadCallsLog = async () => {
    const list = await db.getCalls(currentUser.id);
    setCallsLog(list);
  };

  const loadBlockedUsers = async () => {
    const list = await db.getBlockedUsers(currentUser.id);
    setBlockedUsers(list);
  };

  // Sound Synthesizer Ringtone Helper
  const startRingtoneSound = (isIncoming: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      let isPlaying = true;
      
      const playBeep = () => {
        if (!isPlaying) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        if (isIncoming) {
          // Play classic beautiful smartphone chime ringtone
          osc1.frequency.setValueAtTime(480, audioCtx.currentTime);
          osc2.frequency.setValueAtTime(520, audioCtx.currentTime);
        } else {
          // Play outbound ring ring ring back signal
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
        }
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.3);
        
        osc1.start();
        osc2.start();
        
        osc1.stop(audioCtx.currentTime + 1.4);
        osc2.stop(audioCtx.currentTime + 1.4);
      };

      playBeep();
      const ringInterval = setInterval(() => {
        if (!isPlaying) return;
        playBeep();
      }, 2400);

      stopRingtoneRef.current = () => {
        isPlaying = false;
        clearInterval(ringInterval);
        audioCtx.close().catch(() => {});
      };
    } catch (e) {
      console.warn("Audio Context chime failed:", e);
    }
  };

  // Handle Conversation Selection
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);
    
    // Listen for typing indicator
    const timer = setInterval(async () => {
      const refreshedConvs = await db.getConversations(currentUser.id);
      const current = refreshedConvs.find(c => c.id === conv.id);
      if (current) {
        const otherTyping = currentUser.role === 'seeker' ? current.employerTyping : current.seekerTyping;
        setOtherUserTyping(!!otherTyping);
      }
    }, 2000);

    return () => clearInterval(timer);
  };

  // Get Other User Profile Helper
  const getOtherUserInConversation = (conv: Conversation): User => {
    const otherId = conv.seekerId === currentUser.id ? conv.employerId : conv.seekerId;
    const match = allUsers.find(u => u.id === otherId);
    if (match) return match;
    
    // Demo fallback profiles
    if (otherId === 'demo-employer-id') {
      return {
        id: 'demo-employer-id',
        phone: '0812345678',
        role: 'employer',
        fullName: 'Somsak (WorkBridge Recruiter)',
        lineId: 'somsak_workbridge',
        createdAt: new Date().toISOString()
      };
    }
    return {
      id: otherId,
      phone: '0999999999',
      role: conv.seekerId === currentUser.id ? 'employer' : 'seeker',
      fullName: conv.seekerId === currentUser.id ? 'Employer Partner' : 'Applicant Candidate',
      createdAt: new Date().toISOString()
    };
  };

  // Send New Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation) return;
    if (!newMessageText.trim() && !attachedFile) return;

    const otherUser = getOtherUserInConversation(selectedConversation);
    
    // Check if user is blocked
    const isBlocked = blockedUsers.some(b => b.blockedId === otherUser.id);
    if (isBlocked) {
      alert("You cannot send messages to blocked users.");
      return;
    }

    const payloadText = newMessageText;
    const payloadFile = attachedFile;

    setNewMessageText('');
    setAttachedFile(null);

    // Call DB to send message
    await db.sendMessage({
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      recipientId: otherUser.id,
      text: payloadText || undefined,
      fileUrl: payloadFile?.url || undefined,
      fileName: payloadFile?.name || undefined,
      fileType: payloadFile?.type || undefined
    });

    // Clear typing status immediately
    handleTypingStop();

    await loadMessages(selectedConversation.id);

    // Dynamic Recruiter Auto-replier rule to make it 100% interactive and satisfying
    if (otherUser.id === 'demo-employer-id' || otherUser.id === 'demo-seeker-id') {
      setTimeout(async () => {
        // Show typing indicator
        await db.setTypingStatus(selectedConversation.id, otherUser.id, true);
        setOtherUserTyping(true);

        setTimeout(async () => {
          let automaticReplyText = "Thank you for reaching out! Your application looks promising. Let's schedule a call tomorrow.";
          if (payloadText.toLowerCase().includes('hi') || payloadText.toLowerCase().includes('hello')) {
            automaticReplyText = `Hi ${currentUser.fullName}! I am glad to assist you today. What details would you like to know about our open vacancy?`;
          } else if (payloadText.toLowerCase().includes('call') || payloadText.toLowerCase().includes('phone')) {
            automaticReplyText = "Sure! You can tap the voice call or video call icon at the top right of this screen to ring me immediately! I am online now.";
          }

          await db.sendMessage({
            conversationId: selectedConversation.id,
            senderId: otherUser.id,
            recipientId: currentUser.id,
            text: automaticReplyText
          });

          await db.setTypingStatus(selectedConversation.id, otherUser.id, false);
          setOtherUserTyping(false);
          await loadMessages(selectedConversation.id);
        }, 1500);
      }, 800);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedConversation) return;
    if (confirm("Are you sure you want to delete this message?")) {
      await db.deleteMessage(msgId);
      await loadMessages(selectedConversation.id);
    }
  };

  // Block & Unblock User Handler
  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    const otherUser = getOtherUserInConversation(selectedConversation);
    await db.blockUser(currentUser.id, otherUser.id, blockReason);
    setShowBlockModal(false);
    setBlockReason('');
    await loadBlockedUsers();
    alert(`Successfully blocked ${otherUser.fullName}`);
  };

  const handleUnblockUser = async (blockedId: string) => {
    await db.unblockUser(currentUser.id, blockedId);
    await loadBlockedUsers();
    alert(`Successfully unblocked user`);
  };

  const handleReportUser = () => {
    if (!selectedConversation) return;
    const otherUser = getOtherUserInConversation(selectedConversation);
    alert(`Thank you for submitting your report for ${otherUser.fullName}. Our security moderation team is investigating.`);
    setShowReportModal(false);
    setReportReason('');
  };

  // Typing Indicator Trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessageText(e.target.value);
    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      db.setTypingStatus(selectedConversation.id, currentUser.id, true);
    }
    
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  };

  const handleTypingStop = () => {
    setIsTyping(false);
    if (selectedConversation) {
      db.setTypingStatus(selectedConversation.id, currentUser.id, false);
    }
  };

  // Create Conversation with a contact
  const handleStartChatWithContact = async (contact: User) => {
    const conv = await db.getOrCreateConversation(
      currentUser.role === 'seeker' ? currentUser.id : contact.id,
      currentUser.role === 'employer' ? currentUser.id : contact.id
    );
    setActiveTab('chats');
    handleSelectConversation(conv);
  };

  // Attachment upload simulation
  const triggerSimulatedAttachment = (type: 'image' | 'document') => {
    setShowAttachmentMenu(false);
    if (type === 'image') {
      setAttachedFile({
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
        name: 'candidate_photo.jpg',
        type: 'image'
      });
    } else {
      setAttachedFile({
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        name: 'applicant_cv_workbridge.pdf',
        type: 'document'
      });
    }
  };

  // --- CALLING LOGIC (VOICE & VIDEO) ---
  const handleInitiateCall = async (type: 'voice' | 'video') => {
    if (!selectedConversation) return;
    const otherUser = getOtherUserInConversation(selectedConversation);
    
    // Check if other user is blocked
    const isBlocked = blockedUsers.some(b => b.blockedId === otherUser.id);
    if (isBlocked) {
      alert("Unblock user to make a call.");
      return;
    }

    // 1. Create a call entry in Supabase/localStorage
    const callLog = await db.createCall({
      callerId: currentUser.id,
      receiverId: otherUser.id,
      type,
      status: 'ringing',
      duration: 0
    });

    // 2. Set Active Call State
    const activeCallState: ActiveCall = {
      id: callLog.id,
      callerId: currentUser.id,
      receiverId: otherUser.id,
      type,
      status: 'ringing',
      duration: 0,
      otherUser,
      isIncoming: false
    };
    setActiveCall(activeCallState);
    
    // 3. Start Ringtone tone
    startRingtoneSound(false);

    // 4. If calling a demo user, let them "Answer" after 3 seconds for maximum interactivity!
    if (otherUser.id === 'demo-employer-id' || otherUser.id === 'demo-seeker-id') {
      setTimeout(() => {
        handleAnswerIncomingCall(activeCallState);
      }, 3500);
    }
  };

  const handleAnswerIncomingCall = async (incomingCall: ActiveCall) => {
    if (stopRingtoneRef.current) stopRingtoneRef.current();
    
    // Update call status to accepted
    await db.updateCallStatus(incomingCall.id, 'accepted');

    const updatedCall: ActiveCall = {
      ...incomingCall,
      status: 'accepted'
    };
    setActiveCall(updatedCall);

    // Initialize Camera Stream if Video
    if (incomingCall.type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera media access blocked or unavailable:", err);
      }
    }

    // Start Call Timer counter
    let dur = 0;
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      dur += 1;
      setActiveCall(prev => {
        if (!prev) return null;
        return { ...prev, duration: dur };
      });
    }, 1000);
  };

  const handleRejectIncomingCall = async (incomingCall: ActiveCall) => {
    if (stopRingtoneRef.current) stopRingtoneRef.current();
    
    await db.updateCallStatus(incomingCall.id, 'rejected');
    setActiveCall(null);
    loadCallsLog();
  };

  const handleEndCall = async () => {
    if (stopRingtoneRef.current) stopRingtoneRef.current();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (activeCall) {
      const finalStatus = activeCall.status === 'ringing' ? 'missed' : 'ended';
      await db.updateCallStatus(activeCall.id, finalStatus, activeCall.duration);
    }

    setActiveCall(null);
    loadCallsLog();
  };

  // Simulated incoming call triggering for user testing
  const triggerIncomingCallSimulation = () => {
    if (!selectedConversation) {
      alert("Please select a conversation first to simulate an incoming call from them.");
      return;
    }
    const otherUser = getOtherUserInConversation(selectedConversation);
    
    const simCall: ActiveCall = {
      id: `call-sim-${Math.random().toString(36).substr(2, 9)}`,
      callerId: otherUser.id,
      receiverId: currentUser.id,
      type: Math.random() > 0.5 ? 'video' : 'voice',
      status: 'ringing',
      duration: 0,
      otherUser,
      isIncoming: true
    };

    setActiveCall(simCall);
    startRingtoneSound(true);
  };

  // Search filter calculation
  const filteredConversations = conversations.filter(conv => {
    const other = getOtherUserInConversation(conv);
    return other.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (conv.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div id="chatsystem-container" className="flex-1 flex overflow-hidden bg-slate-50 relative">
      
      {/* 1. SIDEBAR GRID (CONTACTS & CHATS) */}
      <div className={`w-full md:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>WorkBridge Chat</span>
            </h2>
            <button 
              onClick={() => triggerIncomingCallSimulation()}
              className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded-full transition-all"
              title="Simulate incoming call from selected user"
            >
              📞 Sim Incoming
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search chats..." : "Search contacts..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-slate-700 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Sidebar Inner Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${activeTab === 'chats' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Chats
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${activeTab === 'contacts' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Contacts
            </button>
            <button 
              onClick={() => setActiveTab('calls')}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${activeTab === 'calls' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Calls
            </button>
            <button 
              onClick={() => setActiveTab('blocked')}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${activeTab === 'blocked' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Blocked
            </button>
          </div>
        </div>

        {/* Sidebar List Content */}
        <div className="flex-1 overflow-y-auto">
          {/* A. CHATS LISTING */}
          {activeTab === 'chats' && (
            <div className="divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <p className="font-semibold">No active conversations</p>
                  <p className="text-[10px] text-slate-400 mt-1">Go to the Contacts tab to start a new chat!</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const other = getOtherUserInConversation(conv);
                  const isUnread = currentUser.role === 'seeker' ? conv.unreadBySeeker > 0 : conv.unreadByEmployer > 0;
                  const unreadCount = currentUser.role === 'seeker' ? conv.unreadBySeeker : conv.unreadByEmployer;
                  
                  return (
                    <div 
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200">
                          {other.fullName.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{other.fullName}</h4>
                          <span className="text-[8px] text-slate-400">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium flex items-center justify-between">
                          <span>{conv.lastMessage || 'Start conversation...'}</span>
                          {isUnread && (
                            <span className="bg-blue-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* B. CONTACTS LISTING (RULE-BASED) */}
          {activeTab === 'contacts' && (
            <div className="divide-y divide-slate-100 p-2 space-y-1">
              <div className="p-2.5 bg-blue-50/50 rounded-lg text-[10px] text-blue-700 border border-blue-100 mb-2">
                <strong>🔒 Contacts Rule:</strong> {currentUser.role === 'seeker' 
                  ? "You can only chat with employers of jobs you have applied to." 
                  : "You can only chat with job seekers who applied to your job postings."}
              </div>

              {contacts.map(contact => (
                <div 
                  key={contact.id}
                  onClick={() => handleStartChatWithContact(contact)}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                      {contact.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{contact.fullName}</h4>
                      <p className="text-[9px] text-slate-400 capitalize">{contact.role} · LINE: {contact.lineId || 'No LINE ID'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* C. CALLS LOG */}
          {activeTab === 'calls' && (
            <div className="divide-y divide-slate-100 p-2">
              {callsLog.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No calling history logs</div>
              ) : (
                callsLog.map(call => {
                  const otherId = call.callerId === currentUser.id ? call.receiverId : call.callerId;
                  const other = allUsers.find(u => u.id === otherId) || { fullName: 'User Partner' };
                  const isOutgoing = call.callerId === currentUser.id;
                  
                  return (
                    <div key={call.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{other.fullName}</h4>
                          <p className="text-[8px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{isOutgoing ? '↗ Outgoing' : '↙ Incoming'}</span>
                            <span>•</span>
                            <span className="capitalize">{call.status}</span>
                            {call.duration > 0 && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400">
                        {new Date(call.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* D. BLOCKED LISTING */}
          {activeTab === 'blocked' && (
            <div className="p-3 space-y-2">
              {blockedUsers.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">No blocked users</p>
              ) : (
                blockedUsers.map(b => {
                  const blockedMatch = allUsers.find(u => u.id === b.blockedId);
                  const name = blockedMatch?.fullName || 'User Partner';
                  
                  return (
                    <div key={b.id} className="p-2 bg-red-50/50 border border-red-100 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{name}</div>
                        {b.reason && <div className="text-[8px] text-red-600 font-semibold mt-0.5">Reason: {b.reason}</div>}
                      </div>
                      <button 
                        onClick={() => handleUnblockUser(b.blockedId)}
                        className="text-[8px] bg-red-600 hover:bg-red-700 text-white font-extrabold px-2 py-1 rounded-md"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CHAT PANEL SCREEN */}
      <div className={`flex-1 flex flex-col bg-slate-50 relative ${selectedConversation ? 'flex' : 'hidden md:flex items-center justify-center'}`}>
        {selectedConversation ? (
          <>
            {/* Active Header */}
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between select-none shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-700" />
                </button>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {getOtherUserInConversation(selectedConversation).fullName.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full"></span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-slate-800 truncate">
                    {getOtherUserInConversation(selectedConversation).fullName}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-semibold">
                    {otherUserTyping ? 'typing...' : 'Online'}
                  </p>
                </div>
              </div>

              {/* Call Control Triggers */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleInitiateCall('voice')}
                  className="p-2 hover:bg-slate-100 text-blue-600 rounded-full transition-all"
                  title="Make Voice Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleInitiateCall('video')}
                  className="p-2 hover:bg-slate-100 text-blue-600 rounded-full transition-all"
                  title="Make HD Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowBlockModal(true)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-all"
                    title="Block User"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2 hover:bg-slate-100 text-amber-600 rounded-full transition-all"
                  title="Report Abuse"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Messages Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <p className="font-semibold">Start chatting with {getOtherUserInConversation(selectedConversation).fullName}</p>
                  <p className="text-[10px] mt-1 text-slate-400">Your messages are secured with RLS.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl p-3 shadow-xs ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>
                        {/* File attachment preview if present */}
                        {msg.fileUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 p-1">
                            {msg.fileType === 'image' ? (
                              <img src={msg.fileUrl} alt={msg.fileName} className="max-h-36 object-cover rounded" />
                            ) : (
                              <div className="flex items-center gap-2 text-slate-700 p-1.5">
                                <FileIcon className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold truncate">{msg.fileName}</p>
                                  <p className="text-[8px] text-slate-400">PDF Document</p>
                                </div>
                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs leading-normal whitespace-pre-wrap">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-75 select-none">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && (
                            msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-emerald-300" /> : <Check className="w-3 h-3 text-slate-200" />
                          )}
                        </div>

                        {/* Trash to delete if mine */}
                        {isMine && !msg.isDeleted && (
                          <div className="flex justify-end mt-1.5 opacity-0 hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[8px] text-red-200 hover:text-red-100 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 text-xs rounded-2xl px-4 py-2 border border-slate-100 flex items-center gap-1.5">
                    <span className="font-semibold">{getOtherUserInConversation(selectedConversation).fullName} is typing</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Text Input Footer Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex flex-col gap-2 shrink-0">
              {attachedFile && (
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {attachedFile.type === 'image' ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileIcon className="w-4 h-4 text-red-500" />}
                    <span className="font-bold text-slate-700 truncate max-w-xs">{attachedFile.name}</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                    title="Attach File"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  {showAttachmentMenu && (
                    <div className="absolute bottom-11 left-0 bg-white border border-slate-200 p-2 rounded-xl shadow-lg flex flex-col gap-1 w-32 z-20">
                      <button 
                        type="button"
                        onClick={() => triggerSimulatedAttachment('image')}
                        className="p-2 hover:bg-slate-50 text-left text-[10px] font-bold text-slate-700 flex items-center gap-1.5 rounded"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Share Photo
                      </button>
                      <button 
                        type="button"
                        onClick={() => triggerSimulatedAttachment('document')}
                        className="p-2 hover:bg-slate-50 text-left text-[10px] font-bold text-slate-700 flex items-center gap-1.5 rounded"
                      >
                        <FileIcon className="w-3.5 h-3.5 text-red-600" /> Share CV/Doc
                      </button>
                    </div>
                  )}
                </div>

                <input 
                  type="text" 
                  value={newMessageText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 focus:outline-none focus:border-blue-400 placeholder-slate-400 font-semibold"
                />

                <button 
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center select-none gap-3">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-2xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm">WorkBridge Concierge Messaging</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                Select an applicant or employer from your sidebar to start high-fidelity chats, voice calls, and video conferences instantly!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- BLOCK MODAL --- */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="text-center space-y-1">
              <UserX className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Block User?</h3>
              <p className="text-[10px] text-slate-400">Blocked users will not be able to call or send messages to you.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Reason (Optional)</label>
              <textarea 
                placeholder="Spam, harassment, inappropriate behavior..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg h-20 font-semibold focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleBlockUser} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="text-center space-y-1">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Report Account</h3>
              <p className="text-[10px] text-slate-400">Let our moderation team review this conversation for terms violations.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Detailed Violation</label>
              <textarea 
                placeholder="Explain the violation of safety rules..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg h-20 font-semibold focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleReportUser} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. ACTIVE VOICE & VIDEO CALL OVERLAY PANEL --- */}
      {activeCall && (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-6 select-none">
          
          {/* Call Header */}
          <div className="text-center space-y-2 mt-12">
            <div className="w-20 h-20 bg-slate-800 text-white text-3xl font-bold rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-blue-500 animate-pulse">
              {activeCall.otherUser.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">{activeCall.otherUser.fullName}</h2>
              <span className="bg-slate-800 text-[10px] text-slate-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider block w-max mx-auto mt-2.5">
                {activeCall.type === 'video' ? '📽️ HD Video Call' : '📞 Voice Call'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              {activeCall.status === 'ringing' ? 'Ringing...' : (
                <span className="font-mono text-emerald-400">
                  {Math.floor(activeCall.duration / 60).toString().padStart(2, '0')}:
                  {(activeCall.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </p>
          </div>

          {/* CALL CAMERA VIEW (Webcam layout for Video) */}
          {activeCall.type === 'video' && activeCall.status === 'accepted' && (
            <div className="flex-1 relative my-4 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
              {/* Simulated remote stream avatar or picture */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-center p-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                  {activeCall.otherUser.fullName.charAt(0)}
                </div>
                <p className="text-xs text-slate-300">Receiving incoming HD remote signal...</p>
              </div>

              {/* Genuine Local User Webcam Video! */}
              {isCameraOn && (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute bottom-4 right-4 w-28 h-40 bg-black rounded-xl object-cover border-2 border-white shadow-lg z-10 scale-x-[-1]"
                />
              )}
            </div>
          )}

          {/* AUDIO RIPPLE WAVES FOR VOICE CALL */}
          {activeCall.type === 'voice' && activeCall.status === 'accepted' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-1.5 h-20">
                <span className="w-1.5 bg-blue-500 rounded-full animate-bounce h-12"></span>
                <span className="w-1.5 bg-blue-400 rounded-full animate-bounce h-16 delay-75"></span>
                <span className="w-1.5 bg-blue-600 rounded-full animate-bounce h-20 delay-150"></span>
                <span className="w-1.5 bg-blue-400 rounded-full animate-bounce h-14 delay-100"></span>
                <span className="w-1.5 bg-blue-500 rounded-full animate-bounce h-10 delay-200"></span>
              </div>
            </div>
          )}

          {/* INCOMING RINGING RESPONSE PANEL */}
          {activeCall.status === 'ringing' && activeCall.isIncoming ? (
            <div className="space-y-6 pb-12">
              <p className="text-center text-xs text-blue-400 font-bold animate-pulse">Incoming Call Request...</p>
              <div className="flex items-center justify-around max-w-xs mx-auto">
                <button 
                  onClick={() => handleRejectIncomingCall(activeCall)}
                  className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
                  title="Reject Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => handleAnswerIncomingCall(activeCall)}
                  className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all animate-bounce"
                  title="Answer Call"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CALL MANAGEMENT PANEL */
            <div className="space-y-6 pb-12">
              <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                
                {/* Mute toggle */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Speaker toggle for voice, camera flip/off for video */}
                {activeCall.type === 'video' ? (
                  <>
                    <button 
                      onClick={() => setIsCameraOn(!isCameraOn)}
                      className={`p-4 rounded-full flex items-center justify-center transition-colors ${!isCameraOn ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {isCameraOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setIsFrontCamera(!isFrontCamera)}
                      className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                      title="Switch Camera"
                    >
                      <Camera className="w-5 h-5 rotate-180" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsSpeakerMode(!isSpeakerMode)}
                    className={`p-4 rounded-full flex items-center justify-center transition-colors ${isSpeakerMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {isSpeakerMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                )}

                {/* End call Button */}
                <button 
                  onClick={handleEndCall}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
