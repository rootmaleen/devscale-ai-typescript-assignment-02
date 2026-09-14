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

    const job = await db.orm.public.Job.where((job) => job.id.eq(id)).first();
    if (!job) {
      return c.json({ message: "Job not found" }, 404);
    }

    const mealPlan = job.status === "COMPLETED"
      ? await db.orm.public.JobResult.where((jobResult) => jobResult.jobId.eq(id)).all()
      : null;

    return c.json({ jobId: id, status: job.status, mealPlan });
  }).post("/", zValidator("json", CreateJobSchema), async (c) => {
    const body = c.req.valid("json");
    const newJob = await db.orm.public.Job.create({
      diet: body.diet,
      budget: body.budget,
      status: "PENDING"
    })

    await queue.add("generate-meal-plan", newJob);
    return c.json({ job: newJob }, 202);
  })