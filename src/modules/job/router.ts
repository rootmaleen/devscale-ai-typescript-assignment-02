import { Hono } from "hono";
import { db } from "../../utils/db";
import { zValidator } from "@hono/zod-validator";
import { CreateJobSchema } from "./schema";
import { queue } from "../../worker/queue";

export const jobRouter = new Hono()
  .get("/", async (c) => {
    // /jobs -> return all jobs
    // app -> ORM -> db
    const jobs = await db.orm.public.Job.all();

    return c.json({ message: jobs });
  }).get("/:id", async (c) => {
    const { id } = c.req.param();

    //filter job result yg id = jobId
    const destinationList = await db.orm.public.JobResult.where((jobResult) => jobResult.jobId.eq(id)).all();

    return c.json({ jobId: id, destinationList });
  }).post("/", zValidator("json", CreateJobSchema), async (c) => {
    const body = c.req.valid("json");
    const newJob = await db.orm.public.Job.create({
      destination: body.destination,
      budget: body.budget,
      status: "PENDING"
    })

    await queue.add("generate-destination-list", newJob);
    return c.json({ job: newJob }, 202);
  })