
import joi from 'joi'

export const signUpSchema = {
  body: joi.object({
    userName: joi.string().min(3).max(10).required(),
    email: joi.string().email({ tlds: { allows: ['com', 'net', 'org'] } }).required(),
    password: joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
    gender: joi.string().optional(),
  }).required()

}

export const signInSchema = {
  body: joi.object({
    email: joi.string().email({ tlds: { allows: ['com', 'net', 'org'] } }).required(),
    password: joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
  }).options({ presence: 'required' }).required()

}