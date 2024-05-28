
import { asyncHandler } from '../../utils/errorHandling.js';
import * as validation from './cart.validationSchemas.js'
import * as Cartcontroller from './cart.controller.js'
import { cartApisRoles } from './cart.endPoints.js';
import { isAuth } from '../../middlewares/auth.js';
import { Router } from "express";
const router = Router()

router.post('/', isAuth(cartApisRoles.CREATE_CART), asyncHandler(Cartcontroller.addToCart))
router.delete('/', isAuth(cartApisRoles.CREATE_CART), asyncHandler(Cartcontroller.deleteFromCart))


export default router