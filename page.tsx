fff

"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import KpiAdminTab from "@/app/components/spv/KpiTabAdmin"
import KpiAdmin2Tab from "@/app/components/spv/KpiAdmin2Tab"
import FollowUpAdminTab from "@/app/components/spv/FollowUpAdminTab"
import ActivityAdminTab from "@/app/components/spv/ActivityAdminTab"
import DealsAdminTab from "@/app/components/spv/DealsAdminTab"
import AIAnalystTab from "@/app/components/spv/AIAnalystTab"
import FraudAlertsTab from "@/app/components/spv/FraudAlertsTab"
import CrmTab from "@/app/components/spv/CrmTab"
import MarketingTab from "@/app/components/spv/MarketingTab"
import ClosingAdminTab from "@/app/components/spv/ClosingAdminTab"
import AvgReportAdminTab from "@/app/components/spv/AvgReportAdminTab"
import CallsAdminTab from "@/app/components/spv/CallsAdminTab"
import DashboardAdminTab from "@/app/components/spv/DashboardAdminTab"
import MonitorAdminTab from "@/app/components/spv/MonitorAdminTab"

const Icon = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Monitor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  PhoneLog: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.13 19.79 19.79 0 0 1 1.6 0.43 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.34A16 16 0 0 0 14 16.05l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.9 17.47z"/>
      <line x1="17" y1="3" x2="17" y2="9"/><line x1="20" y1="6" x2="14" y2="6"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.13 19.79 19.79 0 0 1 1.6 0.43 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.34A16 16 0 0 0 14 16.05l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.9 17.47z"/>
    </svg>
  ),
  PhoneIncoming: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 2 16 8 22 8"/><line x1="23" y1="1" x2="16" y2="8"/>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.13 19.79 19.79 0 0 1 1.6 0.43 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.34A16 16 0 0 0 14 16.05l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.9 17.47z"/>
    </svg>
  ),
  VideoCall: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Wifi: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  WifiOff: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Save: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Smartphone: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  Chat: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  CheckCheck: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" transform="translate(4,0)"/>
    </svg>
  ),
  Mic: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  FileDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
};

const T = {
  sidebar:       "#1E3A5F",
  sidebarBorder: "#2D5186",
  sidebarText:   "#93B4D4",
  primary:       "#2a0cc2",
  primaryText:   "#FFF7ED",
  primaryLight:  "#FFF7ED",
  accent:        "#650bf5",
  bg:            "#F8F9FA",
};

const PRODUCTS = [
  "Everice", "Sundae Everydae", "1001 Bites", "Kuch2hotahu", "Chicktop",
  "Es Aquarium Premium", "Bakso Bakar Celup Mielioner", "TAHU KRAX", "CHIKUMI",
  "NYOPEEGO", "Es Teler Sultan Froztice", "COKOTO", "ALOHA", "MIE JADIAN", "Seblak Prasmanan",
  "BULE CORNER", "POTAHOTTATO", "Floodbar", "Pabrik Booth", "Neon Box", "STEAK AYAM", "RC GO", "Baba Ali",
  "Asetehe", "Cokoto", "Es Teh Aksara Kita", "Eh Tes 3000", "Froztice", "Gohyong Yuk", "Gorenganews",
  "Kariyami", "K-Tan", "Make Mie Happy", "Secret Toast", "Silegi Magic Water",
];
const PRODUCTS_LOWER = PRODUCTS.map(p => ({ original: p, lower: p.toLowerCase() }));

function detectProducts(text: string = "") {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const { original, lower: pl } of PRODUCTS_LOWER) {
    if (lower.includes(pl)) found.add(original);
  }
  return [...found];
}

function buildProductLeads(messages: { marketing_id: number; customer_id: number; message_text: string }[]) {
  const map: Record<number, Record<string, Set<number>>> = {};
  for (const msg of messages) {
    const mid = msg.marketing_id;
    if (!mid) continue;
    if (!map[mid]) map[mid] = {};
    const products = detectProducts(msg.message_text || "");
    for (const p of products) {
      if (!map[mid][p]) map[mid][p] = new Set();
      map[mid][p].add(msg.customer_id);
    }
  }
  const result: Record<number, { name: string; count: number }[]> = {};
  for (const [mid, prodMap] of Object.entries(map)) {
    result[Number(mid)] = Object.entries(prodMap)
      .map(([name, ids]) => ({ name, count: ids.size }))
      .sort((a, b) => b.count - a.count);
  }
  return result;
}

