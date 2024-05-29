
import { validationFunction } from '../../middlewares/validation.js';
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { multerFunction } from '../../services/multerCloudinary.js';
import { asyncHandler } from '../../utils/errorHandling.js'
import * as validators from './product.validationSchemas.js'
import { productApisRoles } from './product.endPoints.js';
import { isAuth } from '../../middlewares/auth.js';
import * as pc from './product.controller.js'
import Router from 'express'
const router = Router()


router.post('/', isAuth(productApisRoles.CREATE_PRODUCT), multerFunction(allowedExtensions.Images).array('image', 2),
  validationFunction(validators.addProductSchema),
  asyncHandler(pc.createProduct)
)

router.put('/', isAuth(), multerFunction(allowedExtensions.Images).array('image'),
  validationFunction(validators.updateProductSchema),
  asyncHandler(pc.updateProduct)
)

router.get('/', asyncHandler(pc.getAllProduct))
router.get('/title', asyncHandler(pc.getAllProductsByTitle))
router.get('/', asyncHandler(pc.listProducts))

router.delete('/', isAuth(), asyncHandler(pc.deletedProduct))


export default router;