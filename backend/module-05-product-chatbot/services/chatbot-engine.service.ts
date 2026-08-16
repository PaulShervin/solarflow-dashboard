import { ChatRepository } from "../repositories/chat.repository";
import { RetrievalService } from "./retrieval.service";
import { GeminiAiService } from "./gemini-ai.service";
import {
  ChatSession,
  ChatMessage,
  QualificationStep,
  CalculationEstimate,
} from "../models/chat.types";
import { v4 as uuidv4 } from "uuid";

export class ProductChatbotEngine {
  /**
   * Main message handler: Processes incoming user text, determines intent,
   * handles sequential qualification flow, grounds product inquiries, and generates responses.
   */
  public static async processMessage(
    sessionId?: string,
    userText = "",
    leadId?: string
  ): Promise<{ session: ChatSession; botMessage: ChatMessage }> {
    let session = sessionId ? ChatRepository.getSession(sessionId) : undefined;
    if (!session) {
      session = ChatRepository.createSession(leadId);
    }

    const now = new Date().toISOString();
    const cleanText = userText.trim();

    // 1. Log incoming user message
    const userMsg: ChatMessage = {
      id: `MSG-${uuidv4().substring(0, 6)}`,
      sessionId: session.id,
      sender: "user",
      text: cleanText,
      timestamp: now,
    };
    ChatRepository.addMessage(session.id, userMsg);

    // 2. Check for explicit escalation request
    if (this.isEscalationRequest(cleanText)) {
      const escalation = ChatRepository.recordEscalation(
        session.id,
        `Customer requested human contact: "${cleanText}"`
      );
      const botMsg: ChatMessage = {
        id: `MSG-${uuidv4().substring(0, 6)}`,
        sessionId: session.id,
        sender: "bot",
        text: `🤝 Absolutely! I've connected you with our Senior Solar Consultant **${escalation.assignedRep}**.\n\nShe has received your chat details and will reach out to you shortly. You can also continue asking any questions here!`,
        timestamp: new Date().toISOString(),
        cardType: "escalation",
        cardData: {
          repName: escalation.assignedRep,
          phone: "(480) 555-0142",
          email: "d.ruiz@solarflow.io",
          status: "Consultant Assigned",
        },
        quickReplies: ["View Catalog", "Calculate My Roof", "Check Warranty"],
      };
      ChatRepository.addMessage(session.id, botMsg);
      return { session, botMessage: botMsg };
    }

    // 3. Check for open-ended product/catalog query (even mid-qualification)
    const isProductQuestion = this.isProductQuery(cleanText);
    const grounding = RetrievalService.retrieveProductContext(cleanText);

    if (
      isProductQuestion ||
      grounding.matchedFaqs ||
      grounding.matchedPanels ||
      grounding.matchedBatteries
    ) {
      const groundedAnswer = await GeminiAiService.generateGroundedReply(
        cleanText,
        grounding,
        session.messages.map((m) => ({ sender: m.sender, text: m.text }))
      );

      // If qualification is not completed, append prompt to continue
      let continuationPrompt = "";
      let nextReplies: string[] | undefined = undefined;

      if (session.currentStep !== "COMPLETED") {
        const stepInfo = this.getStepPrompt(session.currentStep, session.qualification);
        continuationPrompt = `\n\n---\n*Whenever you're ready to continue your estimate:*\n${stepInfo.prompt}`;
        nextReplies = stepInfo.quickReplies;
      }

      const botMsg: ChatMessage = {
        id: `MSG-${uuidv4().substring(0, 6)}`,
        sessionId: session.id,
        sender: "bot",
        text: `${groundedAnswer}${continuationPrompt}`,
        timestamp: new Date().toISOString(),
        intent: "PRODUCT_INQUIRY",
        grounding,
        quickReplies: nextReplies,
      };

      ChatRepository.addMessage(session.id, botMsg);
      return { session, botMessage: botMsg };
    }

    // 4. Sequential Qualification State Machine
    const { updatedSession, botReply } = this.handleQualificationStep(session, cleanText);
    ChatRepository.saveSession(updatedSession);
    ChatRepository.addMessage(updatedSession.id, botReply);

    return { session: updatedSession, botMessage: botReply };
  }

