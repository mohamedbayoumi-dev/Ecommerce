

import joi from "joi";

export const createCategory = {
  body: joi.object({
    name: joi.string().min(5).max(10)
  }).required().options({ presence: 'required' })
}

export const updateCategory = {
  body: joi.object({
    name: joi.string().min(5).max(10).optional()
  }).required()
}