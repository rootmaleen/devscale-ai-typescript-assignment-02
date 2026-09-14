import { Worker } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";
import { db } from "../utils/db";
import { generateDestinationList } from "../modules/job/service";

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

    if (!jobData?.destination || !jobData?.budget) {
      throw new Error(`Job with ID ${jobId} has invalid data`);
    }

    const destinationList = await generateDestinationList(jobData.destination, jobData.budget);

    //save to DB
    console.log("Destination has been generated successfully");
    console.log(destinationList);

    const destinationListWithId = destinationList.destinations.map((destination) => ({
      jobId: jobData.id,
      ...destination
    }));
    await db.orm.public.JobResult.createAll(destinationListWithId);
    await db.orm.public.Job.where((job) => job.id.eq(jobId)).update({
      status: "COMPLETED",
    });
  }, {
  connection: workerConnection,
});