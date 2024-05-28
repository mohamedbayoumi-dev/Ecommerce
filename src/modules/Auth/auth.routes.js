
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { validationFunction } from '../../middlewares/validation.js';
import { multerFunction } from '../../services/multerCloudinary.js';
import { asyncHandler } from '../../utils/errorHandling.js';
import * as validation from './auth.validationSchemas.js'
import { isAuth } from '../../middlewares/auth.js';
import * as uc from './auth.controller.js'
import { Router } from 'express'

const router = Router()

router.post('/', asyncHandler(uc.signUp))
router.get('/confirm/:token', asyncHandler(uc.confirmEmail))
router.post('/login', asyncHandler(uc.signIn))
router.patch('/', asyncHandler(uc.updateUser))
router.delete('/', asyncHandler(uc.deleteUser))
router.get('/', isAuth(), asyncHandler(uc.getAllUser))


router.post('/host', isAuth(),
  multerFunction(allowedExtensions.Images).single('host'),
  asyncHandler(uc.profilePicture),
)

router.post('/cover', isAuth(),
  multerFunction(allowedExtensions.Images).array('cover'),
  asyncHandler(uc.coverPictures),
)


router.post('/forget', asyncHandler(uc.forgetPassword))
router.post('/reset/:token', asyncHandler(uc.resetPassword))

export default router;