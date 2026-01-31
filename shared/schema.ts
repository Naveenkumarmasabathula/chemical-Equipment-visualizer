import { z } from "zod";

export const equipmentSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  equipmentName: z.string(),
  equipmentType: z.string(),
  flowrate: z.number(),
  pressure: z.number(),
  temperature: z.number(),
});

export const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  uploadedAt: z.string(),
  totalCount: z.number(),
  avgFlowrate: z.number(),
  avgPressure: z.number(),
  avgTemperature: z.number(),
  pinned: z.boolean().optional(),
});

export const datasetWithEquipmentSchema = datasetSchema.extend({
  equipment: z.array(equipmentSchema),
});

export const summaryStatsSchema = z.object({
  totalEquipment: z.number(),
  avgFlowrate: z.number(),
  avgPressure: z.number(),
  avgTemperature: z.number(),
  typeDistribution: z.record(z.string(), z.number()),
  flowrateRange: z.object({ min: z.number(), max: z.number() }),
  pressureRange: z.object({ min: z.number(), max: z.number() }),
  temperatureRange: z.object({ min: z.number(), max: z.number() }),
});

export const insertEquipmentSchema = equipmentSchema.omit({ id: true });
export const insertDatasetSchema = datasetSchema.omit({ id: true });

export type Equipment = z.infer<typeof equipmentSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type DatasetWithEquipment = z.infer<typeof datasetWithEquipmentSchema>;
export type SummaryStats = z.infer<typeof summaryStatsSchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export const users = null;
export type User = { id: string; username: string; password: string };
export type InsertUser = { username: string; password: string };
