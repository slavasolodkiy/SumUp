import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import { authRouter } from "./auth.js";
import { merchantsRouter } from "./merchants.js";
import { onboardingRouter } from "./onboarding.js";
import { paymentsRouter } from "./payments.js";
import { productsRouter } from "./products.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(merchantsRouter);
router.use(onboardingRouter);
router.use(paymentsRouter);
router.use(productsRouter);

export default router;
