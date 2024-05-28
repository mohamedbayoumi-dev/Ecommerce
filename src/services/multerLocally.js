

import { allowedExtensions } from '../utils/allowedExtensions.js'
import { customAlphabet } from 'nanoid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const nanoid = customAlphabet('12348569_=!bayoumi', 5)   // QR code

export const multerFunction = (allowedExtensionsArr, customPath) => {

  if (!allowedExtensionsArr) {
    allowedExtensionsArr = allowedExtensions.Images
  }
  
  // ============== customPath ==============================

  if (!customPath) {
    customPath = 'General'
  }
  
  const destPath = path.resolve(`Uploads/${customPath}`)
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true })
  }

  // ================== Storage ==============================

  const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      cb(null, destPath)
    },
    filename: function (req, file, cb) {
      const uniqueFileName = nanoid() + file.originalname
      cb(null, uniqueFileName)
    }

  })

  // ================== file Filter ==============================

  const fileFilter = function (req, file, cb) {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      return cb(null, true)
    }
    cb(new Error('In-valid extension', { cause: 400 }), false)
  }


  const fileUploade = multer({ fileFilter, storage })
  return fileUploade

}