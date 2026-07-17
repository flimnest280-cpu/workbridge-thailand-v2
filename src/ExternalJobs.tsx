import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Globe, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Check, 
  Search, 
  Filter, 
  Rss, 
  Layers, 
  FileCheck, 
  Info,
  ChevronRight,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  Clock,
  Home,
  Sparkles,
  CheckCircle2,
  X,
  Share2
} from 'lucide-react';
import { TranslationSet } from '../translations';
import { db } from '../lib/db';
import { AnimatePresence, motion } from 'motion/react';
import { PRESET_FEEDS, PRESET_JOBS, ApprovedFeed, ExternalJob } from '../lib/preset_external_jobs';
import ExternalJobCard, { ExternalJobEnriched } from './ExternalJobCard';

export type { ExternalJob };

interface ExternalJobsProps {
  t: TranslationSet;
  lang: string;
  onImportToProfile?: (job: ExternalJob) => void;
  savedJobIds?: string[];
}

// Multilingual definitions for local component
const localTranslations: Record<string, any> = {
  en: {
    externalJobsTitle: "External Jobs Hub",
    externalJobsSubtitle: "Import and browse verified cross-border jobs from official departments and international partner feeds.",
    importPanel: "Feed Integration Panel",
    selectFeed: "Choose Active Job Feed Source",
    syncButton: "Fetch & Sync Feed",
    syncing: "Connecting & Importing...",
    customFeedTitle: "Propose Custom RSS or API Feed",
    feedNamePlaceholder: "e.g., Bangkok Post Livelihoods RSS",
    feedUrlPlaceholder: "https://example.com/jobs/feed.xml",
    addFeedBtn: "Submit Feed",
    searchPlaceholder: "Search external jobs by title, company, or city...",
    noJobsFound: "No external jobs imported. Select a feed above and click 'Fetch & Sync' to load them!",
    allSources: "All Source Feeds",
    viewOriginal: "View Original Job",
    importToProfile: "Import to WorkBridge Profile",
    importedToProfile: "Imported & Saved",
    sourceWebsiteLabel: "Source Feed",
    salaryLabel: "Salary",
    locationLabel: "Location",
    approvedFeedsHeader: "Approved API & RSS Feeds",
    feedAddedSuccess: "Custom feed submitted! Approved automatically for sandbox testing.",
    feedSyncSuccess: "Feed synchronized successfully! {count} jobs imported.",
    invalidUrlError: "Please enter a valid RSS or API endpoint URL.",
    
    // New translation additions
    filterBtn: "Filters",
    sortBtn: "Sort By",
    totalJobs: "Total Jobs",
    lastSync: "Last Sync",
    applyNow: "Apply Now",
    share: "Share",
    province: "Province",
    district: "District",
    accommodation: "Accommodation",
    overtime: "Overtime (OT)",
    requiredDocs: "Required Documents",
    employmentType: "Type",
    hiringNow: "🟢 Hiring Now",
    urgent: "🔴 Urgent",
    featured: "⭐ Featured",
    viewDetails: "View Details",
    saveJob: "Save Job",
    saved: "Saved",
    loadMore: "Load More",
    showingCount: "Showing {visible} of {total} listings",
    clearFilters: "Clear All Filters",
    allProvinces: "All Provinces",
    allTypes: "All Employment Types",
    sortByNewest: "Newest First",
    sortBySalaryHigh: "Salary: High to Low",
    sortByCompany: "Company: A-Z",
    sortByTitle: "Title: A-Z"
  },
  th: {
    externalJobsTitle: "ศูนย์รวมงานภายนอก (External Jobs)",
    externalJobsSubtitle: "นำเข้าและค้นหางานข้ามพรมแดนที่ได้รับการรับรองจากหน่วยงานราชการและเครือข่ายพันธมิตรต่างประเทศ",
    importPanel: "ระบบเชื่อมโยงฟีดงาน",
    selectFeed: "เลือกแหล่งที่มาของฟีดงานหลัก",
    syncButton: "ดึงข้อมูลและอัปเดตงาน",
    syncing: "กำลังเชื่อมต่อเพื่อนำเข้างาน...",
    customFeedTitle: "เสนอลิงก์ฟีด RSS หรือ API งานภายนอก",
    feedNamePlaceholder: "เช่น ประกาศงานกระทรวงแรงงาน RSS",
    feedUrlPlaceholder: "https://example.com/jobs/feed.xml",
    addFeedBtn: "บันทึกข้อมูลฟีด",
    searchPlaceholder: "ค้นหางานภายนอกตามตำแหน่ง, บริษัท หรือจังหวัด...",
    noJobsFound: "ยังไม่มีข้อมูลงานนำเข้า เลือกฟีดด้านบนแล้วคลิก 'ดึงข้อมูลและอัปเดตงาน' เพื่อโหลดงาน!",
    allSources: "ทุกแหล่งฟีดข้อมูล",
    viewOriginal: "ดูประกาศงานต้นฉบับ",
    importToProfile: "บันทึกไปยังบัญชี WorkBridge",
    importedToProfile: "นำเข้าและบันทึกแล้ว",
    sourceWebsiteLabel: "แหล่งที่มา",
    salaryLabel: "เงินเดือน",
    locationLabel: "สถานที่ทำงาน",
    approvedFeedsHeader: "ฟีดข้อมูล API และ RSS ที่ได้รับการรับรอง",
    feedAddedSuccess: "บันทึกฟีดสำเร็จ! ได้รับอนุมัติอัตโนมัติสำหรับการทดสอบในระบบจำลอง",
    feedSyncSuccess: "ซิงโครไนซ์ฟีดเรียบร้อยแล้ว นำเข้าข้อมูล {count} ตำแหน่ง",
    invalidUrlError: "กรุณาระบุ URL ของฟีด RSS หรือ API ที่ถูกต้อง",
    
    // New translation additions
    filterBtn: "ตัวกรอง",
    sortBtn: "จัดเรียงตาม",
    totalJobs: "งานทั้งหมด",
    lastSync: "ซิงค์ล่าสุด",
    applyNow: "สมัครงานทันที",
    share: "แชร์",
    province: "จังหวัด",
    district: "อำเภอ/เขต",
    accommodation: "ที่พักฟรี",
    overtime: "มีโอที (OT)",
    requiredDocs: "เอกสารที่ต้องใช้",
    employmentType: "ประเภทงาน",
    hiringNow: "🟢 เปิดรับสมัคร",
    urgent: "🔴 ด่วนที่สุด",
    featured: "⭐ แนะนำ",
    viewDetails: "ดูรายละเอียด",
    saveJob: "บันทึกงาน",
    saved: "บันทึกแล้ว",
    loadMore: "ดูงานเพิ่มเติม",
    showingCount: "กำลังแสดง {visible} จากทั้งหมด {total} รายการ",
    clearFilters: "ล้างตัวกรองทั้งหมด",
    allProvinces: "ทุกจังหวัด",
    allTypes: "ทุกประเภทงาน",
    sortByNewest: "ใหม่ล่าสุดก่อน",
    sortBySalaryHigh: "เงินเดือน: สูงไปต่ำ",
    sortByCompany: "บริษัท: ก-ฮ",
    sortByTitle: "ตำแหน่งงาน: ก-ฮ"
  },
  my: {
    externalJobsTitle: "ပြင်ပအလုပ်အကိုင်များဗဟိုဌာန",
    externalJobsSubtitle: "တရားဝင်အစိုးရဌာနများနှင့် နိုင်ငံတကာမိတ်ဖက်အဖွဲ့အစည်းများမှ စိစစ်ပြီး အလုပ်အကိုင်များကို တင်သွင်းရှာဖွေပါ။",
    importPanel: "Feed ချိတ်ဆက်မှုစနစ်",
    selectFeed: "အဓိကအလုပ်အကိုင် Feed အရင်းအမြစ်ကိုရွေးချယ်ပါ",
    syncButton: "အလုပ်အကိုင်များကို ထုတ်ယူပြီး ဆင့်ခ်လုပ်ပါ",
    syncing: "ချိတ်ဆက်ပြီး တင်သွင်းနေသည်...",
    customFeedTitle: "စိတ်ကြိုက် RSS သို့မဟုတ် API Feed တင်ပြပါ",
    feedNamePlaceholder: "ဥပမာ- ဘန်ကောက်ပို့စ် အသက်မွေးဝမ်းကျောင်း RSS",
    feedUrlPlaceholder: "https://example.com/jobs/feed.xml",
    addFeedBtn: "Feed ကိုသိမ်းဆည်းပါ",
    searchPlaceholder: "ပြင်ပအလုပ်အကိုင်များကို ခေါင်းစဉ်၊ ကုမ္ပဏီ သို့မဟုတ် မြို့ဖြင့်ရှာဖွေပါ...",
    noJobsFound: "တင်သွင်းထားသော အလုပ်မရှိသေးပါ။ အထက်ပါ Feed ကိုရွေးချယ်ပြီး တင်သွင်းရန် 'ဆင့်ခ်လုပ်ပါ' ကိုနှိပ်ပါ။",
    allSources: "Feed အားလုံး",
    viewOriginal: "မူရင်းအလုပ်ခေါ်စာကြည့်ရန်",
    importToProfile: "WorkBridge ပရိုဖိုင်သို့ တင်သွင်းပါ",
    importedToProfile: "တင်သွင်းပြီး သိမ်းဆည်းပြီး",
    sourceWebsiteLabel: "ရင်းမြစ် Feed",
    salaryLabel: "လစာ",
    locationLabel: "အလုပ်နေရာ",
    approvedFeedsHeader: "ခွင့်ပြုထားသော API နှင့် RSS Feeds များ",
    feedAddedSuccess: "စိတ်ကြိုက် Feed အောင်မြင်စွာတင်ပြပြီးပါပြီ။ စမ်းသပ်မှုအတွက် အလိုအလျောက်ခွင့်ပြုထားသည်။",
    feedSyncSuccess: "Feed ကိုအောင်မြင်စွာဆင့်ခ်လုပ်ပြီးပါပြီ။ အလုပ်အကိုင် {count} ခု တင်သွင်းပြီးပါပြီ။",
    invalidUrlError: "မှန်ကန်သော RSS သို့မဟုတ် API URL ကိုထည့်သွင်းပါ။",
    
    // New translation additions
    filterBtn: "စစ်ထုတ်မှုများ",
    sortBtn: "စီရန်",
    totalJobs: "စုစုပေါင်းအလုပ်",
    lastSync: "နောက်ဆုံးဆင့်ခ်",
    applyNow: "ချက်ချင်းလျှောက်ထားပါ",
    share: "မျှဝေပါ",
    province: "ပြည်နယ်",
    district: "ခရိုင်",
    accommodation: "နေရာထိုင်ခင်း",
    overtime: "အချိန်ပို (OT)",
    requiredDocs: "လိုအပ်သောစာရွက်စာတမ်းများ",
    employmentType: "အလုပ်အမျိုးအစား",
    hiringNow: "🟢 လတ်တလောခေါ်ယူနေသည်",
    urgent: "🔴 အရေးကြီး",
    featured: "⭐ ထူးခြားချက်",
    viewDetails: "အသေးစိတ်ကြည့်ရှုရန်",
    saveJob: "အလုပ်သိမ်းဆည်းရန်",
    saved: "သိမ်းဆည်းပြီး",
    loadMore: "နောက်ထပ်အလုပ်များရှာရန်",
    showingCount: "အလုပ် {total} အနက် {visible} ကိုပြသနေသည်",
    clearFilters: "စစ်ထုတ်မှုအားလုံးဖျက်ပါ",
    allProvinces: "ပြည်နယ်အားလုံး",
    allTypes: "အလုပ်အမျိုးအစားအားလုံး",
    sortByNewest: "နောက်ဆုံးတင်သောအလုပ်များ",
    sortBySalaryHigh: "လစာ: အများမှအနည်း",
    sortByCompany: "ကုမ္ပဏီ: က-အ",
    sortByTitle: "ရာထူး: က-အ"
  },
  lo: {
    externalJobsTitle: "ສູນລວມວຽກພາຍນອກ (External Jobs)",
    externalJobsSubtitle: "ນຳເຂົ້າ ແລະ ຄົ້ນຫາວຽກຂ້າມແດນທີ່ໄດ້ຮັບການຢັ້ງຢືນຈາກພາກສ່ວນລັດຖະບານ ແລະ ເຄືອຂ່າຍພັນທະມິດສາກົນ.",
    importPanel: "ລະບົບເຊື່ອມໂຍງຟີດວຽກ",
    selectFeed: "ເລືອກແຫຼ່ງຂໍ້ມູນຟີດວຽກຫຼັກ",
    syncButton: "ດຶງຂໍ້ມູນ ແລະ ອັບເດດວຽກ",
    syncing: "ກຳລັງເຊື່ອມຕໍ່ເພື່ອດຶງຂໍ້ມູນ...",
    customFeedTitle: "ສະເໜີລິ້ງຟີດ RSS ຫຼື API ວຽກພາຍນອກ",
    feedNamePlaceholder: "ຕົວຢ່າງ: ປະກາດວຽກກະຊວງແຮງງານ RSS",
    feedUrlPlaceholder: "https://example.com/jobs/feed.xml",
    addFeedBtn: "ບັນທຶກຟີດ",
    searchPlaceholder: "ຄົ້ນຫາວຽກພາຍນອກຕາມຕຳແໜ່ງ, ບໍລິສັດ ຫຼື ແຂວງ...",
    noJobsFound: "ຍັງບໍ່ມີຂໍ້ມູນວຽກນຳເຂົ້າ. ເລືອກຟີດດ້ານເທິງແລ້ວຄລິກ 'ດຶງຂໍ້ມູນ ແລະ ອັບເດດວຽກ' ເພື່ອໂຫຼດວຽກ!",
    allSources: "ທຸກແຫຼ່ງຟີດຂໍ້ມູນ",
    viewOriginal: "ເບິ່ງປະກາດວຽກຕົ້ນສະບັບ",
    importToProfile: "ບັນທຶກໄປຍັງບັນຊີ WorkBridge",
    importedToProfile: "ນຳເຂົ້າ ແລະ ບັນທຶກແລ້ວ",
    sourceWebsiteLabel: "ແຫຼ່ງທີ່ມາ",
    salaryLabel: "ເງິນເດືອນ",
    locationLabel: "ສະຖານທີ່ເຮັດວຽກ",
    approvedFeedsHeader: "ຟີດຂໍ້ມູນ API ແລະ RSS ທີ່ໄດ້ຮັບການອະນຸມັດ",
    feedAddedSuccess: "ບັນທຶກຟີດສຳເລັດ! ໄດ້ຮັບອະນຸມັດອັດຕະໂນມັດສຳລັບການທົດສອບໃນລະບົບຈຳລອງ",
    feedSyncSuccess: "ຊິງໂຄຣໄນຟີດສຳເລັດແລ້ວ! ນຳເຂົ້າວຽກ {count} ຕຳແໜ່ງ.",
    invalidUrlError: "ກະລຸນາລະບຸ URL ຂອງຟີດ RSS ຫຼື API ທີ່ຖືກຕ້ອງ.",
    
    // New translation additions
    filterBtn: "ຕົວຕອງ",
    sortBtn: "ຈັດລຽງຕາມ",
    totalJobs: "ວຽກທັງໝົດ",
    lastSync: "ຊິງຄ໌ຫຼ້າສຸດ",
    applyNow: "ສະໝັກວຽກທັນທີ",
    share: "ແບ່ງປັນ",
    province: "ແຂວງ",
    district: "ເມືອງ",
    accommodation: "ທີ່ພັກຟຣີ",
    overtime: "ມີໂອທີ (OT)",
    requiredDocs: "ເອກະສານທີ່ຕ້ອງການ",
    employmentType: "ປະເພດວຽກ",
    hiringNow: "🟢 ເປີດຮັບສະໝັກ",
    urgent: "🔴 ດ່ວນທີ່ສຸດ",
    featured: "⭐ ແນະນຳ",
    viewDetails: "ເບິ່ງລາຍລະອຽດ",
    saveJob: "ບັນທຶກວຽກ",
    saved: "ບັນທຶກແລ້ວ",
    loadMore: "ເບິ່ງວຽກເພີ່ມເຕີມ",
    showingCount: "ກຳລັງສະແດງ {visible} ຈາກທັງໝົດ {total} ລາຍການ",
    clearFilters: "ລ້າງຕົວຕອງທັງໝົດ",
    allProvinces: "ທຸກແຂວງ",
    allTypes: "ທຸກປະເພດວຽກ",
    sortByNewest: "ໃໝ່ຫຼ້າສຸດກ່ອນ",
    sortBySalaryHigh: "ເງິນເດືອນ: ສູງຫາຕ່ຳ",
    sortByCompany: "ບໍລິສັດ: ກ-ຮ",
    sortByTitle: "ຕຳແໜ່ງວຽກ: ກ-ຮ"
  },
  km: {
    externalJobsTitle: "មជ្ឈមណ្ឌលការងារខាងក្រៅ (External Jobs)",
    externalJobsSubtitle: "នាំចូល និងស្វែងរកការងារឆ្លងដែនដែលត្រូវបានទទួលស្គាល់ដោយស្ថាប័នរដ្ឋ និងបណ្តាញដៃគូអន្តរជាតិ។",
    importPanel: "ប្រព័ន្ធភ្ជាប់ហ្វីតការងារ",
    selectFeed: "ជ្រើសរើសប្រភពហ្វីតការងារចម្បង",
    syncButton: "ទាញយក និងធ្វើបច្ចុប្បន្នភាពការងារ",
    syncing: "កំពុងភ្ជាប់ដើម្បីនាំចូលការងារ...",
    customFeedTitle: "ស្នើការភ្ជាប់ហ្វីត RSS ឬ API ការងារខាងក្រៅ",
    feedNamePlaceholder: "ឧទាហរណ៍៖ ការងារក្រសួងការងារ RSS",
    feedUrlPlaceholder: "https://example.com/jobs/feed.xml",
    addFeedBtn: "រក្សាទុកហ្វីត",
    searchPlaceholder: "ស្វែងរកការងារខាងក្រៅតាមចំណងជើង ក្រុមហ៊ុន ឬខេត្ត...",
    noJobsFound: "មិនទាន់មានទិន្នន័យនាំចូលទេ។ ជ្រើសរើសហ្វីតខាងលើ រួចចុច 'ទាញយក និងធ្វើបច្ចុប្បន្នភាព' ដើម្បីផ្ទុកការងារ!",
    allSources: "គ្រប់ប្រភពហ្វីតទាំងអស់",
    viewOriginal: "មើលការប្រកាសការងារដើម",
    importToProfile: "រក្សាទុកទៅក្នុងគណនី WorkBridge",
    importedToProfile: "នាំចូល និងរក្សាទុកហើយ",
    sourceWebsiteLabel: "ប្រភព",
    salaryLabel: "ប្រាក់ខែ",
    locationLabel: "ទីកន្លែងការងារ",
    approvedFeedsHeader: "ហ្វីតទិន្នន័យ API និង RSS ដែលបានយល់ព្រម",
    feedAddedSuccess: "រក្សាទុកហ្វីតដោយជោគជ័យ! បានអនុម័តដោយស្វ័យប្រវត្តសម្រាប់ការសាកល្បងក្នុងប្រព័ន្ធ",
    feedSyncSuccess: "ធ្វើសមកាលកម្មហ្វីតបានជោគជ័យ! នាំចូលការងារ {count} កន្លែង។",
    invalidUrlError: "សូមបញ្ចូលអាសយដ្ឋាន URL RSS ឬ API ឱ្យបានត្រឹមត្រូវ។",
    
    // New translation additions
    filterBtn: "តម្រង",
    sortBtn: "តម្រៀបតាម",
    totalJobs: "ការងារសរុប",
    lastSync: "ធ្វើសមកាលកម្មចុងក្រោយ",
    applyNow: "ដាក់ពាក្យភ្លាមៗ",
    share: "ចែករំលែក",
    province: "ខេត្ត",
    district: "ស្រុក/ខណ្ឌ",
    accommodation: "ស្នាក់នៅឥតគិតថ្លៃ",
    overtime: "ថែមម៉ោង (OT)",
    requiredDocs: "ឯកសារតម្រូវ",
    employmentType: "ប្រភេទការងារ",
    hiringNow: "🟢 កំពុងជ្រើសរើស",
    urgent: "🔴 ប្រញាប់បំផុត",
    featured: "⭐ ណែនាំ",
    viewDetails: "មើលលម្អិត",
    saveJob: "រក្សាទុកការងារ",
    saved: "បានរក្សាទុក",
    loadMore: "មើលការងារបន្ថែម",
    showingCount: "បង្ហាញ {visible} នៃ {total} ដំណែងការងារ",
    clearFilters: "សម្អាតតម្រងទាំងអស់",
    allProvinces: "គ្រប់ខេត្ត",
    allTypes: "គ្រប់ប្រភេទការងារ",
    sortByNewest: "ថ្មីបំផុតមុន",
    sortBySalaryHigh: "ប្រាក់ខែ៖ ខ្ពស់ទៅទាប",
    sortByCompany: "ក្រុមហ៊ុន៖ ក-អ",
    sortByTitle: "ចំណងជើងការងារ៖ ក-អ"
  }
};

