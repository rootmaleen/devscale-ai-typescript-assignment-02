import z from "zod";

export const CreateJobSchema = z.object({
  diet: z.string().min(1).max(255),
  budget: z.string().min(1).max(255),
});