  /**
   * Evaluates the current qualification step and transitions to the next step
   */
  private static handleQualificationStep(
    session: ChatSession,
    text: string
  ): { updatedSession: ChatSession; botReply: ChatMessage } {
    const t = text.toLowerCase();
    const now = new Date().toISOString();

    switch (session.currentStep) {
      case "HOMEOWNER": {
        const isOwner = !t.includes("rent") && !t.includes("no");
        session.qualification.isHomeowner = isOwner;
        session.currentStep = "BILL";

        const botReply: ChatMessage = {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: session.id,
          sender: "bot",
          text: isOwner
            ? "Awesome! Homeowners get the highest return on investment through federal solar incentives.\n\n**What is your average monthly electricity bill?**"
            : "Thanks for letting me know! For rental or commercial properties, we also offer custom PPA programs.\n\n**What is the average monthly electric bill?**",
          timestamp: now,
          quickReplies: ["$150/mo", "$250/mo", "$350/mo", "$500+/mo"],
        };
        return { updatedSession: session, botReply };
      }

      case "BILL": {
        const numMatch = text.match(/\d+/);
        const bill = numMatch ? parseInt(numMatch[0], 10) : 250;
        session.qualification.monthlyBill = bill;
        session.currentStep = "ROOF_TYPE";

        const botReply: ChatMessage = {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: session.id,
          sender: "bot",
          text: `Got it, about **$${bill}/month** in electric costs.\n\nNext, **what type of roof does your home have?**`,
          timestamp: now,
          quickReplies: ["Asphalt Shingle", "Tile Roof", "Metal Roof", "Flat Roof"],
        };
        return { updatedSession: session, botReply };
      }

      case "ROOF_TYPE": {
        session.qualification.roofType = text;
        session.currentStep = "ROOF_AREA";

        const botReply: ChatMessage = {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: session.id,
          sender: "bot",
          text: `Great, **${text}** works great with our mounting hardware.\n\nDo you know your **roof area**, or would you like to **pin your house on our interactive satellite map**?`,
          timestamp: now,
          cardType: "map_prompt",
          cardData: {
            sessionId: session.id,
            actionUrl: `/tools/rooftop-picker?session_id=${session.id}`,
          },
          quickReplies: [
            "📍 Pin House on Map",
            "I know my area (~450 sq ft)",
            "I know my area (~800 sq ft)",
            "Calculate from bill size",
          ],
        };
        return { updatedSession: session, botReply };
      }

      case "ROOF_AREA": {
        const numMatch = text.match(/\d+/);
        const area = numMatch ? parseInt(numMatch[0], 10) : 550;
        session.qualification.roofAreaSqFt = area;
        session.currentStep = "TIMELINE";

        const botReply: ChatMessage = {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: session.id,
          sender: "bot",
          text: `Recorded **${area} sq ft** of usable roof space.\n\nLast question: **When are you looking to install solar?**`,
          timestamp: now,
          quickReplies: ["Within 1 month", "1-3 months", "3-6 months", "Just researching"],
        };
        return { updatedSession: session, botReply };
      }

      case "TIMELINE":
      case "COMPLETED": {
        session.qualification.timeline = text;
        session.currentStep = "COMPLETED";
        session.status = "QUALIFIED";

        // Compute system sizing and economics
        const estimate = this.calculateEstimate(session.qualification);
        session.estimate = estimate;

        const botReply: ChatMessage = {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: session.id,
          sender: "bot",
          text: `🎉 **Your Solar Estimate is Ready!**\n\nBased on your $${session.qualification.monthlyBill || 250}/mo bill and roof profile, here is your customized pre-design estimate:`,
          timestamp: now,
          cardType: "estimate",
          cardData: estimate,
          quickReplies: [
            "📄 Download PDF Proposal",
            "👤 Talk to an Expert",
            "What panels do you use?",
            "Can I add a battery?",
          ],
        };
        return { updatedSession: session, botReply };
      }
    }
  }

