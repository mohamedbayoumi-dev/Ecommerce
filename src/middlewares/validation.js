
import { Types } from "mongoose"
import Joi from 'joi'


const reqMathods = ['body', 'params', 'headers', 'query', 'file', 'files']

const validationObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value) ? true : helper.message('In-valid Id')
}

export const generalFields = {
  email: Joi.string().email({ tlds: { allow: ['com', 'net', 'org'] } }).required(),
  password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({ 'string.pattern.base': 'Password regex fail', }).required(),
  _id: Joi.string().custom(validationObjectId),
}

export const validationFunction = (schema) => {
  return (req, res, next) => {

    const validationErrorArr = []
    for (const key of reqMathods) {
      if (schema[key]) {
        const validationResult = schema[key].validate(req[key], { abortEarly: false })
        if (validationResult.error) {
          validationErrorArr.push(validationResult.error.details)
        }
      }
    }

    if (validationErrorArr.length) {

      req.validationErrorArr = validationErrorArr
      return next(new Error(validationErrorArr , {cause:400}))
      
    }
    next()

  }
}