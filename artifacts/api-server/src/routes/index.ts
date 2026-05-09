import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import resumesRouter from "./resumes";
import applicationsRouter from "./applications";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(resumesRouter);
router.use(applicationsRouter);
router.use(aiRouter);
router.use(dashboardRouter);

export default router;
