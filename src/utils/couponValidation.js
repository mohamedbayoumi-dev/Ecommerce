
import { couponModel } from '../../DB/models/coupon.model.js'
import moment from 'moment'

export const isCouponValid = async ({ couponCode, userId, next } = {}) => {

  const coupon = await couponModel.findOne({ couponCode })
  if (!coupon) {
    return { message: 'Please enter a valid coupon code' }
  }

  // ============= expiration ===========================
  if (coupon.couponStatus == 'Expired' ||
    moment(new Date(coupon.toDate)).isBefore(moment())) {
    return { message: 'Coupon is expired' }
  }

  // ============= Valid ===========================
  if (coupon.couponStatus == 'Valid' &&
    moment().isBefore(moment(new Date(coupon.fromDate)))) {
    return { message: 'This coupon is not started yet' }
  }


  let notAssginedUsers = []
  let exceedMaxUsage = false

  for (const user of coupon.couponAssginedToUsers) {

    // =========== coupon not assgined to user ===========
    notAssginedUsers.push(user.userId.toString())

    if (userId.toString() == user.userId.toString()) {
      // ============ exceed the max usage =================
      if (user.maxUsage <= user.usageCount) {
        exceedMaxUsage = true
      }
    }

  }

  if (!notAssginedUsers.includes(userId.toString())) {
    return {
      notAssginedUsers: true,
      message: 'this user not assgined for this coupon'
    }
  }

  if (exceedMaxUsage) {
    return {
      exceedMaxUsage: true,
      message: 'exceed the max usage for this coupon'
    }
  }

  return true
  
}
