
import { couponModel } from "../../../DB/models/coupon.model.js"
import { userModel } from "../../../DB/models/user.model.js"

// ========================== create coupon ===================================
export const createCoupon = async (req, res, next) => {

  const {
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponAssginedToUsers,
  } = req.body

  const isCouponCodeDuplicated = await couponModel.findOne({ couponCode })
  if (isCouponCodeDuplicated) {
    return next(new Error('duplicate coupon code', { cause: 400 }))
  }

  if ((!isFixedAmount && !isPercentage) || (isFixedAmount && isPercentage)) {
    return next(
      new Error('please select if teh coupon is percentage or fixedAmount', {
        cause: 400,
      }),
    )
  }
  // const products = await productModel
  //   .find({ price: { $gte: 40000 } })
  //   .select('_id')
  // const couponAssginedToProduct = products

  //======================== assgin to users ==================
  let usersIds = []
  for (const user of couponAssginedToUsers) {
    usersIds.push(user.userId)
  }

  const usersCheck = await userModel.find({
    _id: {
      $in: usersIds,
    },
  })

  if (usersIds.length !== usersCheck.length) {
    return next(new Error('invalid userIds', { cause: 400 }))
  }

  const couponObject = {
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponAssginedToUsers,
    // couponAssginedToProduct,
    createdBy: req.authUser.id,
  }

  const couponDb = await couponModel.create(couponObject)
  if (!couponDb) {
    return next(new Error('Fail to add coupon', { cause: 400 }))
  }
  res.status(201).json({ message: 'Done', couponDb })

}

export const updateCoupon = async (req, res, next) => {

  const { _id } = req.query
  const userId = req.authUser._id
  const { couponCode, couponAmount, isPercentage, isFixedAmount, couponAssginedToUsers,
    fromDate, toDate,
  } = req.body

  const couponCodeName = await couponModel.findOne({ couponCode })
  if (couponCodeName) {
    return next(new Error('duplicate couponCode Name', { cause: 400 }))
  }

  const isCouponCodeDuplicated = await couponModel.findOneAndUpdate(
    {
      _id,
      createdBy: userId,
    },
    {
      couponCode, couponAmount, isPercentage, isFixedAmount, couponAssginedToUsers,
      fromDate, toDate,
    },
    { new: true }
  )

  if (!isCouponCodeDuplicated) {
    return next(new Error('In-valid couponId', { cause: 400 }))
  }

  res.status(200).json({ message: 'updated Done', isCouponCodeDuplicated, couponCodeName })


}

// ================================== delete coupon ==========================
export const deleteCoupon = async (req, res, next) => {

  const { _id } = req.query
  const userId = req.authUser._id
  const isCouponCodeDuplicated = await couponModel.findOneAndDelete(

    { _id, createdBy: userId },
    { new: true }

  )
  if (!isCouponCodeDuplicated) {
    return next(new Error('invalid couponId', { cause: 400 }))
  }
  res.status(201).json({ message: 'deleted Done', isCouponCodeDuplicated })
}



