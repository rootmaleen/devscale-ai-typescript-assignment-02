import { Hono } from "hono";
import { db } from "../../utils/db";
import { zValidator } from "@hono/zod-validator";
import { CreateJobSchema } from "./schema";

export const jobRouter = new Hono()
  .get("/", async (c) => {
    // Use a small default page and allow clients to request a different range.
    const { limit: limitParam, offset: offsetParam } = c.req.query();
    const limit = limitParam === undefined ? 10 : Number(limitParam);
    const offset = offsetParam === undefined ? 0 : Number(offsetParam);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
      return c.json({
        message: "Invalid pagination parameters",
        errors: {
          limit: "Limit must be an integer between 1 and 100",
          offset: "Offset must be a non-negative integer",
        },
      }, 400);
    }

    const jobs = await db.orm.public.Job
      .limit(limit)
      .offset(offset)
      .all();

    return c.json({
      message: jobs,
      pagination: { limit, offset },
    });
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
  }).post("/", zValidator("json", CreateJobSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        message: "Invalid job data",
        errors: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      }, 400);
    }
  }), async (c) => {
    const body = c.req.valid("json");

    // Save the job and queue message together so accepted jobs are not lost.
    const newJob = await db.transaction(async (tx) => {
      const job = await tx.orm.public.Job.create({
        diet: body.diet,
        budget: body.budget,
        status: "PENDING"
      });

      await tx.orm.public.OutboxMessage.create({
        jobId: job.id,
        type: "generate-meal-plan",
        payload: JSON.stringify({ id: job.id }),
        status: "PENDING",
      });

      return job;
    });

    return c.json({ job: newJob }, 202);
  })