function LeadsPopover({ leads = [] }: { leads: { name: string; count: number }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const total = leads.reduce((s, l) => s + l.count, 0);
  const maxCount = leads[0]?.count || 1;
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ background: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA" }}>
        {leads.length > 0 ? `${leads.length} produk` : "-"}
      </button>
      {open && leads.length > 0 && (
        <div className="absolute z-50 mt-2 w-60 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "white", border: "1px solid #E8E8E4", right: 0 }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #F0F0EC" }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Leads per Produk</p>
            <p className="text-xs text-gray-400 mt-0.5">{total} total leads - {leads.length} produk</p>
          </div>
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {leads.map(({ name, count }, i) => {
              const pct = Math.round((count / maxCount) * 100);
              const isTop = i === 0;
              return (
                <div key={name} className="px-3 py-2 rounded-lg"
                  style={{ background: isTop ? "#FFF7ED" : "#FAFAF8" }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[70%]">{name}</span>
                    <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: "#EA580C" }}>{count} leads</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#F0F0EC" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: isTop ? "#EA580C" : "#FDBA74" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type CallLog = {
  id: number;
  customer_id: number;
  customer_name: string;
  phone: string;
  marketing_name: string;
  call_type: "voice" | "video";
  status: "missed" | "answered" | "ongoing";
  duration: number;
  created_at: string;
  screenshot_url?: string | null;
};

type AvgReportDay = {
  date: string;
  avg: string;
  avg_seconds: number;
  sample_count: number;
};

type AvgReportData = {
  avg: string;
  avg_seconds: number;
  per_day: AvgReportDay[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const session = Cookies.get("admin_session");
    if (!session) { router.push("/admin"); return; }
    try {
      const d = JSON.parse(session);
      if (d.role !== "admin") { router.push("/admin"); return; }
      setAdminName(d.full_name);
    } catch { router.push("/admin"); }
  }, []);

  const handleLogoutAdmin = () => { Cookies.remove("admin_session"); router.push("/admin"); };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teamStats, setTeamStats] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prevMsgCount, setPrevMsgCount] = useState(0);
  const [selectedMarketingId, setSelectedMarketingId] = useState("");
  const [monitoredMarketingId, setMonitoredMarketingId] = useState("");
  const [selectedClientChat, setSelectedClientChat] = useState(null);
  const [editingMarketing, setEditingMarketing] = useState(null);
  const [newMarketing, setNewMarketing] = useState({ name: "", username: "", password: "", phone: "" });
  const [waStatuses, setWaStatuses] = useState({});
  const [qrCode, setQrCode] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectedInModal, setIsConnectedInModal] = useState(false);
  const [avgResponses, setAvgResponses] = useState({});
  const [productLeads, setProductLeads] = useState<Record<number, { name: string; count: number }[]>>({});
  const [customerCounts, setCustomerCounts] = useState<Record<number, number>>({});
  const [showPassId, setShowPassId] = useState<number | null>(null);
  const [resetPassId, setResetPassId] = useState<number | null>(null);
  const [newPass, setNewPass] = useState("");

  // -- AVG REPORT STATE --
  const [avgReportMarketingFilter, setAvgReportMarketingFilter] = useState("");
  const [avgReportMonth, setAvgReportMonth] = useState(() => new Date().getMonth() + 1);
  const [avgReportYear, setAvgReportYear] = useState(() => new Date().getFullYear());
  const [avgReportData, setAvgReportData] = useState<AvgReportData | null>(null);
  const [avgReportLoading, setAvgReportLoading] = useState(false);

  // -- ADMIN REPLY STATE --
  const [adminReplyText, setAdminReplyText] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingMsgText, setEditingMsgText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySentFlash, setReplySentFlash] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // -- CALL LOG STATE --
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [callLoading, setCallLoading] = useState(false);
  const [callFilter, setCallFilter] = useState<"all" | "voice" | "video">("all");
  const [callMarketingFilter, setCallMarketingFilter] = useState("");
  const [callSearch, setCallSearch] = useState("");
  
  // -- CLOSING STATE --
  type LeadStatus = "closing" | "hot" | "warm" | "cold";
  type AiLead = {
   customerId: number;
   customerName: string;
   phone: string;
   marketingName: string;
   status: LeadStatus;
   produk: string;
   kesimpulan_finansial: string;
   keterangan: string;
   saran_marketing: { judul: string; penjelasan: string }[];
 };
  const [adminAiLeads, setAdminAiLeads] = useState<AiLead[]>([]);
  const [adminAiLoading, setAdminAiLoading] = useState(false);
  const [adminAiProgress, setAdminAiProgress] = useState({ done: 0, total: 0 });
  const [adminLeadFilter, setAdminLeadFilter] = useState<LeadStatus | "all">("all");
  const [adminLeadSearch, setAdminLeadSearch] = useState("");
  const [adminLeadMarketingFilter, setAdminLeadMarketingFilter] = useState("");
  const [adminLeadDateFrom, setAdminLeadDateFrom] = useState("")
  const [adminLeadDateTo, setAdminLeadDateTo] = useState("")
  const [adminLeadFollowUps, setAdminLeadFollowUps] = useState<Set<string>>(new Set())

  const chatEndRef = useRef(null);

  const fetchUsers = async () => {
    try { const r = await fetch("/api/user"); setTeamStats(await r.json()); }
    catch (e) { console.error(e); }
  };
  const fetchCustomers = async () => {
    try {
      const r = await fetch("/api/customer", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setCustomers(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const fetchChatMessages = async (id) => {
    try {
      const r = await fetch(`/api/chat?customerId=${id}`);
      const d = await r.json();
      setChatMessages(Array.isArray(d) ? d : d.messages || []);
    } catch { setChatMessages([]); }
  };
  const fetchAllWAStatus = async () => {
    const s = {};
    await Promise.all(teamStats.filter(u => u.role === "marketing").map(async (m) => {
      try {
        const r = await fetch(`/api/whatsapp/status?session=${m.username}`);
        const d = await r.json();
        s[m.username] = d.connected ? "Connected" : "Disconnected";
      } catch { s[m.username] = "Error"; }
    }));
    setWaStatuses(s);
  };
  const fetchAvgResponses = async () => {
    const r = {};
    await Promise.all(teamStats.filter(u => u.role === "marketing").map(async (m) => {
      try {
        const res = await fetch(`/api/stats/avg-response?marketingId=${m.id}`);
        const d = await res.json();
        r[m.id] = d.avg || "N/A";
      } catch { r[m.id] = "N/A"; }
    }));
    setAvgResponses(r);
  };

  const fetchCustomerCounts = async () => {
    try {
      const r = await fetch("/api/customer/count");
      const d = await r.json();
      setCustomerCounts(d);
    } catch (e) { console.error(e); }
  };

  const fetchProductLeads = async () => {
    try {
      const r = await fetch("/api/messages/product-leads");
      if (!r.ok) return;
      const messages = await r.json();
      if (Array.isArray(messages)) setProductLeads(buildProductLeads(messages));
    } catch (e) {
      console.error("fetchProductLeads error:", e);
    }
  };

  const fetchCallLogs = async (mid?: string) => {
    const marketingId = mid ?? callMarketingFilter;
    if (!marketingId) return;
    setCallLoading(true);
    try {
      const r = await fetch(`/api/call/logs?marketingId=${marketingId}`);
      const d = await r.json();
      setCallLogs(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error("Fetch call logs error:", e);
      setCallLogs([]);
    } finally {
      setCallLoading(false);
    }
  };

  const fetchAvgReport = async () => {
    if (!avgReportMarketingFilter) return;
    setAvgReportLoading(true);
    try {
      const r = await fetch(
        `/api/stats/avg-response?marketingId=${avgReportMarketingFilter}&month=${avgReportMonth}&year=${avgReportYear}`
      );
      const d = await r.json();
      setAvgReportData(d);
    } catch (e) {
      console.error("Fetch avg report error:", e);
      setAvgReportData(null);
    } finally {
      setAvgReportLoading(false);
    }
  };
  
  const classifyStatus = (raw: string): LeadStatus => {
   const r = raw.toLowerCase();
    if (r.includes("closing") || r.includes("deal") || r.includes("pembayaran")) return "closing";
    if (r.includes("hot") || r.includes("meeting") || r.includes("sangat tertarik")) return "hot";
    if (r.includes("cold") || r.includes("tidak tertarik") || r.includes("batal")) return "cold";
   return "warm";
  };

  const analyzeAdminLeads = async () => {
  setAdminAiLoading(true);
  setAdminAiLeads([]);
  setAdminAiProgress({ done: 0, total: 0 });

  let baseCustomers = (customers as any[]).filter(c =>
    !adminLeadMarketingFilter || String(c.marketing_id) === adminLeadMarketingFilter
  );

  if (adminLeadDateFrom && adminLeadDateTo) {
  const from = new Date(adminLeadDateFrom)
  const to = new Date(adminLeadDateTo)
  to.setHours(23, 59, 59, 999)
  const checks = await Promise.all(
    baseCustomers.map(async (c) => {
      try {
        const res = await fetch(`/api/chat?customerId=${c.id}`)
        const msgs = await res.json()
        const hasMsg = (Array.isArray(msgs) ? msgs : []).some((m: any) => {
          const d = new Date(m.created_at)
          return d >= from && d <= to
        })
        return hasMsg ? c : null
      } catch { return null }
    })
   )
   baseCustomers = checks.filter(Boolean)
  }

  if (baseCustomers.length === 0) {
    setAdminAiLoading(false);
    return;
  }

  setAdminAiProgress({ done: 0, total: baseCustomers.length });
  const results: AiLead[] = new Array(baseCustomers.length);

  const BATCH = 5;
  for (let i = 0; i < baseCustomers.length; i += BATCH) {
    const batch = baseCustomers.slice(i, i + BATCH);
    await Promise.all(batch.map(async (customer, batchIdx) => {
      const idx = i + batchIdx;
      const mkt = teamStats.find((u: any) => String(u.id) === String(customer.marketing_id));
      try {
        const chatRes = await fetch(`/api/chat?customerId=${customer.id}`);
        const messages = await chatRes.json();
        const recent = [...(Array.isArray(messages) ? messages : [])]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-40);
        const transcript = recent
          .map((m: any) => `[${m.sender_type === "marketing" ? "Marketing" : "Customer"}]: ${m.message_text || "[media]"}`)
          .join("\n");
        const aiRes = await fetch("/api/ai/analyze-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName: customer.full_name, transcript }),
        });
        const parsed = await aiRes.json();
        results[idx] = {
          customerId: customer.id,
          customerName: customer.full_name,
          phone: customer.phone_number || "-",
          marketingName: mkt?.full_name || "-",
          status: classifyStatus(parsed.status),
          produk: parsed.produk || "-",
          kesimpulan_finansial: parsed.kesimpulan_finansial || "-",
          keterangan: parsed.keterangan || "-",
          saran_marketing: parsed.saran_marketing || [],
        };
      } catch {
        results[idx] = {
          customerId: customer.id,
          customerName: customer.full_name,
          phone: customer.phone_number || "-",
          marketingName: mkt?.full_name || "-",
          status: "warm",
          produk: "-",
          kesimpulan_finansial: "-",
          keterangan: "Gagal menganalisa.",
          saran_marketing: [],
        };
      }
      setAdminAiProgress(p => ({ ...p, done: p.done + 1 }));
    }));
  }
	setAdminAiLeads(results)

	try {
  	  const cm = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`
  	  const fuParams = adminLeadMarketingFilter ? `marketing_id=${adminLeadMarketingFilter}&month=${cm}` : `month=${cm}`
  	  const fuRes = await fetch(`/api/kpi/follow-up?${fuParams}`)
  	  const fuData = await fuRes.json()
  	  const phones = new Set<string>()
        if (Array.isArray(fuData)) {
        fuData.forEach((f: any) => {
        if (f.phone) {
          let c = String(f.phone).replace(/\D/g, "")
          if (c.startsWith("0")) c = "62" + c.slice(1)
          phones.add(c)
        }
       })
      }
      setAdminLeadFollowUps(phones)
      } catch { setAdminLeadFollowUps(new Set()) }

      setAdminAiLoading(false)};  

  const handleAdminReply = async () => {
    const text = adminReplyText.trim();
    if (!text || !selectedClientChat || !monitoredMarketingId || isSendingReply) return;
    const monitoredMarketing = teamStats.find(u => String(u.id) === String(monitoredMarketingId));
    if (!monitoredMarketing) return;
    setIsSendingReply(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedClientChat.id,
          marketing_id: parseInt(monitoredMarketingId),
          sender_type: "marketing",
          content: text,
          sendToWhatsApp: true,
          phone: selectedClientChat.phone_number,
        }),
      });
      if (res.ok) {
        setAdminReplyText("");
        setReplySentFlash(true);
        setTimeout(() => setReplySentFlash(false), 2000);
        await fetchChatMessages(selectedClientChat.id);
        replyInputRef.current?.focus();
      } else {
        const err = await res.json();
        alert("Gagal kirim: " + (err.error || "Unknown error"));
      }
    } catch (e) {
      alert("Kesalahan koneksi saat mengirim pesan");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdminReply();
    }
  };

  const handleEditMessage = async () => {
    if (!editingMsgText.trim() || !editingMsgId) return;
    const msg = chatMessages.find((m: any) => m.id === editingMsgId);
    if (!msg || !selectedClientChat) return;

    let cleanPhone = (selectedClientChat.phone_number || "").replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);

    try {
      const res = await fetch("/api/chat/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: editingMsgId,
          whatsappId: msg.id_whatsapp,
          newText: editingMsgText,
          phone: cleanPhone,
        }),
      });
      if (res.ok) {
        setEditingMsgId(null);
        setEditingMsgText("");
        fetchChatMessages(selectedClientChat.id);
      } else {
        const err = await res.json();
        alert("Gagal edit: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Edit error:", err);
      alert("Kesalahan koneksi saat mengedit pesan");
    }
  };

  const handleGetQR = async (username) => {
    setIsConnecting(true); setQrCode(null);
    try {
      const r = await fetch(`/api/whatsapp/qr?session=${username}`);
      const d = await r.json();
      if (d.qr) {
        setQrCode(d.qr);
        const interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/whatsapp/status?session=${username}`);
            const data = await res.json();
            if (data.connected) {
              clearInterval(interval);
              setIsConnectedInModal(true);
              setQrCode(null);
              setWaStatuses(prev => ({ ...prev, [username]: "Connected" }));
              fetchAllWAStatus();
            }
          } catch (err) { console.log("Polling error:", err); }
        }, 3000);
        setTimeout(() => clearInterval(interval), 180000);
      } else if (d.error === "Sudah Terhubung") {
        fetchAllWAStatus();
      } else {
        alert("Gagal: " + (d.error || "QR belum siap"));
      }
    } catch { alert("Kesalahan koneksi ke server"); }
    finally { setIsConnecting(false); }
  };

  useEffect(() => { 
    Promise.all([fetchUsers(), fetchProductLeads(), fetchCustomerCounts()]); 
  }, []);
  
  useEffect(() => {
    if (!teamStats.length) return;
    fetchAllWAStatus();
    fetchAvgResponses();
    const iv = setInterval(fetchAllWAStatus, 30000);
    return () => clearInterval(iv);
  }, [teamStats.length]);
  useEffect(() => {
    if (!selectedClientChat) { setChatMessages([]); setPrevMsgCount(0); setAdminReplyText(""); return; }
    fetchChatMessages(selectedClientChat.id);
    const iv = setInterval(() => fetchChatMessages(selectedClientChat.id), 8000);
    return () => clearInterval(iv);
  }, [selectedClientChat?.id]);
  useEffect(() => {
    if (chatMessages.length > prevMsgCount) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setPrevMsgCount(chatMessages.length);
    }
  }, [chatMessages, prevMsgCount]);
  useEffect(() => {
    if (activeTab === "calls") fetchCallLogs();
  }, [activeTab, callMarketingFilter]);
  useEffect(() => {
    if (activeTab === "avgreport") fetchAvgReport();
  }, [activeTab, avgReportMarketingFilter, avgReportMonth, avgReportYear]);

  const getClientCount = (mid) => customerCounts[mid] || 0;

  const handleAddMarketing = async (e) => {
    e.preventDefault();
    let ph = newMarketing.phone.replace(/\D/g, "");
    if (ph.startsWith("0")) ph = "62" + ph.slice(1);
    const method = editingMarketing ? "PATCH" : "POST";
    const url = editingMarketing ? `/api/user/${editingMarketing.id}` : "/api/user";
    try {
      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newMarketing.username, password: newMarketing.password || undefined, full_name: newMarketing.name, phone_number: ph, role: "marketing" }),
      });
      if (r.ok) { setIsModalOpen(false); setEditingMarketing(null); setNewMarketing({ name: "", username: "", password: "", phone: "" }); setQrCode(null); fetchUsers(); }
    } catch { alert("Kesalahan koneksi"); }
  };
  const handleDeleteMarketing = async (id) => {
    if (!confirm("Hapus sales ini?")) return;
    try { const r = await fetch(`/api/user/${id}`, { method: "DELETE" }); if (r.ok) fetchUsers(); }
    catch { alert("Gagal menghapus"); }
  };
  const openEditModal = (m) => {
    setEditingMarketing(m);
    setNewMarketing({ name: m.full_name || "", username: m.username || "", password: "", phone: m.phone_number || "" });
    setIsModalOpen(true);
  };
  const handleAssignSubmit = async (cid) => {
    if (!selectedMarketingId) return alert("Pilih sales!");
    try {
      const r = await fetch(`/api/customer/${cid}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_id: parseInt(selectedMarketingId) }),
      });
      if (r.ok) { fetchCustomers(); setSelectedMarketingId(""); }
    } catch { alert("Gagal assignment"); }
  };

  const ini = (n) => (n || "?")[0].toUpperCase();
  const ok = (u) => waStatuses[u] === "Connected";
  
  const secureUrl = (f) => {
    if (!f) return "";
    if (f.includes("screenshots/")) {
      const filename = f.split("screenshots/").pop();
      return `/api/call/media?file=${encodeURIComponent(filename!)}`;
    }
    if (f.includes("minio-server") || f.includes(":9000")) return `/api/chat/media?file=${f.split("/").pop()}`;
    if (f.startsWith("https://")) return f;
    return `/api/chat/media?file=${encodeURIComponent(f)}`;
  };

  const marketings = teamStats.filter(u => u.role === "marketing");

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}d`;
    return `${m}m ${s}d`;
  };
  const callStatusColor = (status: string) => {
    if (status === "missed") return { bg: "#FFF5F5", text: "#dc2626", label: "Tak Terjawab" };
    if (status === "answered") return { bg: "#F0FDF4", text: "#16a34a", label: "Terjawab" };
    return { bg: "#FFFBEB", text: "#d97706", label: "Berlangsung" };
  };

  const filteredCallLogs = callLogs.filter((log) => {
    const matchType = callFilter === "all" ? true : log.call_type === callFilter;
    const matchSearch = callSearch === "" ? true :
      (log.customer_name || "").toLowerCase().includes(callSearch.toLowerCase()) ||
      (log.phone || "").includes(callSearch) ||
      (log.marketing_name || "").toLowerCase().includes(callSearch.toLowerCase());
    return matchType && matchSearch;
  });

  const totalCalls = callLogs.length;
  const voiceCalls = callLogs.filter(l => l.call_type === "voice").length;
  const videoCalls = callLogs.filter(l => l.call_type === "video").length;
  const missedCalls = callLogs.filter(l => l.status === "missed").length;

  const monitoredMarketing = teamStats.find(u => String(u.id) === String(monitoredMarketingId));

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i).toLocaleString("id-ID", { month: "long" })
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: T.bg }}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white", maxHeight: "92vh", overflowY: "auto" }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: T.sidebar }}>
              <div>
                <h3 className="font-bold text-white">{editingMarketing ? "Edit Data Tim" : "Tambah Marketing Baru"}</h3>
                <p className="text-xs mt-0.5" style={{ color: T.sidebarText }}>{editingMarketing ? "Perbarui informasi anggota" : "Daftarkan marketing baru"}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setQrCode(null); setEditingMarketing(null); setIsConnectedInModal(false); }} style={{ color: T.sidebarText }} className="hover:text-white">
                <Icon.Close />
              </button>
            </div>
            <form onSubmit={handleAddMarketing} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                  <input required type="text" placeholder="Budi Santoso" value={newMarketing.name || ""}
                    onChange={(e) => setNewMarketing({ ...newMarketing, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1.5px solid #E8E8E4", background: T.bg }} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">No. WhatsApp</label>
                  <input required type="text" placeholder="62812xxx" value={newMarketing.phone || ""}
                    onChange={(e) => setNewMarketing({ ...newMarketing, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1.5px solid #E8E8E4", background: T.bg }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
                  <input required type="text" placeholder="mkt-user" value={newMarketing.username}
                    onChange={(e) => setNewMarketing({ ...newMarketing, username: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1.5px solid #E8E8E4", background: T.bg }} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
                  <input type="password" placeholder={editingMarketing ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                    value={newMarketing.password}
                    onChange={(e) => setNewMarketing({ ...newMarketing, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1.5px solid #E8E8E4", background: T.bg }} />
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ border: "1.5px dashed #E8E8E4", background: T.bg }}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hubungkan WhatsApp</p>
                <div className="flex flex-col items-center justify-center min-h-[140px] rounded-xl bg-white p-3" style={{ border: "1px solid #F0F0EC" }}>
                  {(ok(newMarketing.username) || isConnectedInModal) ? (
                    <div className="flex flex-col items-center">
                      <div className="text-emerald-500 mb-2"><Icon.CheckCircle /></div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">WhatsApp Terhubung</p>
                    </div>
                  ) : qrCode ? (
                    <img src={qrCode} alt="WhatsApp QR" className="w-32 h-32 rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300">
                      <Icon.Smartphone />
                      <p className="text-xs text-gray-400 mt-2 text-center font-medium px-4">
                        {isConnecting ? "Membangun koneksi..." : "Isi username dulu, lalu klik hubungkan"}
                      </p>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => handleGetQR(newMarketing.username)}
                  disabled={isConnecting || !newMarketing.username || ok(newMarketing.username)}
                  className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: "white", border: `1.5px solid ${T.primary}`, color: T.primary }}>
                  {ok(newMarketing.username) ? <><Icon.CheckCircle />Terhubung</> : qrCode ? <><Icon.Refresh />Refresh QR</> : <><Icon.Link />Hubungkan WhatsApp</>}
                </button>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setIsModalOpen(false); setQrCode(null); setEditingMarketing(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ border: "1.5px solid #E8E8E4" }}>Batal</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: T.sidebar, color: T.accent }}>
                  <Icon.Save /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className={`fixed lg:relative z-[70] w-64 h-full flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: T.sidebar, borderRight: `1px solid ${T.sidebarBorder}` }}>
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
          <div>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, background: T.accent, borderRadius: "50%" }} />
              <span className="font-bold text-white tracking-widest text-xs uppercase">IBMP CRM</span>
            </div>
            <p style={{ color: T.sidebarText, fontSize: 10, marginTop: 2 }}>SPV IBMP</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden hover:text-white p-1 transition-colors" style={{ color: T.sidebarText }}>
            <Icon.Close />
          </button>
        </div>

        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Performa Sales",   I: Icon.Dashboard },
            { id: "monitor",   label: "Monitor Chat",   I: Icon.Monitor },
            { id: "calls",     label: "Laporan Call",   I: Icon.PhoneLog },
            { id: "avgreport", label: "Avg Response",   I: Icon.BarChart },
            { id: "closing", label: "Closing & Deals", I: Icon.BarChart },
	    { id: "followup", label: "Follow Up", I: Icon.BarChart },
	    { id: "activity", label: "Activity Tracker", I: Icon.BarChart },
	    { id: "deals", label: "Deals", I: Icon.BarChart },
	    { id: "kpi", label: "KPI Sales",  I: Icon.BarChart },
	    { id: "kpi2", label: "KPI Sales 2", I: Icon.BarChart },
	    { id: "fraud", label: "Fraud Alerts", I: Icon.BarChart },
	    { id: "ai-analyst", label: "Audital Work", I: Icon.BarChart },
	    { id: "crm", label: "CRM", I: Icon.BarChart },
            { id: "marketing", label: "Data Sales", I: Icon.Users },
          ].map(({ id, label, I }) => (
            <button key={id} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: activeTab === id ? T.primary : "transparent", color: activeTab === id ? "white" : T.sidebarText }}>
              <I />{label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: T.sidebarBorder }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: T.accent, color: T.sidebar }}>
              {adminName ? adminName[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName || "Admin"}</p>
              <p style={{ color: T.sidebarText, fontSize: 10 }}>Administrator</p>
            </div>
          </div>
          <button onClick={() => { setEditingMarketing(null); setNewMarketing({ name: "", username: "", password: "", phone: "" }); setIsModalOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-95"
            style={{ background: T.accent, color: T.sidebar }}>
            <Icon.Plus /> Tambah Tim
          </button>
          <button onClick={handleLogoutAdmin}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "#2D1A14", color: "#FF8A80", border: "1px solid #3D2218" }}>
            <Icon.Logout /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 lg:hidden" style={{ background: T.sidebar, borderBottom: `1px solid ${T.sidebarBorder}` }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ color: T.sidebarText }}><Icon.Menu /></button>
          <span className="font-bold text-white text-sm tracking-wider">IBMP CRM</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "#0F2918" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-400">Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
            <DashboardAdminTab
              marketings={marketings}
              customers={customers}
              customerCounts={customerCounts}
              loading={loading}
              waStatuses={waStatuses}
              avgResponses={avgResponses}
              openEditModal={openEditModal}
              handleDeleteMarketing={handleDeleteMarketing}
            />
          </div>
          <div style={{ display: activeTab === "monitor" ? "block" : "none" }}>
            <MonitorAdminTab marketings={marketings} customers={customers} />
          </div>
          <div style={{ display: activeTab === "calls" ? "block" : "none" }}>
            <CallsAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "avgreport" ? "block" : "none" }}>
            <AvgReportAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "closing" ? "block" : "none" }}>
            <ClosingAdminTab marketings={marketings} customers={customers} />
          </div>
          <div style={{ display: activeTab === "followup" ? "block" : "none" }}>
            <FollowUpAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "activity" ? "block" : "none" }}>
            <ActivityAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "deals" ? "block" : "none" }}>
            <DealsAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "ai-analyst" ? "block" : "none" }}>
            <AIAnalystTab marketingId={null} role="admin" userName={adminName} />
          </div>
          <div style={{ display: activeTab === "fraud" ? "block" : "none" }}>
            <FraudAlertsTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "kpi" ? "block" : "none" }}>
            <KpiAdminTab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "kpi2" ? "block" : "none" }}>
            <KpiAdmin2Tab marketings={marketings} />
          </div>
          <div style={{ display: activeTab === "crm" ? "block" : "none" }}>
            <CrmTab marketingId={null} role="admin" marketings={marketings} />
          </div>

          {activeTab === "marketing" && (	
            <MarketingTab
              marketings={marketings}
              waStatuses={waStatuses}
              customers={customers}
              showPassId={showPassId}
              setShowPassId={setShowPassId}
              resetPassId={resetPassId}
              setResetPassId={setResetPassId}
              newPass={newPass}
              setNewPass={setNewPass}
              openEditModal={openEditModal}
              handleDeleteMarketing={handleDeleteMarketing}
              fetchUsers={fetchUsers}
            />
          )}
        </div>
      </main>

      {editingMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: "white" }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: T.sidebar }}>
              <h2 className="font-bold text-white">Edit Pesan</h2>
              <button onClick={() => setEditingMsgId(null)} style={{ color: T.sidebarText }} className="hover:text-white"><Icon.Close /></button>
            </div>
            <div className="p-6">
              <textarea rows={4} value={editingMsgText}
                onChange={(e) => setEditingMsgText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border: "1.5px solid #E8E8E4", background: T.bg }} />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditingMsgId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600"
                style={{ border: "1.5px solid #E8E8E4" }}>Batal</button>
              <button onClick={handleEditMessage}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: T.sidebar, color: T.accent }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>
    </div>
  );
}
fff