

import Joi from "joi";

export const brandSchema = {
  body: Joi.object(
    {
      name: Joi.string().min(6).max(20)
    }
  ).required().options({ presence: 'required' })
}

export const updateBrandSchema = {
  body: Joi.object(
    {
      name: Joi.string().min(6).max(20)
    }
  ).required().options({ presence: 'required' })
}