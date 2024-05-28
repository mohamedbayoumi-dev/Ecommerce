
import { couponModel } from '../../DB/models/coupon.model.js';
import { scheduleJob } from 'node-schedule'
import moment from "moment";



export const cronToChangeCouponStatus = () => {
  scheduleJob('* */60 * * * *', async function () {
    const validConpons = await couponModel.find({ couponStatus: 'Valid' })
    for (const coupon of validConpons) {
      if (moment(coupon.toDate).isBefore(moment())) {
        coupon.couponStatus = 'Expired'
      }
      await coupon.save()
    }
    console.log('cron cronToChangeCouponStatus() is running ..........');
  })
}