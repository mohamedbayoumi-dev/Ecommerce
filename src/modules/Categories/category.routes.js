
import { multerFunction } from '../../services/multerCloudinary.js';
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { validationFunction } from '../../middlewares/validation.js';
import * as validators from './category.validationSchemas.js'
import { categoryApisRoles } from './category.endPoints.js';
import { asyncHandler } from '../../utils/errorHandling.js'
import { isAuth } from '../../middlewares/auth.js';
import * as cc from './category.controller.js'
import Router from 'express'
const router = Router()


router.post('/', isAuth(categoryApisRoles.CREATE_CATEGORY), multerFunction(allowedExtensions.Images).single('image'),
  validationFunction(validators.createCategory),
  asyncHandler(cc.createCategory)
)
router.patch('/:categoryId', isAuth(), multerFunction(allowedExtensions.Images).single('image'),
  validationFunction(validators.updateCategory),
  asyncHandler(cc.updateCategory)
)

router.get('/', asyncHandler(cc.getAllCategories))
router.delete('/', isAuth(), asyncHandler(cc.deleteCategory))


export default router;