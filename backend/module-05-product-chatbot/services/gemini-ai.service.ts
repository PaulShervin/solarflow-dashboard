import { GroundingContext } from "../models/chat.types";
import { logger } from "../../shared/logger";

export class GeminiAiService {
  /**
   * Generates a grounded response using Gemini API if key is available,
   * otherwise falls back to deterministic factual generation.
   */
  public static async generateGroundedReply(
    userMessage: string,
    grounding: GroundingContext,
    conversationHistory: { sender: string; text: string }[] = []
  ): Promise<string> {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    // 1. If Gemini API Key exists, attempt generative call with strict grounding instructions
    if (apiKey) {
      try {
        const reply = await this.callGeminiApi(apiKey, userMessage, grounding, conversationHistory);
        if (reply) return reply;
      } catch (err: any) {
        logger.warn("Gemini API call failed, using deterministic fallback", err?.message);
      }
    }

    // 2. Deterministic Factual Fallback Engine (RAG-Lite)
    return this.generateDeterministicReply(userMessage, grounding);
  }

  private static async callGeminiApi(
    apiKey: string,
    userMessage: string,
    grounding: GroundingContext,
    history: { sender: string; text: string }[]
  ): Promise<string | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are SolarFlow AI, an expert solar product and qualification assistant.
Grounding Rule: Answer the user's inquiry strictly using the verified catalog and FAQ data provided below. Do not invent prices, wattage, or warranty numbers. If something is unknown, offer to connect them with a human advisor. Keep your response conversational, concise (2-4 sentences), and friendly.

Verified Catalog & FAQ Context:
${JSON.stringify(grounding, null, 2)}
`;

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }],
      },
    ];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }

    return null;
  }

  public static generateDeterministicReply(userMessage: string, grounding: GroundingContext): string {
    const parts: string[] = [];

    // Matched FAQ
    if (grounding.matchedFaqs && grounding.matchedFaqs.length > 0) {
      const topFaq = grounding.matchedFaqs[0];
      parts.push(topFaq.answer);
    }

    // Matched Panels
    if (grounding.matchedPanels && grounding.matchedPanels.length > 0) {
      const p = grounding.matchedPanels[0];
      parts.push(
        `We feature the **${p.brand} ${p.model}** (${p.wattage}W) with ${p.efficiency}% efficiency at approx. $${p.pricePerPanel}/panel, backed by a ${p.warrantyYears}-year warranty. Best suited for: ${p.bestFor}.`
      );
    }

    // Matched Batteries
    if (grounding.matchedBatteries && grounding.matchedBatteries.length > 0) {
      const b = grounding.matchedBatteries[0];
      parts.push(
        `For backup storage, we recommend the **${b.brand} ${b.model}** (${b.capacityKwh} kWh) for approx. $${b.installedCost.toLocaleString()} installed with a ${b.warrantyYears}-year warranty. It offers ${b.backupCapability}.`
      );
    }

    // Matched Pricing
    if (grounding.matchedPricing && parts.length === 0) {
      parts.push(
        `Residential solar typically ranges from $${grounding.matchedPricing.costPerWattStandard.toFixed(2)} to $${grounding.matchedPricing.costPerWattPremium.toFixed(2)} per watt before the 30% Federal Tax Credit. Complete our quick qualification to see your custom monthly savings!`
      );
    }

    if (parts.length > 0) {
      return parts.join("\n\n");
    }

    // Default out-of-scope response with escalation trigger
    return (
      "I'd be glad to help with that! While I check our technical specifications, you can complete our quick 1-minute roof qualification to get an instant cost and savings estimate, or click below to connect directly with a solar specialist."
    );
  }
}
