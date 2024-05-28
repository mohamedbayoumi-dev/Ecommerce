
import { validationFunction } from '../../middlewares/validation.js';
import { asyncHandler } from '../../utils/errorHandling.js';
import * as validation from "./order.validationSchemas.js"
import { orderApisRoles } from './order.endPoints.js';
import { isAuth } from '../../middlewares/auth.js';
import * as os from './order.controller.js'
import { Router } from "express";
const router = Router()


router.post('/', isAuth(orderApisRoles.CREATE_ORDER),
  validationFunction(validation.createOrderSchema),
  asyncHandler(os.createOrder)
)

router.post('/orderCart', isAuth(orderApisRoles.CREATE_ORDER), asyncHandler(os.fromCartoOrder))

export default router;