// High quality static mapping of company logos
const COMPANY_LOGOS: Record<string, string> = {
  'Thai Rung Construction Co., Ltd.': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=120&q=80',
  'Samut Seafood Products Public Co.': 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=120&q=80',
  'Chanthaburi Fruit Orchards Ltd.': 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=120&q=80',
  'Mae Sot Apparel Factory': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80',
  'Inter-Logistics Siam Ltd.': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=120&q=80',
  'Borderland Education Network': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=120&q=80',
  'Mekong Regional Trade Group': 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=120&q=80',
  'Rattanakosin Riverside Inn': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80',
  'Siam Precision Motors': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=120&q=80',
  'APEX Plastics Thailand': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=120&q=80',
  'Kerry Express Hub Sriracha': 'https://images.unsplash.com/photo-1566576912321-d58ded7a2144?auto=format&fit=crop&w=120&q=80',
  'Thai Toyo Electronic Components': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80',
  'Marine Engineering Rayong Co.': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=120&q=80',
  'Global Health Action Network': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=120&q=80',
  'UN Association for Vocational Integration': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&q=80',
  'Eco-Agriculture South Project': 'https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&w=120&q=80'
};

// Extracted salary parser for robust salary range sorting
function getNumericSalary(salaryStr: string): number {
  const cleaned = salaryStr.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  // If it's a range, let's take the higher number
  if (cleaned.length > 5) {
    const half = Math.floor(cleaned.length / 2);
    const num1 = parseInt(cleaned.substring(0, half), 10);
    const num2 = parseInt(cleaned.substring(half), 10);
    return Math.max(num1, num2);
  }
  return parseInt(cleaned, 10);
}

