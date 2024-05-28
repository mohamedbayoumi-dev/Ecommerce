
import { generateToken, verifyToken } from "../../utils/tokenFunction.js"
import { sendEmailService } from "../../services/sendEmailServices.js"
import cloudinary from "../../utils/cloudinaryConfigrations.js"
import { generateQrcode } from "../../utils/qrCodeFunction.js"
import { emailTemplate } from "../../utils/emailTemplate.js"
import { userModel } from "../../../DB/models/user.model.js"
import { customAlphabet } from "nanoid"
import pkg from 'bcrypt'


const nanoid = customAlphabet('147852369-_/mohamed', 5)

// ===================== signUp ================================================
export const signUp = async (req, res, next) => {

  const { userName, email, password, age, gender, phoneNumber, address } = req.body

  // check userEmail
  const isEmailDuplicate = await userModel.findOne({ email })
  if (isEmailDuplicate) {
    return next(new Error('Email is already exist', { cause: 400 }))
  }

  const token = generateToken(
    {
      payload: { email },
      signature: process.env.CONFIRMATION_EMAIL_TOKEN,
      expiresIn: '1d'
    }
  )

  const confirmationLink = `${req.protocol}://${req.headers.host}/auth/confirm/${token}`

  const isEmailSent = sendEmailService(
    {
      to: email,
      subject: 'Confirmation Email',
      message: emailTemplate(
        {
          link: confirmationLink,
          linkData: "Click here to confirm",
          subject: 'Confirmation Email'
        }
      )
    }
  )

  if (!isEmailSent) {
    return next(new Error('Fail to sent confirmation email', { cause: 400 }))
  }

  const userObject = { userName, email, password, age, gender, phoneNumber, address }

  const user = new userModel(userObject)
  await user.save()
  res.status(201).json({ message: 'Done', user })
}

// ===================== confirmation ==========================================
export const confirmEmail = async (req, res, next) => {

  const { token } = req.params

  const decodedData = verifyToken(
    {
      token,
      signature: process.env.CONFIRMATION_EMAIL_TOKEN,
    }
  )
  if (!decodedData) {
    return next(new Error('token decode fail, invalid token', { cause: 400 }))
  }

  const isConfirmedCheck = await userModel.findOne({ email: decodedData.email })
  if (isConfirmedCheck.isConfirmed) {
    return next(new Error('Your email is already confirmed', { cause: 400 }))
  }

  const user = await userModel.findOneAndUpdate(
    { email: decodedData?.email, isConfirmed: false },
    { isConfirmed: true },
    { new: true, },
  )
  res.status(200).json({ message: 'Confirmed Done please try to login', user })


}

//================================== signIn ====================================
export const signIn = async (req, res, next) => {

  const { email, password } = req.body

  const isUserExists = await userModel.findOne({ email })
  if (!isUserExists) {
    return next(new Error('In-valid login credentails ', { cause: 400 }))
  }

  const passwordMatch = pkg.compareSync(password, isUserExists.password)
  if (!passwordMatch) {
    return next(new Error('In-valid login credentails ', { cause: 400 }))
  }

  const userToken = generateToken(
    {
      payload: {
        email,
        id: isUserExists._id,
        rol: isUserExists.role
      },
      signature: process.env.SIGN_IN_TOKEN_SECRET,
      expiresIn: '1d',
    }
  )

  if (!userToken) {
    return next(new Error('token generation fail, payload canot be empty', { cause: 400 }))
  }

  const user = await userModel.findOneAndUpdate(
    { email },
    { userToken, status: 'Online' },
    { new: true }
  )

  res.status(200).json({ message: 'LoggedIn success', user, userToken })

}

//================================== update User ===============================
export const updateUser = async (req, res, next) => {

  const { _id } = req.authUser
  const { userName } = req.body

  const isUserExists = await userModel.findById(_id)
  if (!isUserExists) {
    return next(new Error('In-valid userId', { cause: 400 }))
  }

  if (isUserExists._id.toString() !== isUserExists.id) {
    return next(new Error('Unauthorized', { cause: 401 }))
  }

  const user = await userModel.findByIdAndUpdate(
    { _id },
    { userName },
    { new: true },
  )
  res.status(200).json({ message: 'Done updated user ', user })

}

