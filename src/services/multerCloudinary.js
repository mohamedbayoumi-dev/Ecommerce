
import { allowedExtensions } from '../utils/allowedExtensions.js'
import multer from 'multer'



export const multerFunction = (allowedExtensionsArr) => {

  if (!allowedExtensionsArr) {
    allowedExtensionsArr = allowedExtensions.Images
  }

  // ============== Storage ==================================

  const storage = multer.diskStorage({})

  // ============== file Filter ==============================

  const fileFilter = function (req, file, cb) {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      return cb(null, true)
    }
    cb(new Error('In-valid extension', { cause: 400 }), false)
  }


  const fileUploade = multer({ fileFilter, storage })
  return fileUploade

}