  /**
   * Pre-Design Calculation Formula (Module 2 integration handoff)
   */
  public static calculateEstimate(q: {
    monthlyBill?: number;
    roofAreaSqFt?: number;
    roofType?: string;
  }): CalculationEstimate {
    const monthlyBill = q.monthlyBill || 250;
    const roofArea = q.roofAreaSqFt || 550;

    // Sizing: ~1 kW per $30/month bill
    const targetKw = Math.max(4.0, Math.round((monthlyBill / 28) * 10) / 10);
    const panelWattage = 430; // Maxeon 430W
    const panelCount = Math.ceil((targetKw * 1000) / panelWattage);
    const actualKw = Math.round(((panelCount * panelWattage) / 1000) * 10) / 10;

    const annualProductionKwh = Math.round(actualKw * 1550);
    const grossCost = Math.round(actualKw * 1000 * 2.85);
    const federalTaxCredit = Math.round(grossCost * 0.30);
    const netCost = grossCost - federalTaxCredit;
    const monthlySavings = Math.round(monthlyBill * 0.88);
    const annualSavings = monthlySavings * 12;
    const paybackYears = Math.round((netCost / annualSavings) * 10) / 10;

    return {
      systemSizeKw: actualKw,
      panelModel: "Maxeon 6 Black 430W",
      panelCount,
      annualProductionKwh,
      grossCost,
      federalTaxCredit,
      netCost,
      monthlySavings,
      paybackYears,
      proposalPdfUrl: `/api/proposals/PROP-${uuidv4().substring(0, 6)}/pdf`,
      batteryOption: "Tesla Powerwall 3 (13.5 kWh)",
      batteryCost: 9800,
    };
  }

  /**
   * Ingests roof data from the Map Sub-Window
   */
  public static handleRooftopCapture(
    sessionId: string,
    roofData: { address?: string; roofAreaSqFt: number; polygon?: any }
  ): ChatSession {
    let session = ChatRepository.getSession(sessionId);
    if (!session) {
      session = ChatRepository.createSession();
    }

    session.qualification.roofAreaSqFt = roofData.roofAreaSqFt;
    session.qualification.address = roofData.address;
    ChatRepository.recordRoofData(sessionId, roofData);

    const now = new Date().toISOString();
    const botMsg: ChatMessage = {
      id: `MSG-${uuidv4().substring(0, 6)}`,
      sessionId: session.id,
      sender: "bot",
      text: `📍 **Map Capture Successful!**\n\nIdentified **${roofData.roofAreaSqFt} sq ft** of usable solar roof area${roofData.address ? ` at *${roofData.address}*` : ""
        }.\n\nWhen are you looking to install solar?`,
      timestamp: now,
      quickReplies: ["Within 1 month", "1-3 months", "3-6 months", "Just researching"],
    };

    session.currentStep = "TIMELINE";
    ChatRepository.addMessage(session.id, botMsg);
    ChatRepository.saveSession(session);

    return session;
  }

  private static isEscalationRequest(text: string): boolean {
    const t = text.toLowerCase();
    return (
      t.includes("human") ||
      t.includes("agent") ||
      t.includes("representative") ||
      t.includes("rep") ||
      t.includes("consultant") ||
      t.includes("talk to a person") ||
      t.includes("call me") ||
      t.includes("speak to someone")
    );
  }

  private static isProductQuery(text: string): boolean {
    const t = text.toLowerCase();
    const productKeywords = [
      "panel",
      "battery",
      "powerwall",
      "warranty",
      "cloudy",
      "cost per watt",
      "tax credit",
      "subsidy",
      "payback",
      "maintenance",
      "efficiency",
      "maxeon",
      "rec",
      "q cells",
      "canadian",
      "enphase",
      "how much does",
      "what brand",
      "specs",
    ];
    return productKeywords.some((k) => t.includes(k));
  }

  private static getStepPrompt(
    step: QualificationStep,
    q: any
  ): { prompt: string; quickReplies: string[] } {
    switch (step) {
      case "HOMEOWNER":
        return {
          prompt: "Do you own your home?",
          quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
        };
      case "BILL":
        return {
          prompt: "What is your average monthly electric bill?",
          quickReplies: ["$150/mo", "$250/mo", "$350/mo", "$500+/mo"],
        };
      case "ROOF_TYPE":
        return {
          prompt: "What type of roof does your home have?",
          quickReplies: ["Asphalt Shingle", "Tile Roof", "Metal Roof", "Flat Roof"],
        };
      case "ROOF_AREA":
        return {
          prompt: "What is your roof area, or would you like to pin your house on our satellite map?",
          quickReplies: ["📍 Pin House on Map", "~450 sq ft", "~800 sq ft"],
        };
      case "TIMELINE":
        return {
          prompt: "When are you looking to install solar?",
          quickReplies: ["Within 1 month", "1-3 months", "3-6 months", "Just researching"],
        };
      default:
        return {
          prompt: "Ask any question about our solar panels or pricing!",
          quickReplies: ["What panels do you use?", "How much for a 5kW system?", "Talk to an Expert"],
        };
    }
  }
}