// Mapper to generate rich Material Design 3 compliant fields dynamically
function mapExternalJob(job: ExternalJob): ExternalJobEnriched {
  // Parsing Province and District from location
  let province = 'Bangkok';
  let district = 'General';
  if (job.location) {
    if (job.location.includes('(')) {
      const parts = job.location.split('(');
      province = parts[0].trim();
      district = parts[1].replace(')', '').trim();
    } else if (job.location.includes(',')) {
      const parts = job.location.split(',');
      district = parts[0].trim();
      province = parts[1].trim();
    } else {
      province = job.location.trim();
    }
  }

  // Consistent hashing for fields based on title/company
  const strToHash = `${job.title}:${job.company}`;
  const idHash = strToHash.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  
  const employmentTypes: Array<'Full-time' | 'Part-time' | 'Contract' | 'Daily'> = ['Full-time', 'Contract', 'Daily', 'Part-time'];
  const employmentType = employmentTypes[idHash % employmentTypes.length];
  
  const postedTimes = ['2 hours ago', '5 hours ago', '1 day ago', '2 days ago', '3 days ago', '4 days ago'];
  const postedTime = postedTimes[idHash % postedTimes.length];
  
  const docsList = [
    ['ID Card', 'Passport'],
    ['ID Card', 'Work Permit'],
    ['Work Permit', 'Passport', 'Border Pass'],
    ['ID Card', 'Visa/Border Pass']
  ];
  const requiredDocuments = docsList[idHash % docsList.length];
  
  const accommodation = (idHash % 3 === 0) ? 'No' : 'Yes';
  const overtime = (idHash % 2 === 0) ? 'Yes' : 'No';
  
  const labels: Array<'hiring' | 'urgent' | 'featured'> = ['hiring', 'urgent', 'featured'];
  const label = labels[idHash % labels.length];
  
  const verified = (idHash % 4 !== 0);

  // MD3 Dynamic Gradient Avatars fallbacks
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-teal-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-fuchsia-600'
  ];
  const logoBg = colors[idHash % colors.length];
  
  const logoUrl = COMPANY_LOGOS[job.company] || null;

  return {
    ...job,
    province,
    district,
    employmentType,
    postedTime,
    requiredDocuments,
    accommodation,
    overtime,
    label,
    verified,
    logoBg,
    logoUrl
  };
}

