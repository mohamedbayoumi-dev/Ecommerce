
import { multerFunction } from '../../services/multerCloudinary.js';
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { validationFunction } from '../../middlewares/validation.js';
import { subCategoryApisRoles } from './subCategory.endPoints.js';
import * as validators from './subCategory.validationSchemas.js'
import { asyncHandler } from '../../utils/errorHandling.js'
import { isAuth } from '../../middlewares/auth.js';
import * as sc from './subCategory.controller.js'
import Router from 'express'
const router = Router()


router.post('/:categoryId', isAuth(subCategoryApisRoles.CREATE_SUBCATEGORY), multerFunction(allowedExtensions.Images).single('image'),
  validationFunction(validators.createSubCategory),
  asyncHandler(sc.createSubCategory)
)

router.patch('/',isAuth(), multerFunction(allowedExtensions.Images).single('image'),
  validationFunction(validators.createSubCategory),
  asyncHandler(sc.updateSubCategory)
)

router.get('/', asyncHandler(sc.getAllSubCategories))
router.delete('/',isAuth(), asyncHandler(sc.deletedSubCategory))

export default router;