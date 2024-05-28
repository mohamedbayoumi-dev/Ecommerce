
import { validationFunction } from '../../middlewares/validation.js';
import * as validators from './coupon.validationSchemas.js'
import { asyncHandler } from '../../utils/errorHandling.js'
import { couponApisRoles } from './coupon.endpoints.js';
import { isAuth } from '../../middlewares/auth.js';
import * as cc from './coupon.controller.js'
import { Router } from 'express'
const router = Router()

router.post(
  '/', isAuth(couponApisRoles.CREATE_COUPON), validationFunction(validators.addCouponSchema),
  asyncHandler(cc.createCoupon)
)

router.patch(
  '/', isAuth(couponApisRoles.CREATE_COUPON), validationFunction(validators.updateCouponSchema),
  asyncHandler(cc.updateCoupon)
)


router.delete('/', isAuth(couponApisRoles.CREATE_COUPON), asyncHandler(cc.deleteCoupon))

export default router;