//=================================== deleteUser ===============================
export const deleteUser = async (req, res, next) => {

  const { _id } = req.authUser

  const isUserExists = await userModel.findById(_id)
  if (!isUserExists) {
    return next(new Error('In-valid userId', { cause: 400 }))
  }

  const user = await userModel.findByIdAndDelete(
    { _id },
    { new: true },
  )

  res.status(200).json({ message: 'Done deleted user', user })

}

//================================== get User ==================================
export const getAllUser = async (req, res, next) => {

  const { _id } = req.authUser

  const user = await userModel.findById(_id, 'name')
  if (!user) {
    return next(new Error('In-valid userId', { cause: 400 }))
  }

  const qrcode = await generateQrcode({ data: user })
  res.status(200).json({ message: 'Done', user, qrcode })

}

// ============================== profilePicture ===============================
export const profilePicture = async (req, res, next) => {

  const { _id } = req.authUser

  const isUserExists = await userModel.findById(_id)
  if (!isUserExists) {
    return next(new Error('In-valid UserId', { cause: 400 }))
  }

  if (!req.file) {
    return next(new Error('please upload profile picture', { cause: 400 }))
  }

  const customId = nanoid()
  const { secure_url, public_id } = cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Auth/profile/${customId}`
    }
  )

  const user = await userModel.findByIdAndUpdate(
    _id,
    { profile_Picture: { secure_url, public_id } },
    { new: true }
  )

  if (!user) {
    await cloudinary.uploader.destroy(public_id)
    return next(new Error('try agin later', { cause: 400 }))
  }
  res.status(200).json({ message: 'Done Upload', user })

}


// ============================ cover_Picture_Host =============================
export const coverPictures = async (req, res, next) => {

  const { _id } = req.authUser

  const isUserExists = await userModel.findById(_id)
  if (!isUserExists) {
    return next(new Error('In-valid UserId', { cause: 400 }))
  }

  if (!req.files) {
    return next(new Error('please upload profile picture', { cause: 400 }))
  }

  const customId = nanoid()
  const coverImages = []
  for (const key of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      key.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Auth/cover/${customId}`
      }
    )
    coverImages.push({ secure_url, public_id })
  }


  const user = await userModel.findById(_id)
  user.coverPictures.length ? coverImages.push(...user.coverPictures) : coverImages

  const userNew = await userModel.findByIdAndUpdate(
    _id,
    { coverPictures: coverImages },
    { new: true }
  )

  if (!userNew) {
    await cloudinary.uploader.destroy(public_id)
    return next(new Error('try agin later', { cause: 400 }))
  }

  res.status(200).json({ message: 'Done', userNew })

}

// ============================ forget Password ================================
export const forgetPassword = async (req, res, next) => {

  const { email } = req.body

  const isUserExists = await userModel.findOne({ email })
  if (!isUserExists) {
    return next(new Error('In-valid Email', { cause: 400 }))
  }

  const code = nanoid()
  const hashedCode = pkg.hashSync(code, parseInt(process.env.SALT_ROUNDS))
  const token = generateToken(
    {
      payload: {
        email,
        sentCode: hashedCode
      },
      signature: process.env.RESET_TOKEN,
      expiresIn: '1h'
    }
  )

  const resetPasswordLink = `${req.protocol}://${req.headers.host}/auth/reset/${token}`


  const isEmailSent = sendEmailService({
    to: email,
    subject: 'Reset Password',
    message: emailTemplate({
      link: resetPasswordLink,
      linkData: 'Click To Reset Password',
      subject: 'Reset Password Email'
    })
  })

  if (!isEmailSent) {
    return next(new Error('Fail to sent reset password email', { cause: 400 }))
  }


  const userUpdated = await userModel.findOneAndUpdate(
    { email },
    { forgetCode: hashedCode },
    { new: true }
  )

  res.status(200).json({ message: 'Done', userUpdated })

}

// ============================ reset Password ================================
export const resetPassword = async (req, res, next) => {

  const { token } = req.params

  const decodedData = verifyToken(
    {
      token,
      signature: process.env.RESET_TOKEN,
    },
  )

  const user = await userModel.findOne(
    {
      email: decodedData?.email,
      forgetCode: decodedData?.sentCode
    }
  )

  if (!user) {
    return next(new Error('your already reset your password once before, try to login',
      { cause: 400 })
    )
  }

  const { newPassword } = req.body
  user.password = newPassword
  user.forgetCode = null

  const resetPassword = await user.save()
  res.status(200).json({ message: 'Done', resetPassword })

}