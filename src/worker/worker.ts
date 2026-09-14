import { Worker } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";
import { db } from "../utils/db";
import { generateMealPlan } from "../modules/job/service";

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`Processing job with ID: ${job.data.id}`);

    const jobId = job.data.id;
    if (!jobId) {
      throw new Error("Job ID is undefined");
    }

    const jobData = await db.orm.public.Job.where((job) => job.id.eq(jobId)).first();
    console.log(`Fetched job data for ID ${jobId}:`, jobData);

    try {
      if (!jobData?.diet || !jobData?.budget) {
        throw new Error(`Job with ID ${jobId} has invalid data`);
      }

      await db.orm.public.Job.where((job) => job.id.eq(jobId)).update({
        status: "PROCESSING",
      });

      const mealPlan = await generateMealPlan(jobData.diet, jobData.budget);

      console.log("Meal plan has been generated successfully");
      console.log(mealPlan);

      const mealsWithId = mealPlan.meals.map((meal) => ({
        jobId: jobData.id,
        ...meal
      }));

      // Replace results and complete the job together, or roll back everything.
      await db.transaction(async (tx) => {
        await tx.orm.public.JobResult
          .where((result) => result.jobId.eq(jobId))
          .delete();
        await tx.orm.public.JobResult.createAll(mealsWithId);
        await tx.orm.public.Job.where((job) => job.id.eq(jobId)).update({
          status: "COMPLETED",
        });
      });
    } catch (error) {
      await db.orm.public.Job.where((job) => job.id.eq(jobId)).update({
        status: "FAILED",
      });

      throw error;
    }
  }, {
  connection: workerConnection,
});