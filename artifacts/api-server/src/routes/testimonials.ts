import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .orderBy(asc(testimonialsTable.id));

  res.json(ListTestimonialsResponse.parse(rows));
});

export default router;
