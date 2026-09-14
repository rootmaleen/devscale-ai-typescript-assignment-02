import z from "zod";

export const CreateJobSchema = z.object({
  diet: z.string().trim().min(1, "Diet is required").max(255, "Diet must be 255 characters or fewer"),
  budget: z.string().trim().min(1, "Budget is required").max(255, "Budget must be 255 characters or fewer"),
});