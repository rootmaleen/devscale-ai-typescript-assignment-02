import z from "zod";
import { generateCompletion } from "@anvia/core";
import { getModel } from "../../llm/models";

const MealSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.string(),
  instructions: z.string(),
});

const MealPlanSchema = z.object({
  meals: z.array(MealSchema),
});

const SYSTEM_INSTRUCTIONS = `You are a meal-planning expert. You will be given a prompt to generate a list of meals. The output should be in JSON format, following the schema provided. Each meal should have a name, description, ingredients, and instructions.`;

export async function generateMealPlan(diet: string, budget: string) {
  console.log(`Generating meal plan for diet: ${diet} and budget: ${budget}`);

  const PROMPT = `Generate a list of 5 meals with name, description, ingredients, and instructions in JSON format. The meals should match the diet of ${diet} and stay within the budget of ${budget}.`;

  const res = await generateCompletion({
    model: getModel(),
    prompt: PROMPT,
    instructions: SYSTEM_INSTRUCTIONS,
    outputSchema: MealPlanSchema,
  })

  console.log("Meal plan generation done!")

  return res.output;
}

