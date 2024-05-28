

import { generateToken, verifyToken } from '../utils/tokenFunction.js'
import { userModel } from '../../DB/models/user.model.js'

export const isAuth = (roles) => {
  return async (req, res, next) => {
    try {

      const { authorization } = req.headers

      if (!authorization) {
        return next(new Error('Please login first', { cause: 400 }))
      }

      if (!authorization.startsWith('Saraha')) {
        return next(new Error('invalid token prefix', { cause: 400 }))
      }

      const splitedToken = authorization.split(' ')[1]

      try {

        const decodedData = verifyToken({
          token: splitedToken,
          signature: process.env.SIGN_IN_TOKEN_SECRET
        })

        const findUser = await userModel.findById(decodedData.id, 'email userName role')
        if (!findUser) {
          return next(new Error('Please SignUp', { cause: 400 }))
        }
        
        if (!roles.includes(findUser.role)) {
          return next(
            new Error('Unauthorized to access this api', { cause: 401 }),
          )
        }
        req.authUser = findUser
        next()

      } catch (error) {

        if (error == 'TokenExpiredError: jwt expired') {

          const user = await userModel.findOne({ token: splitedToken })
          if (!user) {
            return next(new Error('wrong Token', { cause: 400 }))
          }

          const userToken = generateToken({
            payload: { email: user.email, id: user._id },
            signature: process.env.SIGN_IN_TOKEN_SECRET,
            expiresIn: '1d'
          })

          if (!userToken) {
            return next(new Error('token generation fail ,payload canot be empty'))
          }

          await userModel.findOneAndUpdate({ token: splitedToken }, { token: userToken })
          return res.status(200).json({ message: 'Token Refreshed', userToken })

        }

        return next(new Error('catch error in token', { cause: 500 }))

      }
    } catch (error) {
      next(new Error('catch error in auth', { cause: 500 }))
    }
  }
}


