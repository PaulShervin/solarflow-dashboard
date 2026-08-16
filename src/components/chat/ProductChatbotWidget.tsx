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
}

export function ProductChatbotWidget({
  initialOpen = false,
  leadId = "LD-4821",
  embedded = false,
}: ProductChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen || embedded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRoofArea, setMapRoofArea] = useState(540);
  const [mapAddress, setMapAddress] = useState("742 Evergreen Terrace, Chandler, AZ");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    initChatSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function initChatSession() {
    try {
      const res = await solarApi.sendChatMessage(undefined, "", leadId);
      if (res && res.session) {
        setSessionId(res.sessionId);
        setMessages(res.session.messages || []);
      } else {
        // Fallback default message
        setMessages([
          {
            id: "msg-initial",
            sender: "bot",
            text: "👋 Hi! I'm your SolarFlow Assistant. I can answer any product or pricing questions, or walk you through an instant 1-minute solar estimate for your home.\n\nTo get started: **Do you own your home?**",
            timestamp: new Date().toISOString(),
            quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
          },
        ]);
      }
    } catch (err) {
      console.warn("Failed to initialize remote chat session, using local:", err);
      setMessages([
        {
          id: "msg-initial",
          sender: "bot",
          text: "👋 Hi! I'm your SolarFlow Assistant. I can answer any product or pricing questions, or walk you through an instant 1-minute solar estimate for your home.\n\nTo get started: **Do you own your home?**",
          timestamp: new Date().toISOString(),
          quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
        },
      ]);
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText("");

    // Optimistic UI update
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await solarApi.sendChatMessage(sessionId, text, leadId);
      if (res && res.botMessage) {
        if (res.sessionId && !sessionId) {
          setSessionId(res.sessionId);
        }
        setMessages((prev) => [...prev, res.botMessage]);
      } else {
        // Offline / Local Simulation Fallback
        handleLocalFallbackReply(text);
      }
    } catch (err) {
      console.warn("Chat message request failed, using local fallback", err);
      handleLocalFallbackReply(text);
    } finally {
      setLoading(false);
    }
  }

  function handleLocalFallbackReply(userText: string) {
    const lower = userText.toLowerCase();
    let replyText = "";
    let quickReplies: string[] | undefined = undefined;
    let cardType: any = undefined;
    let cardData: any = undefined;

    if (lower.includes("panel") || lower.includes("maxeon") || lower.includes("efficiency")) {
      replyText =
        "We install premium **Maxeon 6 Black 430W** (22.8% efficiency) and **REC Alpha Pure 400W** panels with a 25-year performance warranty guaranteeing 92% output.";
      quickReplies = ["How much does it cost?", "What about battery storage?", "Check my roof"];
    } else if (lower.includes("battery") || lower.includes("powerwall")) {
      replyText =
        "We offer the **Tesla Powerwall 3 (13.5 kWh)** with whole-home backup and 11.5 kW continuous power, providing instant power during grid blackouts.";
      quickReplies = ["Add battery to quote", "What is the warranty?", "Continue qualification"];
    } else if (lower.includes("warranty")) {
      replyText =
        "All our solar systems include a **25-year comprehensive warranty** on panels and 10-year roof-penetration protection backed by 24/7 monitoring.";
      quickReplies = ["Calculate my savings", "What panels do you use?", "Talk to rep"];
    } else if (lower.includes("yes") || lower.includes("own")) {
      replyText =
        "Awesome! Homeowners qualify for the 30% Federal Solar Tax Credit.\n\n**What is your average monthly electricity bill?**";
      quickReplies = ["$150/mo", "$250/mo", "$350/mo", "$500+/mo"];
    } else if (lower.includes("$") || lower.includes("150") || lower.includes("250") || lower.includes("350")) {
      replyText =
        "Got it! What type of **roof** does your home have?";
      quickReplies = ["Asphalt Shingle", "Tile Roof", "Metal Roof", "Flat Roof"];
    } else if (lower.includes("shingle") || lower.includes("tile") || lower.includes("metal") || lower.includes("flat")) {
      replyText =
        "Great! Do you know your **roof area**, or would you like to **pin your house on our satellite map**?";
      cardType = "map_prompt";
      quickReplies = ["📍 Pin House on Map", "~450 sq ft", "~800 sq ft"];
    } else if (lower.includes("pin") || lower.includes("map")) {
      setShowMapModal(true);
      return;
    } else {
      replyText =
        "🎉 **Your Solar Estimate is Ready!**\n\nBased on your home profile, here is your customized solar calculation:";
      cardType = "estimate";
      cardData = {
        systemSizeKw: 8.6,
        panelModel: "Maxeon 6 Black 430W",
        panelCount: 20,
        annualProductionKwh: 13330,
        grossCost: 24500,
        federalTaxCredit: 7350,
        netCost: 17150,
        monthlySavings: 285,
        paybackYears: 5.2,
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
  }

  async function handleConfirmRoofMap() {
    setShowMapModal(false);
    setLoading(true);

    try {
      const res = await solarApi.submitRoofData(sessionId, {
        address: mapAddress,
        roofAreaSqFt: mapRoofArea,
      });

      if (res && res.session) {
        setMessages(res.session.messages);
      } else {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `📍 **Map Capture Successful!**\n\nIdentified **${mapRoofArea} sq ft** of usable solar roof area at *${mapAddress}*.\n\nWhen are you looking to install solar?`,
          timestamp: new Date().toISOString(),
          quickReplies: ["Within 1 month", "1-3 months", "3-6 months", "Just researching"],
        };
        setMessages((prev) => [...prev, botMsg]);
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
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "🤝 **Consultant Assigned!**\n\nOur Senior Solar Advisor **Dana Ruiz** has been notified. She will review your roof sizing and reach out shortly via phone/email.",
        timestamp: new Date().toISOString(),
        cardType: "escalation",
        cardData: {
          repName: "Dana Ruiz",
          phone: "(480) 555-0142",
          email: "d.ruiz@solarflow.io",
        },
      };
      setMessages((prev) => [...prev, botMsg]);
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
                        <p className="font-bold">${m.cardData.grossCost?.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                        <span className="text-[10px]">30% Federal ITC</span>
                        <p className="font-bold">-${m.cardData.federalTaxCredit?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-primary-soft p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Net Investment
                        </span>
                        <p className="font-display text-base font-black text-primary">
                          ${m.cardData.netCost?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground">Est. Monthly Savings</span>
                        <p className="font-display text-sm font-bold text-emerald-600">
                          ~${m.cardData.monthlySavings}/mo
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
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-navy px-5 py-4 text-navy-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h3 className="font-display text-base font-black">Satellite Rooftop Area Scanner</h3>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="rounded-lg p-1 text-navy-foreground/70 hover:bg-navy-foreground/10 hover:text-navy-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-muted-foreground">Property Address</label>
                <input
                  type="text"
                  value={mapAddress}
                  onChange={(e) => setMapAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                />
              </div>

              {/* Mock Satellite Canvas */}
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border bg-slate-900">
                <div
                  className="absolute inset-0 opacity-40 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 50%, #1e293b 10%, #0f172a 90%)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="size-24 rounded-lg border-2 border-dashed border-primary bg-primary/20 grid place-items-center shadow-lg">
                    <Sun className="size-8 text-primary animate-pulse" />
                  </div>
                  <span className="mt-2 font-mono font-bold text-emerald-400">
                    Active Polygon: {mapRoofArea} sq ft usable
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Azimuth: 180° (South) · Optimal Solar Irradiance
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Adjust Traced Area</span>
                  <span className="text-primary font-mono">{mapRoofArea} sq ft</span>
                </div>
                <input
                  type="range"
                  min="250"
                  max="1200"
                  step="10"
                  value={mapRoofArea}
                  onChange={(e) => setMapRoofArea(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRoofMap}
                  className="flex-1 text-xs font-bold"
                >
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Confirm & Sync to Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
