import { v4 as uuidv4 } from "uuid";
import { RooftopPolygonRecord, CalculationResult } from "../models";

export class PreDesignRepository {
  private static polygonStore: RooftopPolygonRecord[] = [];
  private static calculationStore: { id: string; result: CalculationResult; createdAt: string }[] = [];

  public static savePolygon(record: Omit<RooftopPolygonRecord, "id" | "createdAt">): RooftopPolygonRecord {
    const newRecord: RooftopPolygonRecord = {
      id: `PLY-${uuidv4().substring(0, 8)}`,
      ...record,
      createdAt: new Date().toISOString(),
    };
    this.polygonStore.push(newRecord);
    return newRecord;
  }

  public static getPolygonById(id: string): RooftopPolygonRecord | null {
    return this.polygonStore.find((p) => p.id === id) || null;
  }

  public static saveCalculation(result: CalculationResult): { id: string; result: CalculationResult; createdAt: string } {
    const record = {
      id: `DSG-${uuidv4().substring(0, 8)}`,
      result,
      createdAt: new Date().toISOString(),
    };
    this.calculationStore.push(record);
    return record;
  }
}
