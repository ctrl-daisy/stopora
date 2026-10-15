import { z } from "zod";

export const pointSchema = z.object({
  label: z.string().trim().min(1).max(200),
  lat: z.number().finite().min(4).max(14),
  lng: z.number().finite().min(2.5).max(15),
}).strict();
export const createRunSchema = z.object({
  name: z.string().trim().min(1).max(200),
  vehicleType: z.enum(["motorbike", "car", "van"]).default("motorbike"),
  returnToStart: z.boolean().default(false),
  start: pointSchema,
}).strict();
export const addStopSchema = pointSchema.extend({ address: z.string().trim().max(500).optional() });
export const deliveredSchema = z.object({ delivered: z.boolean() }).strict();
export const idSchema = z.string().cuid();
export const runParamsSchema = z.object({ id: idSchema }).strict();
export const stopParamsSchema = runParamsSchema.extend({ stopId: idSchema });
export const geocodeSchema = z.object({ q: z.string().trim().min(3).max(200) }).strict();
export type CreateRunInput = z.infer<typeof createRunSchema>;
export type AddStopInput = z.infer<typeof addStopSchema>;
