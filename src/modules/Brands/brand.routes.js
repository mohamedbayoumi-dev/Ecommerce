
import { validationFunction } from '../../middlewares/validation.js';
import { multerFunction } from '../../services/multerCloudinary.js';
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { asyncHandler } from '../../utils/errorHandling.js'
import * as validation from './brand.validationSchemas.js'
import { brandApisRoles } from './brand.endPoints.js';
import { isAuth } from '../../middlewares/auth.js';
import * as bc from './brand.controller.js'
import Router from 'express'
const router = Router()

router.post('/', isAuth(brandApisRoles.CREATE_BRAND), multerFunction(allowedExtensions.Images).single('logo'),
  validationFunction(validation.brandSchema),
  asyncHandler(bc.createBrand)
)

router.patch('/', isAuth(), multerFunction(allowedExtensions.Images).single('logo'),
  validationFunction(validation.updateBrandSchema),
  asyncHandler(bc.updateCategory)
)

router.get('/', asyncHandler(bc.getAllBrands))

router.delete('/', isAuth(), asyncHandler(bc.deletedBrand))

export default router;