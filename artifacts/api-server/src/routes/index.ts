import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import featuredRouter from "./featured";
import objectsRouter from "./objects";
import realisationsRouter from "./realisations";
import articlesRouter from "./articles";
import testimonialsRouter from "./testimonials";
import contentRouter from "./content";
import trackRouter from "./track";
import adminAuthRouter from "./admin/auth";
import adminRealisationsRouter from "./admin/realisations";
import adminContentRouter from "./admin/contentBlocks";
import adminAnalyticsRouter from "./admin/analytics";
import adminTestimonialsRouter from "./admin/testimonials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(objectsRouter);    // public image serving (no auth)
router.use(featuredRouter);   // must be before realisationsRouter (more specific paths first)
router.use(realisationsRouter);
router.use(articlesRouter);
router.use(testimonialsRouter);
router.use(contentRouter);
router.use(trackRouter);

// Admin routes (auth protected internally)
router.use(adminAuthRouter);
router.use(adminRealisationsRouter);
router.use(adminContentRouter);
router.use(adminAnalyticsRouter);
router.use(adminTestimonialsRouter);

export default router;
