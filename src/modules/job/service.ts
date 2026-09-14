import z from "zod";
import { generateCompletion } from "@anvia/core";
import { getModel } from "../../llm/models";

const DestinationSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
});

const DestinationListSchema = z.object({
  destinations: z.array(DestinationSchema),
});

const SYSTEM_INSTRUCTIONS = `You are a travel expert. You will be given a prompt to generate a list of travel destinations. The output should be in JSON format, following the schema provided. Each destination should have a name, description, and location.`;

export async function generateDestinationList(destination: string, budget: string) {
  console.log(`Generating destination list for destination: ${destination} and budget: ${budget}`);

  const PROMPT = `Generate a list of 2 travel destinations with name, description, and location in JSON format. The destinations should be related to ${destination} and within the budget of ${budget}.`;

  const res = await generateCompletion({
    model: getModel(),
    prompt: PROMPT,
    instructions: SYSTEM_INSTRUCTIONS,
    outputSchema: DestinationListSchema,
  })

  console.log("Generating done!")

  return res.output;
}

