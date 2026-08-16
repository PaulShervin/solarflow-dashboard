import catalogData from "../data/product_catalog.json";
import faqData from "../data/product_faq.json";
import { GroundingContext, ProductCatalogItem, BatteryCatalogItem, FaqItem } from "../models/chat.types";

export class RetrievalService {
  private static panels: ProductCatalogItem[] = catalogData.panels as ProductCatalogItem[];
  private static batteries: BatteryCatalogItem[] = catalogData.batteries as BatteryCatalogItem[];
  private static pricingTiers = catalogData.pricingTiers;
  private static faqs: FaqItem[] = faqData as FaqItem[];

  public static getCatalog() {
    return {
      panels: this.panels,
      batteries: this.batteries,
      pricingTiers: this.pricingTiers,
      faqs: this.faqs,
    };
  }

  public static retrieveProductContext(query: string): GroundingContext {
    const q = query.toLowerCase().trim();
    const matchedPanels: ProductCatalogItem[] = [];
    const matchedBatteries: BatteryCatalogItem[] = [];
    const matchedFaqs: FaqItem[] = [];

    // 1. Match Panels
    for (const panel of this.panels) {
      if (
        q.includes(panel.brand.toLowerCase()) ||
        q.includes(panel.model.toLowerCase()) ||
        q.includes(`${panel.wattage}w`) ||
        q.includes(`${panel.wattage} watt`) ||
        (q.includes("panel") && (q.includes("best") || q.includes("most efficient") || q.includes("highest")))
      ) {
        matchedPanels.push(panel);
      }
    }

    // If generic "panel" or "what panels" and nothing matched yet, return top panels
    if (matchedPanels.length === 0 && (q.includes("panel") || q.includes("module") || q.includes("hardware"))) {
      matchedPanels.push(this.panels[0], this.panels[1]);
    }

    // 2. Match Batteries
    for (const battery of this.batteries) {
      if (
        q.includes(battery.brand.toLowerCase()) ||
        q.includes(battery.model.toLowerCase()) ||
        q.includes("powerwall") ||
        q.includes("battery") ||
        q.includes("storage") ||
        q.includes("backup") ||
        q.includes("blackout")
      ) {
        matchedBatteries.push(battery);
      }
    }

    // 3. Match FAQs
    for (const faq of this.faqs) {
      const match = faq.keywords.some((keyword) => q.includes(keyword.toLowerCase()));
      if (match) {
        matchedFaqs.push(faq);
      }
    }

    return {
      matchedPanels: matchedPanels.length > 0 ? matchedPanels : undefined,
      matchedBatteries: matchedBatteries.length > 0 ? matchedBatteries : undefined,
      matchedFaqs: matchedFaqs.length > 0 ? matchedFaqs : undefined,
      matchedPricing: q.includes("price") || q.includes("cost") || q.includes("tax credit") || q.includes("tier")
        ? this.pricingTiers
        : undefined,
    };
  }
}