export default function ExternalJobs({ t, lang, onImportToProfile, savedJobIds = [] }: ExternalJobsProps) {
  const currentLang = localTranslations[lang] || localTranslations.en;
  
  // State
  const [feeds, setFeeds] = useState<ApprovedFeed[]>(() => {
    const saved = localStorage.getItem('wb_external_feeds');
    if (saved) return JSON.parse(saved);
    return PRESET_FEEDS;
  });
  
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [selectedDetailedJob, setSelectedDetailedJob] = useState<ExternalJobEnriched | null>(null);

  const [selectedFeedId, setSelectedFeedId] = useState<string>('feed-mol-thailand');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  
  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  
  // Filters values
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('All');
  const [selectedOvertime, setSelectedOvertime] = useState<string>('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('All');
  
  // Sorting values: 'newest' | 'salary_desc' | 'company_asc' | 'title_asc'
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  
  // Custom feed proposal states
  const [customFeedName, setCustomFeedName] = useState<string>('');
  const [customFeedUrl, setCustomFeedUrl] = useState<string>('');
  const [customFeedType, setCustomFeedType] = useState<'rss' | 'api'>('rss');
  const [isAddingFeed, setIsAddingFeed] = useState<boolean>(false);
  
  // Feedback alerts & Toast states
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('wb_external_feeds', JSON.stringify(feeds));
  }, [feeds]);

  // Load imported jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const fetched = await db.getExternalJobs();
        if (fetched && fetched.length > 0) {
          setJobs(fetched);
        } else {
          // Fallback seeding
          const initialJobs = PRESET_JOBS['feed-mol-thailand'] || [];
          await db.saveExternalJobs(initialJobs);
          setJobs(initialJobs);
        }
      } catch (err) {
        console.warn("Error loading external jobs on mount:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // Sync to local storage for local state caching
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('wb_external_jobs', JSON.stringify(jobs));
    }
  }, [jobs]);

  // Handle Syncing simulation
  const handleSyncFeed = (feedId: string) => {
    setIsSyncing(true);
    setSyncProgress(15);
    setAlertMsg(null);

    // Simulate progress ticks
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 20 + 5);
      });
    }, 150);

    // Fetch feed content
    setTimeout(() => {
      clearInterval(interval);
      setSyncProgress(100);
      
      setTimeout(() => {
        let fetchedJobs: ExternalJob[] = [];
        
        if (PRESET_JOBS[feedId]) {
          fetchedJobs = PRESET_JOBS[feedId];
        } else {
          // Generate realistic jobs for custom feeds
          const feed = feeds.find(f => f.id === feedId);
          const feedName = feed ? feed.name : 'Custom Feed Source';
          fetchedJobs = [
            {
              id: `ext-custom-${feedId}-1`,
              title: `Assistant Facility Custodian (${feedName})`,
              company: 'Vibrant Thai Properties Co.',
              salary: '฿15,000 - ฿17,500',
              location: 'Bangkok (Huai Khwang)',
              sourceName: feedName,
              sourceUrl: feed?.url || 'https://example.com/original-source',
              description: 'General cleaning, light landscaping, and building maintenance assistance. Multilingual team members on-site. Social security registration covered.',
              category: 'Facilities',
              languageRequired: 'Basic communication in any ASEAN language',
              dateAdded: new Date().toISOString().split('T')[0]
            },
            {
              id: `ext-custom-${feedId}-2`,
              title: `Agricultural Fruit Picker & Packing Staff`,
              company: 'Siam Agritech Co-op',
              salary: '฿14,000 - ฿16,800',
              location: 'Chonburi',
              sourceName: feedName,
              sourceUrl: feed?.url || 'https://example.com/original-source',
              description: 'Sorting fruits, packing crates, and transporting organic items in local logistics center. Food and dormitory provided.',
              category: 'Agriculture',
              languageRequired: 'No barrier',
              dateAdded: new Date().toISOString().split('T')[0]
            }
          ];
        }

        // Merge with existing jobs (prevent duplicates by ID)
        const updatedJobsList = (() => {
          const filteredPrev = jobs.filter(pj => !fetchedJobs.some(fj => fj.id === pj.id));
          return [...fetchedJobs, ...filteredPrev];
        })();

        // Persist to database table external_jobs
        db.saveExternalJobs(updatedJobsList).then(() => {
          db.getExternalJobs().then(fetchedFromDb => {
            setJobs(fetchedFromDb && fetchedFromDb.length > 0 ? fetchedFromDb : updatedJobsList);
            setIsSyncing(false);
            setSyncProgress(0);
          });
        }).catch(err => {
          console.warn("Error saving synced jobs:", err);
          setJobs(updatedJobsList);
          setIsSyncing(false);
          setSyncProgress(0);
        });

        // Update Feed meta (last synced and job count)
        setFeeds(prevFeeds => prevFeeds.map(f => {
          if (f.id === feedId) {
            return {
              ...f,
              lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              jobCount: fetchedJobs.length
            };
          }
          return f;
        }));

        setAlertMsg({
          type: 'success',
          text: currentLang.feedSyncSuccess.replace('{count}', fetchedJobs.length.toString())
        });
        showToast(`Sync complete! ${fetchedJobs.length} listings fetched.`);
      }, 300);

    }, 1500);
  };

  // Helper to trigger floating MD3 snackbar
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Handle custom feed addition
  const handleAddFeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeedName.trim() || !customFeedUrl.trim()) {
      setAlertMsg({ type: 'error', text: currentLang.invalidUrlError });
      return;
    }

    if (!customFeedUrl.startsWith('http://') && !customFeedUrl.startsWith('https://')) {
      setAlertMsg({ type: 'error', text: currentLang.invalidUrlError });
      return;
    }

    const newFeed: ApprovedFeed = {
      id: `feed-custom-${Date.now()}`,
      name: customFeedName,
      url: customFeedUrl,
      type: customFeedType,
      status: 'active',
      jobCount: 2
    };

    setFeeds(prev => [...prev, newFeed]);
    setSelectedFeedId(newFeed.id);
    setCustomFeedName('');
    setCustomFeedUrl('');
    setIsAddingFeed(false);
    
    setAlertMsg({
      type: 'success',
      text: currentLang.feedAddedSuccess
    });

    setTimeout(() => {
      handleSyncFeed(newFeed.id);
    }, 500);
  };

  // Map to rich representation
  const enrichedJobs = jobs.map(mapExternalJob);

  // Filter list of unique provinces and sources for select filters
  const uniqueProvinces = Array.from(new Set(enrichedJobs.map(j => j.province))).filter(Boolean);
  const uniqueSources = Array.from(new Set(enrichedJobs.map(j => j.sourceName))).filter(Boolean);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedProvince('All');
    setSelectedEmploymentType('All');
    setSelectedAccommodation('All');
    setSelectedOvertime('All');
    setSelectedSourceFilter('All');
    setSearchTerm('');
    showToast("Filters cleared");
  };

  // Filtering Calculation
  const filteredJobs = enrichedJobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = selectedProvince === 'All' || job.province === selectedProvince;
    const matchesType = selectedEmploymentType === 'All' || job.employmentType === selectedEmploymentType;
    const matchesAccommodation = selectedAccommodation === 'All' || job.accommodation === selectedAccommodation;
    const matchesOvertime = selectedOvertime === 'All' || job.overtime === selectedOvertime;
    const matchesSource = selectedSourceFilter === 'All' || job.sourceName === selectedSourceFilter;

    return matchesSearch && matchesProvince && matchesType && matchesAccommodation && matchesOvertime && matchesSource;
  });

  // Sorting Calculation
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
    if (sortBy === 'salary_desc') {
      return getNumericSalary(b.salary) - getNumericSalary(a.salary);
    }
    if (sortBy === 'company_asc') {
      return a.company.localeCompare(b.company);
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Load more trigger
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 4);
      setIsLoadingMore(false);
    }, 600);
  };

  // Get active feed info
  const activeFeed = feeds.find(f => f.id === selectedFeedId);

  return (
    <div id="external-jobs-hub-container" className="flex-1 flex flex-col p-4 gap-4 bg-slate-50/50 min-h-0 overflow-y-auto">
      
      {/* Toast Alert / Snackbar notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[11px] font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Header Banner - Styled cleanly */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-5 text-white shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
          <Globe className="w-40 h-40" />
        </div>
        <div className="relative z-10 max-w-lg space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black border border-blue-400/20 uppercase tracking-wider">
            <Rss className="w-3 h-3 text-blue-300 animate-pulse" />
            Live Sync API Integrated
          </div>
          <h2 className="text-base font-black font-display leading-tight">{currentLang.externalJobsTitle}</h2>
          <p className="text-[11px] text-blue-100/90 leading-relaxed font-semibold">{currentLang.externalJobsSubtitle}</p>
        </div>
      </div>

      {/* Top Search & Filter Controller - MD3 Integrated */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs space-y-4 shrink-0">
        
        {/* Sync Feed choice */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-slate-100/80">
          <div className="space-y-1 flex-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{currentLang.selectFeed}</span>
            <div className="flex gap-2">
              <select
                id="select-active-feed"
                value={selectedFeedId}
                onChange={(e) => {
                  setSelectedFeedId(e.target.value);
                  setAlertMsg(null);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold text-slate-800"
              >
                {feeds.map(feed => (
                  <option key={feed.id} value={feed.id}>
                    {feed.name} — {feed.jobCount} Listings Available
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button
              id="btn-sync-feed"
              onClick={() => handleSyncFeed(selectedFeedId)}
              disabled={isSyncing}
              className={`py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-3xs transition-all cursor-pointer ${
                isSyncing 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200/50' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? currentLang.syncing : currentLang.syncButton}
            </button>

            <button
              id="btn-toggle-add-feed"
              onClick={() => setIsAddingFeed(!isAddingFeed)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1 shrink-0"
            >
              {isAddingFeed ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sync Progress Indicator */}
        {isSyncing && (
          <div className="w-full space-y-1 pt-1">
            <div className="flex justify-between text-[9px] font-extrabold text-blue-600">
              <span>Importing and mapping cross-border visa tags...</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-1.5 transition-all duration-150 ease-out"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Propose Feed form */}
        {isAddingFeed && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddFeedSubmit} 
            className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
              <h4 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">{currentLang.customFeedTitle}</h4>
              <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase">Sandbox Enabled</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">Source Name</label>
                <input
                  id="custom-feed-name"
                  type="text"
                  required
                  placeholder={currentLang.feedNamePlaceholder}
                  value={customFeedName}
                  onChange={(e) => setCustomFeedName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">Feed Format Type</label>
                <div className="flex gap-2">
                  <button
                    id="btn-feed-format-rss"
                    type="button"
                    onClick={() => setCustomFeedType('rss')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer text-center ${
                      customFeedType === 'rss' 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    RSS (XML)
                  </button>
                  <button
                    id="btn-feed-format-api"
                    type="button"
                    onClick={() => setCustomFeedType('api')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer text-center ${
                      customFeedType === 'api' 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    JSON API
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">Endpoint URL (RSS XML / JSON Feed)</label>
              <input
                id="custom-feed-url"
                type="text"
                required
                placeholder={currentLang.feedUrlPlaceholder}
                value={customFeedUrl}
                onChange={(e) => setCustomFeedUrl(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <button
              id="btn-submit-custom-feed"
              type="submit"
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {currentLang.addFeedBtn}
            </button>
          </motion.form>
        )}

        {alertMsg && (
          <div 
            id="external-jobs-alert"
            className={`p-3.5 rounded-2xl border flex gap-2.5 items-start text-[10px] leading-relaxed ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 ${alertMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <p className="font-bold">{alertMsg.text}</p>
          </div>
        )}

        {/* Large Modern Search Bar, Filter toggle and Sort Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              id="external-jobs-search-input"
              type="text"
              placeholder={currentLang.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-11 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/35 focus:bg-white transition-all font-semibold text-slate-800"
            />
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Filter Toggle Button */}
            <button
              id="btn-filter-toggle"
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSortMenu(false);
              }}
              className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{currentLang.filterBtn}</span>
              {(selectedProvince !== 'All' || selectedEmploymentType !== 'All' || selectedAccommodation !== 'All' || selectedOvertime !== 'All' || selectedSourceFilter !== 'All') && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            {/* Sort Toggle Button */}
            <button
              id="btn-sort-toggle"
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowFilters(false);
              }}
              className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                showSortMenu 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{currentLang.sortBtn}</span>
            </button>
          </div>
        </div>

        {/* Expanding Filters panel (MD3 Drawer-style sheet) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 space-y-3 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Multi-Faceted Search Filters</span>
                <button 
                  onClick={handleClearFilters}
                  className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                >
                  {currentLang.clearFilters}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Province Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">{currentLang.province}</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"
                  >
                    <option value="All">{currentLang.allProvinces}</option>
                    {uniqueProvinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Employment Type */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">{currentLang.employmentType}</label>
                  <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"
                  >
                    <option value="All">{currentLang.allTypes}</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Daily">Daily</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                {/* Accommodation */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">{currentLang.accommodation}</label>
                  <select
                    value={selectedAccommodation}
                    onChange={(e) => setSelectedAccommodation(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"
                  >
                    <option value="All">All Housing</option>
                    <option value="Yes">🏠 Provided (Yes)</option>
                    <option value="No">No Accommodation</option>
                  </select>
                </div>

                {/* Overtime */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">{currentLang.overtime}</label>
                  <select
                    value={selectedOvertime}
                    onChange={(e) => setSelectedOvertime(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"
                  >
                    <option value="All">All OT Options</option>
                    <option value="Yes">⚡ OT Available (Yes)</option>
                    <option value="No">No OT</option>
                  </select>
                </div>

                {/* Source Filter */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">{currentLang.sourceWebsiteLabel}</label>
                  <select
                    value={selectedSourceFilter}
                    onChange={(e) => setSelectedSourceFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"
                  >
                    <option value="All">{currentLang.allSources}</option>
                    {uniqueSources.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanding Sort panel */}
        <AnimatePresence>
          {showSortMenu && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 rounded-2xl p-3 border border-slate-200/50 flex flex-wrap gap-2 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => { setSortBy('newest'); showToast("Sorted by Newest First"); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'newest' 
                    ? 'bg-slate-900 text-white shadow-3xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {currentLang.sortByNewest || 'Newest First'}
              </button>
              <button
                type="button"
                onClick={() => { setSortBy('salary_desc'); showToast("Sorted by Salary"); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'salary_desc' 
                    ? 'bg-slate-900 text-white shadow-3xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {currentLang.sortBySalaryHigh || 'Salary: High to Low'}
              </button>
              <button
                type="button"
                onClick={() => { setSortBy('company_asc'); showToast("Sorted by Company A-Z"); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'company_asc' 
                    ? 'bg-slate-900 text-white shadow-3xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {currentLang.sortByCompany || 'Company: A-Z'}
              </button>
              <button
                type="button"
                onClick={() => { setSortBy('title_asc'); showToast("Sorted by Title A-Z"); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'title_asc' 
                    ? 'bg-slate-900 text-white shadow-3xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {currentLang.sortByTitle || 'Title: A-Z'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Metadata & Counter Row */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold font-mono pt-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>{currentLang.totalJobs || 'Total Jobs'}: {sortedJobs.length} matches</span>
          </div>
          <div>
            <span>{currentLang.lastSync || 'Last Sync'}: {activeFeed?.lastSynced || 'Just now'}</span>
          </div>
        </div>
      </div>

      {/* Main Browse Grid Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        
        {isLoadingJobs ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-150 space-y-3">
            <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading verified cross-border jobs...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-4 shadow-3xs">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-700">No matching external jobs found</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                {currentLang.noJobsFound}
              </p>
            </div>
            {!isSyncing && (
              <button
                id="btn-quick-sync-placeholder"
                onClick={() => handleSyncFeed(selectedFeedId)}
                className="text-[11px] bg-blue-600 text-white font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-3xs"
              >
                Fetch Live Jobs Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {sortedJobs.slice(0, visibleCount).map((job) => {
                  const isSaved = savedJobIds.includes(job.id);
                  return (
                    <ExternalJobCard 
                      key={job.id}
                      job={job}
                      isSaved={isSaved}
                      onImportToProfile={(importingJob) => {
                        if (onImportToProfile) {
                          onImportToProfile(importingJob);
                          showToast(`"${importingJob.title}" saved to your profile!`);
                        }
                      }}
                      onViewDetails={(detailedJob) => setSelectedDetailedJob(detailedJob)}
                      lang={lang}
                      t={t}
                      localTranslations={localTranslations}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination / Load More button with elegant indicators */}
            {sortedJobs.length > visibleCount && (
              <div className="flex flex-col items-center justify-center p-4 gap-3 bg-white border border-slate-100/80 rounded-3xl shadow-3xs">
                <span className="text-[10px] font-bold text-slate-400">
                  {currentLang.showingCount.replace('{visible}', Math.min(visibleCount, sortedJobs.length).toString()).replace('{total}', sortedJobs.length.toString())}
                </span>
                
                {/* MD3 Tonal progress line */}
                <div className="w-48 bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1 transition-all duration-300"
                    style={{ width: `${(Math.min(visibleCount, sortedJobs.length) / sortedJobs.length) * 100}%` }}
                  />
                </div>

                <button
                  id="btn-load-more"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {currentLang.loadMore || 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed MD3 Modal View */}
      <AnimatePresence>
        {selectedDetailedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] relative"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-6 text-white relative shrink-0">
                <button 
                  onClick={() => setSelectedDetailedJob(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
                <div className="space-y-2 pr-8">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-100 bg-blue-500/30 px-3 py-0.5 rounded-full border border-blue-400/20 uppercase tracking-wider">
                    {selectedDetailedJob.sourceName}
                  </span>
                  <h3 className="text-base font-black font-display leading-snug">
                    {selectedDetailedJob.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-blue-100/90 font-bold">{selectedDetailedJob.company}</p>
                    {selectedDetailedJob.verified && (
                      <span className="bg-blue-500 text-white p-0.5 rounded-full text-[8px]">✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed min-h-0">
                {/* Salary & Details Row */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{currentLang.salary || 'Salary'}</p>
                    <p className="text-xs font-black text-blue-600">{selectedDetailedJob.salary} / month</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{currentLang.employmentType || 'Type'}</p>
                    <p className="text-xs font-black text-slate-900">{selectedDetailedJob.employmentType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{currentLang.province || 'Province'}</p>
                    <p className="text-xs font-black text-slate-900">{selectedDetailedJob.province}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{currentLang.district || 'District'}</p>
                    <p className="text-xs font-black text-slate-900">{selectedDetailedJob.district}</p>
                  </div>
                </div>

                {/* Logistics benefits cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold">
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>Housing: <strong className="text-blue-600">{selectedDetailedJob.accommodation === 'Yes' ? 'Free provided 🏠' : 'Self-arrange'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Overtime (OT): <strong className="text-blue-600">{selectedDetailedJob.overtime === 'Yes' ? 'Available ⚡' : 'None'}</strong></span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Job Description</h4>
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 leading-relaxed font-medium whitespace-pre-wrap text-slate-600">
                    {selectedDetailedJob.description}
                  </div>
                </div>

                {/* Required Documents checklist */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{currentLang.requiredDocs || 'Documents Required'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetailedJob.requiredDocuments.map((doc, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200/50 text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verification card */}
                {selectedDetailedJob.verified && (
                  <div className="flex gap-3 items-center bg-blue-50 p-3.5 rounded-2xl border border-blue-100/50 text-blue-800 text-[11px] font-bold">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-extrabold text-blue-900">WorkBridge Verified Cross-Border Visa Listing</p>
                      <p className="text-[10px] font-medium text-blue-700/80">Approved under bilateral labor regulations with official consulate credentials.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <a
                  href={selectedDetailedJob.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  {currentLang.viewOriginal}
                </a>

                {onImportToProfile && (
                  <button
                    onClick={() => {
                      onImportToProfile(selectedDetailedJob);
                      setSelectedDetailedJob(null);
                    }}
                    disabled={savedJobIds.includes(selectedDetailedJob.id)}
                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      savedJobIds.includes(selectedDetailedJob.id)
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {savedJobIds.includes(selectedDetailedJob.id) ? (
                      <>
                        <Check className="w-4 h-4 text-blue-600" />
                        {currentLang.importedToProfile}
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        {currentLang.importToProfile}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
