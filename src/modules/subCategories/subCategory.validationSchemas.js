

import joi from "joi";

export const createSubCategory = {
  body: joi.object({
    name: joi.string().min(5).max(10)
  }).required().options({ presence: 'required' })
}

// export const  = {
//   body: joi.object({
//     name: joi.string().min(5).max(10).optional()
//   }).required()
// }