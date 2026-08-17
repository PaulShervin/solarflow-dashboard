import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  FileText,
  UserCheck,
  Zap,
  Shield,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Sun,
  Battery,
  DollarSign,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { solarApi } from "@/lib/api";
import { CustomerRooftopParams } from "@/components/chat/CustomerRooftopParams";
import { syncConversationToFirestore, syncLeadToFirestore } from "@/lib/firestoreSync";
import { formatINR } from "@/lib/formatCurrency";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/authContext";
import type { Lead } from "@/types/solar";

const UnifiedPropertyMap = React.lazy(() => 
  import("@/components/common/UnifiedPropertyMap").then((mod) => ({ default: mod.UnifiedPropertyMap }))
);

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "rep" | "system";
  text: string;
  timestamp: string;
  quickReplies?: string[];
  cardType?: "estimate" | "map_prompt" | "escalation" | "product_spec";
  cardData?: any;
  intent?: string;
}

interface ProductChatbotWidgetProps {
  initialOpen?: boolean;
  leadId?: string;
  embedded?: boolean;
  initialPrompt?: string | null;
}

export function ProductChatbotWidget({
  initialOpen = false,
  leadId,
  embedded = false,
  initialPrompt = null,
}: ProductChatbotWidgetProps) {
  const { session: authSession } = useAuth();
  const [isOpen, setIsOpen] = useState(initialOpen || embedded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string>(leadId || `conv-${Date.now()}`);
  const [activeLeadId, setActiveLeadId] = useState<string>(
    leadId || `LD-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRoofArea, setMapRoofArea] = useState(540);
  const [mapAddress, setMapAddress] = useState("Mumbai, Maharashtra");

  const [qualData, setQualData] = useState<{
    homeowner: boolean;
    monthlyBill: number;
    roof: string;
    address: string;
    roofAreaSqFt: number;
    timeline: string;
  }>({
    homeowner: true,
    monthlyBill: 5000,
    roof: "Flat RCC",
    address: "Mumbai, Maharashtra",
    roofAreaSqFt: 540,
    timeline: "0-1 month",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastHandledPromptRef = useRef<string | null>(null);

  // Sync lead helper to Firestore, local db, and backend API
  function syncLeadRecord(partial: Partial<typeof qualData>) {
    const updated = { ...qualData, ...partial };
    setQualData(updated);

    const isCustomer = authSession?.role === "customer";
    const customerName = isCustomer && authSession?.name ? authSession.name : "Website Solar Lead (Chat)";
    const customerEmail = isCustomer && authSession?.email ? authSession.email : `chat-lead-${(activeLeadId || "8821").slice(-4)}@solarflow.io`;
    const score = updated.homeowner === false ? 40 : 88;

    const leadRecord: Lead = {
      id: activeLeadId,
      name: customerName,
      email: customerEmail,
      phone: "+91 98765 43210",
      city: "Mumbai",
      state: "MH",
      source: "Website",
      monthlyBill: updated.monthlyBill || 5000,
      score,
      status: "qualified",
      timeline: (updated.timeline as any) || "0-1 month",
      homeType: "Single family",
      roof: (updated.roof as any) || "Flat RCC",
      homeowner: updated.homeowner ?? true,
      owner: "Dana Ruiz",
      createdAt: new Date().toISOString(),
      lastTouch: "Just now",
      tags: ["Chat Qualified", "Website", "High Intent"],
      aiSummary: `Chatbot Qualification: Homeowner=${updated.homeowner ? "Yes" : "No"}, Monthly Bill=₹${(updated.monthlyBill || 5000).toLocaleString("en-IN")}/mo, Roof=${updated.roof || "Flat RCC"}, Roof Area=${updated.roofAreaSqFt || 540} sq ft, Timeline=${updated.timeline || "0-1 month"}.`,
      conversationId: sessionId,
    };

    // 1. Sync to local in-browser DB
    db.addLead(leadRecord);

    // 2. Sync to Firebase Firestore solar_leads
    syncLeadToFirestore(leadRecord);

    // 3. Post to backend REST API
    solarApi.postInboundWebhook({
      name: leadRecord.name,
      email: leadRecord.email,
      phone: leadRecord.phone,
      monthlyBill: leadRecord.monthlyBill,
      roof: leadRecord.roof as any,
      timeline: leadRecord.timeline as any,
      homeowner: leadRecord.homeowner,
    }).catch(() => {});
  }

  // Initialize session on mount
  useEffect(() => {
    initChatSession();
  }, []);

  // Handle external quick prompt triggers
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && lastHandledPromptRef.current !== initialPrompt.trim()) {
      lastHandledPromptRef.current = initialPrompt.trim();
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function initChatSession() {
    try {
      const res = await solarApi.sendChatMessage(undefined, "", activeLeadId);
      if (res && res.session) {
        setSessionId(res.sessionId);
        setMessages(res.session.messages || []);
      } else {
        const initialMsg: ChatMessage = {
          id: "msg-initial",
          sender: "bot",
          text: "👋 Hi! I'm your SolarFlow Assistant. I can answer any product or pricing questions, or walk you through an instant 1-minute solar estimate for your home.\n\nTo get started: **Do you own your home?**",
          timestamp: new Date().toISOString(),
          quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
        };
        setMessages([initialMsg]);
        db.addMessage(sessionId, "bot", initialMsg.text, "Webchat");
        syncConversationToFirestore(sessionId, {
          id: initialMsg.id,
          sender: "assistant",
          text: initialMsg.text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "Web chat",
        }, {
          id: sessionId,
          leadId: activeLeadId,
          customer: authSession?.name || "Website Solar Lead (Chat)",
          channel: "Web chat",
          status: "Active",
        });
      }
    } catch (err) {
      console.warn("Failed to initialize remote chat session, using local:", err);
      const initialMsg: ChatMessage = {
        id: "msg-initial",
        sender: "bot",
        text: "👋 Hi! I'm your SolarFlow Assistant. I can answer any product or pricing questions, or walk you through an instant 1-minute solar estimate for your home.\n\nTo get started: **Do you own your home?**",
        timestamp: new Date().toISOString(),
        quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
      };
      setMessages([initialMsg]);
      db.addMessage(sessionId, "bot", initialMsg.text, "Webchat");
      syncConversationToFirestore(sessionId, {
        id: initialMsg.id,
        sender: "assistant",
        text: initialMsg.text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: "Web chat",
      }, {
        id: sessionId,
        leadId: activeLeadId,
        customer: authSession?.name || "Website Solar Lead (Chat)",
        channel: "Web chat",
        status: "Active",
      });
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText("");

    // Parse qualification answers
    const lower = text.toLowerCase();
    const partialUpdate: Partial<typeof qualData> = {};

    if (lower.includes("own") || lower.includes("yes")) {
      partialUpdate.homeowner = true;
    } else if (lower.includes("rent") || lower.includes("commercial")) {
      partialUpdate.homeowner = false;
    }

    const cleanDigits = text.replace(/,/g, "").match(/\d+/);
    if (cleanDigits) {
      const parsedNum = parseInt(cleanDigits[0], 10);
      if (parsedNum >= 500) {
        partialUpdate.monthlyBill = parsedNum;
      }
    }

    if (lower.includes("rcc") || lower.includes("flat")) {
      partialUpdate.roof = "Flat RCC Roof";
    } else if (lower.includes("metal")) {
      partialUpdate.roof = "Sloped Metal Roof";
    } else if (lower.includes("tile")) {
      partialUpdate.roof = "Tile Roof";
    } else if (lower.includes("shingle")) {
      partialUpdate.roof = "Asphalt Shingle";
    }

    if (lower.includes("1 month") || lower.includes("within")) {
      partialUpdate.timeline = "0-1 month";
    } else if (lower.includes("1-3") || lower.includes("3 months")) {
      partialUpdate.timeline = "1-3 months";
    } else if (lower.includes("3-6") || lower.includes("6 months")) {
      partialUpdate.timeline = "3-6 months";
    } else if (lower.includes("researching")) {
      partialUpdate.timeline = "Just researching";
    }

    // Optimistic UI update
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const activeSession = sessionId || `conv-${Date.now()}`;
    if (!sessionId) setSessionId(activeSession);

    // Sync Lead to DB + Firestore + Backend
    syncLeadRecord(partialUpdate);

    // Sync Message to DB & Firestore
    db.addMessage(activeSession, "user", text, "Webchat");
    syncConversationToFirestore(activeSession, {
      id: userMsg.id,
      sender: "customer",
      text: userMsg.text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: "Web chat",
    }, {
      id: activeSession,
      leadId: activeLeadId,
      customer: authSession?.name || "Website Solar Lead (Chat)",
      channel: "Web chat",
      status: "Active",
      lastMessage: text,
      lastTime: "Just now",
    });

    try {
      const res = await solarApi.sendChatMessage(activeSession, text, activeLeadId);
      if (res && res.botMessage) {
        if (res.sessionId && !sessionId) {
          setSessionId(res.sessionId);
        }
        setMessages((prev) => [...prev, res.botMessage]);
        
        // Sync bot message to DB & Firestore
        db.addMessage(activeSession, "bot", res.botMessage.text, "Webchat");
        syncConversationToFirestore(activeSession, {
          id: res.botMessage.id,
          sender: "assistant",
          text: res.botMessage.text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "Web chat",
        }, {
          lastMessage: res.botMessage.text,
          lastTime: "Just now",
        });

        // Auto-open map modal if the backend determines it's time for the map prompt
        if (res.botMessage.cardType === "map_prompt") {
          setTimeout(() => setShowMapModal(true), 1000);
        }
      } else {
        // Offline / Local Simulation Fallback
        handleLocalFallbackReply(text, activeSession);
      }
    } catch (err) {
      console.warn("Chat message request failed, using local fallback", err);
      handleLocalFallbackReply(text, activeSession);
    } finally {
      setLoading(false);
    }
  }

  function handleLocalFallbackReply(userText: string, activeSession: string) {
    const trimmed = (userText || "").trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    let replyText = "";
    let quickReplies: string[] | undefined = undefined;
    let cardType: any = undefined;
    let cardData: any = undefined;

    const cleanDigits = userText.replace(/,/g, "").match(/\d+/);
    const isTimeline = lower.includes("month") || lower.includes("researching") || lower.includes("immediate") || lower.includes("asap");
    const isArea = lower.includes("sq ft") || lower.includes("sqft") || lower.includes("~500") || lower.includes("~1,000") || lower.includes("~1000");
    const isRoof = lower.includes("shingle") || lower.includes("tile") || lower.includes("metal") || lower.includes("flat") || lower.includes("rcc") || lower.includes("sloped");
    const isBill = !isArea && !isTimeline && cleanDigits && (lower.includes("₹") || lower.includes("$") || lower.includes("mo") || lower.includes("bill") || parseInt(cleanDigits[0], 10) >= 500);
    const isHomeowner = lower.includes("yes") || lower.includes("own") || lower.includes("rent") || lower.includes("commercial");

    if (lower.includes("panel") || lower.includes("maxeon") || lower.includes("efficiency")) {
      replyText =
        "We install premium **Tier-1 Mono PERC 400W** (22.8% efficiency) panels with a 25-year performance warranty guaranteeing 90%+ output.";
      quickReplies = ["How much does it cost?", "What about battery storage?", "Check my roof"];
    } else if (lower.includes("battery") || lower.includes("powerwall") || lower.includes("backup")) {
      replyText =
        "We offer certified **Lithium LFP 10 kWh & 20 kWh Battery Storage** with whole-home backup, keeping essential loads running during grid cuts.";
      quickReplies = ["Add battery to quote", "What is the warranty?", "Continue qualification"];
    } else if (lower.includes("warranty")) {
      replyText =
        "All our solar systems include a **25-year comprehensive warranty** on panels and 5-year full installation protection backed by 24/7 monitoring.";
      quickReplies = ["Calculate my savings", "What panels do you use?", "Talk to rep"];
    } else if (lower.includes("pin") || lower.includes("map")) {
      setShowMapModal(true);
      return;
    } else if (isTimeline) {
      replyText =
        "🎉 **Your Solar Estimate is Ready!**\n\nBased on your home profile, here is your customized solar calculation:";
      cardType = "estimate";
      cardData = {
        systemSizeKw: 5.2,
        panelModel: "Tier-1 Mono Perc 400W",
        panelCount: 13,
        annualProductionKwh: 8580,
        grossCost: 285000,
        federalTaxCredit: 78000,
        netCost: 207000,
        monthlySavings: 3800,
        paybackYears: 4.5,
      };
      quickReplies = ["📄 Download PDF Proposal", "👤 Talk to an Expert", "What panels do you use?"];
    } else if (isArea) {
      const area = cleanDigits ? parseInt(cleanDigits[0], 10) : 540;
      replyText =
        `Recorded **${area} sq ft** of usable roof space.\n\nLast question: **When are you looking to install solar?**`;
      quickReplies = ["Within 1 month", "1-3 months", "3-6 months", "Just researching"];
    } else if (isRoof) {
      replyText =
        "Great! Do you know your **roof area**, or would you like to **pin your house on our satellite map**?";
      cardType = "map_prompt";
      quickReplies = ["📍 Pin House on Map", "~500 sq ft", "~1,000 sq ft"];
    } else if (isBill) {
      replyText =
        "Got it! What type of **roof** does your home have?";
      quickReplies = ["Flat RCC Roof", "Sloped Metal Roof", "Tile Roof", "Asphalt Shingle"];
    } else if (isHomeowner) {
      replyText =
        "Awesome! Homeowners qualify for the **PM Surya Ghar Central Subsidy (up to ₹78,000)**.\n\n**What is your average monthly electricity bill?**";
      quickReplies = ["₹3,000/mo", "₹5,000/mo", "₹8,000/mo", "₹12,000+/mo"];
    } else {
      replyText =
        "🎉 **Your Solar Estimate is Ready!**\n\nBased on your home profile, here is your customized solar calculation:";
      cardType = "estimate";
      cardData = {
        systemSizeKw: 5.2,
        panelModel: "Tier-1 Mono Perc 400W",
        panelCount: 13,
        annualProductionKwh: 8580,
        grossCost: 285000,
        federalTaxCredit: 78000,
        netCost: 207000,
        monthlySavings: 3800,
        paybackYears: 4.5,
      };
      quickReplies = ["📄 Download PDF Proposal", "👤 Talk to an Expert", "What panels do you use?"];
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: replyText,
      timestamp: new Date().toISOString(),
      quickReplies,
      cardType,
      cardData,
    };
    setMessages((prev) => [...prev, botMsg]);

    // Sync bot fallback reply to DB and Firestore
    db.addMessage(activeSession, "bot", replyText, "Webchat");
    syncConversationToFirestore(activeSession, {
      id: botMsg.id,
      sender: "assistant",
      text: botMsg.text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: "Web chat",
    }, {
      id: activeSession,
      leadId: activeLeadId,
      customer: authSession?.name || "Website Solar Lead (Chat)",
      lastMessage: replyText,
      lastTime: "Just now",
    });
  }

  async function handleConfirmRoofMap(confirmedAreaSqFt?: number, confirmedAddress?: string) {
    setShowMapModal(false);
    setLoading(true);

    const finalArea = confirmedAreaSqFt !== undefined ? confirmedAreaSqFt : mapRoofArea;
    const finalAddress = confirmedAddress !== undefined ? confirmedAddress : mapAddress;

    setMapRoofArea(finalArea);
    setMapAddress(finalAddress);

    // Sync lead with updated roof area and address
    syncLeadRecord({
      roofAreaSqFt: finalArea,
      address: finalAddress,
    });

    try {
      const res = await solarApi.submitRoofData(sessionId, {
        address: finalAddress,
        roofAreaSqFt: finalArea,
      });

      if (res && res.session) {
        setMessages(res.session.messages);
      } else {
        const botMsgText = `📍 **Map Capture Successful!**\n\nIdentified **${finalArea} sq ft** of usable solar roof area at *${finalAddress}*.\n\nWhen are you looking to install solar?`;
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botMsgText,
          timestamp: new Date().toISOString(),
          quickReplies: ["Within 1 month", "1-3 months", "3-6 months", "Just researching"],
        };
        setMessages((prev) => [...prev, botMsg]);
        db.addMessage(sessionId, "bot", botMsgText, "Webchat");
        syncConversationToFirestore(sessionId, {
          id: botMsg.id,
          sender: "assistant",
          text: botMsg.text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "Web chat",
        }, {
          lastMessage: botMsgText,
          lastTime: "Just now",
        });
      }
    } catch (err) {
      console.warn("Failed to submit roof data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalateToRep() {
    setLoading(true);
    try {
      await solarApi.escalateChat(sessionId, "User clicked Speak with Expert");
      const botMsgText = "🤝 **Consultant Assigned!**\n\nOur Senior Solar Advisor **Dana Ruiz** has been notified. She will review your roof sizing and reach out shortly via phone/email.";
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botMsgText,
        timestamp: new Date().toISOString(),
        cardType: "escalation",
        cardData: {
          repName: "Dana Ruiz",
          phone: "+91 98765 43210",
          email: "d.ruiz@solarflow.io",
        },
      };
      setMessages((prev) => [...prev, botMsg]);
      db.addMessage(sessionId, "bot", botMsgText, "Webchat");
      syncConversationToFirestore(sessionId, {
        id: botMsg.id,
        sender: "assistant",
        text: botMsg.text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        channel: "Web chat",
      }, {
        lastMessage: botMsgText,
        lastTime: "Just now",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleResetChat() {
    initChatSession();
  }

  // Floating button when closed
  if (!isOpen && !embedded) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30"
        aria-label="Open Solar AI Assistant"
      >
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex size-3 rounded-full bg-amber-500"></span>
        </span>
        <Sparkles className="size-5" />
        <span>Ask Solar AI</span>
      </button>
    );
  }

  return (
    <>
      <div
        className={
          embedded
            ? "flex h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
            : `fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ${isExpanded
              ? "h-[85vh] w-[95vw] sm:w-[680px]"
              : "h-[640px] w-[92vw] sm:w-[440px]"
            }`
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-navy px-4 py-3.5 text-navy-foreground">
          <div className="flex items-center gap-3">
            <div className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
              <Sun className="size-5 text-navy animate-spin-slow" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-navy bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm font-black">SolarFlow AI Assistant</h3>
                <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  Module 5
                </span>
              </div>
              <p className="text-[11px] text-navy-foreground/70">
                Grounding Catalog · Live Sizing & FAQs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              title="Reset Chat"
              className="grid size-8 place-items-center rounded-lg text-navy-foreground/70 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
            {!embedded && (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                  className="grid size-8 place-items-center rounded-lg text-navy-foreground/70 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
                >
                  {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="grid size-8 place-items-center rounded-lg text-navy-foreground/70 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
                >
                  <X className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"
                }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${m.sender === "user"
                    ? "rounded-tr-xs bg-primary font-medium text-primary-foreground"
                    : "rounded-tl-xs border border-border bg-secondary/60 text-foreground"
                  }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Card Type: Map Sub-Window Trigger */}
                {m.cardType === "map_prompt" && (
                  <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft p-3 text-xs text-foreground">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <MapPin className="size-4" />
                      <span>Interactive Satellite Rooftop Scanner</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Trace your roof outline with satellite imagery to compute exact usable square footage.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowMapModal(true)}
                      className="mt-2.5 w-full justify-center text-xs font-bold"
                    >
                      <MapPin className="size-3.5 mr-1.5" />
                      Launch Map Sub-Window
                    </Button>
                  </div>
                )}

                {/* Card Type: Pre-Design Solar Calculation Estimate */}
                {m.cardType === "estimate" && m.cardData && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/30 bg-card p-4 shadow-sm text-foreground space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-1.5 font-display text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        <Zap className="size-4" />
                        <span>Recommended System: {m.cardData.systemSizeKw} kW</span>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-secondary/40 p-2">
                        <span className="text-[10px] text-muted-foreground">Hardware</span>
                        <p className="font-bold truncate">{m.cardData.panelCount}x {m.cardData.panelModel}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-2">
                        <span className="text-[10px] text-muted-foreground">Est. Annual Output</span>
                        <p className="font-bold">{m.cardData.annualProductionKwh?.toLocaleString()} kWh/yr</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-2">
                        <span className="text-[10px] text-muted-foreground">Gross Cost</span>
                        <p className="font-bold">{formatINR(m.cardData.grossCost)}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                        <span className="text-[10px]">PM Surya Ghar</span>
                        <p className="font-bold">-{formatINR(m.cardData.federalTaxCredit || 78000)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-primary-soft p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Net Investment
                        </span>
                        <p className="font-display text-base font-black text-primary">
                          {formatINR(m.cardData.netCost)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground">Est. Monthly Savings</span>
                        <p className="font-display text-sm font-bold text-emerald-600">
                          ~{formatINR(m.cardData.monthlySavings)}/mo
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => alert("Downloading official SolarFlow PDF Pre-Design proposal...")}
                      >
                        <FileText className="size-3.5 mr-1" />
                        Proposal PDF
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={handleEscalateToRep}
                      >
                        <UserCheck className="size-3.5 mr-1" />
                        Talk to Advisor
                      </Button>
                    </div>
                  </div>
                )}

                {/* Card Type: Rep Escalation */}
                {m.cardType === "escalation" && m.cardData && (
                  <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-200">
                    <div className="flex items-center gap-2 font-bold">
                      <UserCheck className="size-4 text-blue-600" />
                      <span>Assigned Specialist: {m.cardData.repName}</span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-80">
                      Direct Line: {m.cardData.phone} · Email: {m.cardData.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid size-6 place-items-center rounded-full bg-primary/20 text-primary">
                <Sparkles className="size-3 animate-spin" />
              </span>
              <span>SolarFlow AI is searching catalog & calculating...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Actions & Input Bar */}
        <div className="border-t border-border bg-card p-3.5 space-y-3">
          {/* 4 Option Buttons Grid near the chat input option */}
          {(() => {
            const latestBotMessage = [...messages].reverse().find((m) => m.sender === "bot");
            const activeOptions = latestBotMessage?.quickReplies || [];

            if (activeOptions.length > 0 && !loading) {
              return (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Answer Option:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {activeOptions.map((option, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (option.includes("Pin House")) {
                            setShowMapModal(true);
                          } else if (
                            option.includes("Talk to an Expert") ||
                            option.includes("Talk to rep") ||
                            option.includes("Talk to Advisor")
                          ) {
                            handleEscalateToRep();
                          } else if (option.includes("Download PDF Proposal")) {
                            alert("Downloading official SolarFlow PDF Pre-Design proposal...");
                          } else {
                            handleSendMessage(option);
                          }
                        }}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-left text-xs font-semibold text-foreground transition-all hover:border-primary hover:bg-primary-soft hover:shadow-sm active:scale-98"
                      >
                        <span className="truncate">{option}</span>
                        <ChevronRight className="size-3.5 text-primary opacity-70 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Text Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-0.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type custom response / question..."
              className="flex-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() || loading}
              className="rounded-xl px-3.5"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>


      {/* Map Sub-Window Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl relative">
            <button
              onClick={() => setShowMapModal(false)}
              className="absolute top-4 right-4 z-50 rounded-lg bg-background/80 p-1.5 text-foreground hover:bg-muted backdrop-blur border border-border shadow-sm transition-colors"
            >
              <X className="size-5" />
            </button>
            <div className="w-full h-[85vh]">
              <CustomerRooftopParams onClose={() => setShowMapModal(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
