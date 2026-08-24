import { Router, type IRouter } from "express";
import { db, quoteRequestsTable } from "@workspace/db";
import {
  CreateQuoteRequestBody,
  CreateQuoteRequestResponse,
} from "@workspace/api-zod";
import {
  fireEmail,
  sendQuoteConfirmationToClient,
  sendQuoteNotificationToOwner,
} from "../lib/email";

const router: IRouter = Router();

router.post("/quote-requests", async (req, res): Promise<void> => {
  const parsed = CreateQuoteRequestBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid quote request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(quoteRequestsTable)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      service: parsed.data.service,
      message: parsed.data.message,
      marketingConsent: parsed.data.marketingConsent ?? false,
    })
    .returning();

  // Répondre immédiatement — emails en fire-and-forget (n'impactent pas la réponse)
  const quoteData = {
    name: created.name,
    phone: created.phone,
    email: created.email,
    service: created.service,
    message: created.message,
    createdAt: created.createdAt,
  };

  fireEmail(
    () => sendQuoteConfirmationToClient(quoteData),
    "quote-confirmation-client",
  );
  fireEmail(
    () => sendQuoteNotificationToOwner(quoteData),
    "quote-notification-owner",
  );

  res.status(201).json(
    CreateQuoteRequestResponse.parse({
      ...created,
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

export default router;
