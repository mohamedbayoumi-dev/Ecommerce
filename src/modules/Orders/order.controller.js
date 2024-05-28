
import { sendEmailService } from "../../services/sendEmailServices.js"
import { productModel } from "../../../DB/models/product.model.js"
import { couponModel } from "../../../DB/models/coupon.model.js"
import { isCouponValid } from "../../utils/couponValidation.js"
import { generateQrcode } from "../../utils/qrCodeFunction.js"
import { orderModel } from "../../../DB/models/order.model.js"
import { generateToken } from "../../utils/tokenFunction.js"
import { cartModel } from "../../../DB/models/cart.model.js"
import { paymentFunction } from "../../utils/payment.js"
import createInvoice from "../../utils/pdfkit.js"
import { nanoid } from "nanoid"

// =========================== created Order ===============================
export const createOrder = async (req, res, next) => {

  const userId = req.authUser._id
  const { productId, quantity, address, phoneNumbers, paymentMethod, couponCode, } = req.body

  // ======================== coupon check =================================
  if (couponCode) {
    const coupon = await couponModel.findOne({ couponCode })
      .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')
    const isCouponValidResult = await isCouponValid(
      {
        couponCode, userId, next,
      }
    )
    if (isCouponValidResult !== true) {
      return next(new Error(isCouponValidResult.message, { cause: 400 }))
    }
    req.coupon = coupon
  }

  // ====================== products check ================================
  const products = []
  const isProductValid = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  })
  if (!isProductValid) {
    return next(
      new Error('invalid product please check your quantity', { cause: 400 }),
    )
  }
  const productObject = {
    productId,
    quantity,
    title: isProductValid.title,
    price: isProductValid.priceAfterDiscount,
    finalPrice: isProductValid.priceAfterDiscount * quantity,
  }
  products.push(productObject)

  //===================== subTotal =======================================
  const subTotal = productObject.finalPrice

  //====================== paid Amount ===================================
  let paidAmount = 0
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount
  } else {
    paidAmount = subTotal
  }

  //======================= paymentMethod  + orderStatus ==================
  let orderStatus
  paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')

  const orderObject = {
    userId,
    products,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  }
  const orderDB = await orderModel.create(orderObject)
  if (!orderDB) {
    return next(new Error('fail to create your order', { cause: 400 }))
  }

  // ======================= payment =========================================
  let orderSession
  if (orderDB.paymentMethod == 'card') {
    
    // if (req.coupon) {
    //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    //   let coupon
    //   if (req.coupon.isPercentage) {
    //     coupon = await stripe.coupons.create({
    //       percent_off: req.coupon.couponAmount,
    //     })
    //   }
    //   if (req.coupon.isFixedAmount) {
    //     coupon = await stripe.coupons.create({
    //       amount_off: req.coupon.couponAmount * 100,
    //       currency: 'EGP',
    //     })
    //   }
    //   req.couponId = coupon.id
    // }

    const tokenOrder = generateToken({
      payload: { orderId: orderDB._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: '1h',
    })

    orderSession = await paymentFunction({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.authUser.email,
      metadata: { orderId: orderDB._id.toString() },
      success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${tokenOrder}`,
      cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${tokenOrder}`,
      line_items: orderDB.products.map((ele) => {
        return {
          price_data: {
            currency: 'EGP',
            product_data: { name: ele.title },
            unit_amount: ele.price * 100,
          },
          quantity: ele.quantity,
        }
      }),
      // discounts: req.couponId ? [{ coupon: req.couponId }] : [],
    })
  }

  // =========================================================================

  // increase usageCount for coupon usage
  if (req.coupon) {
    for (const user of req.coupon.couponAssginedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount += 1
      }
    }
    await req.coupon.save()
  }

  // decrease product's stock by order's product quantity
  await productModel.findOneAndUpdate(
    { _id: productId },
    {
      $inc: { stock: -parseInt(quantity) },
    },
  )

  //TODO: remove product from userCart if exist

  // ========================== create invoice ==================================
  const orderCode = `${req.authUser.userName}_${nanoid(3)}`
  const orderinvoice = {
    shipping: {
      name: req.authUser.userName,
      address: orderDB.address,
      city: 'Cairo',
      state: 'Cairo',
      country: 'Cairo'
    },
    orderCode,
    date: orderDB.createdAt,
    items: orderDB.products,
    subTotal: orderDB.subTotal,
    paidAmount: orderDB.paidAmount
  }

  await createInvoice(orderinvoice, `${orderCode}.pdf`)
  await sendEmailService({
    to: req.authUser.email,
    subject: 'Order Confirmation',
    message: '<h1>Please find your invoice ...... </h1>',
    attachments: [
      {
        path: `./Files/${orderCode}.pdf`
      }
    ]
  })

  // ============================================================================

  const qrCode = await generateQrcode(
    {
      data: { orderId: orderDB._id, products: orderDB.products }
    }
  )


  return res.status(201).json(
    {
      message: 'Done',
      orderDB,
      checkOutURL: orderSession.url,
      // qrCode,
    }
  )

}

// =========================== create order from cart products ====================
export const fromCartoOrder = async (req, res, next) => {
  const userId = req.authUser._id
  const { cartId } = req.query
  const { address, phoneNumbers, paymentMethod, couponCode } = req.body

  const cart = await cartModel.findById(cartId)
  if (!cart || !cart.products.length) {
    return next(new Error('please fill your cart first', { cause: 400 }))
  }

  // ======================== coupon check ================
  if (couponCode) {
    const coupon = await couponModel
      .findOne({ couponCode })
      .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')
    const isCouponValidResult = await isCouponValid({
      couponCode,
      userId,
      next,
    })
    if (isCouponValidResult !== true) {
      return isCouponValidResult
    }
    req.coupon = coupon
  }

  let subTotal = cart.subTotal
  //====================== paid Amount =================
  let paidAmount = 0
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount
  } else {
    paidAmount = subTotal
  }

  //======================= paymentMethod  + orderStatus ==================
  let orderStatus
  paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')
  let orderProduct = []
  for (const product of cart.products) {
    const productExist = await productModel.findById(product.productId)
    orderProduct.push({
      productId: product.productId,
      quantity: product.quantity,
      title: productExist.title,
      price: productExist.priceAfterDiscount,
      finalPrice: productExist.priceAfterDiscount * product.quantity,
    })
  }

  const orderObject = {
    userId,
    products: orderProduct,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  }
  const orderDB = await orderModel.create(orderObject)
  if (!orderDB) {
    return next(new Error('fail to create your order', { cause: 400 }))
  }

  // ============================ payment =============================

  let orderSession
  if (orderDB.paymentMethod == 'card') {
    const token = generateToken({
      payload: { orderId: orderDB._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: '1h'
    })

    orderSession = await paymentFunction({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.authUser.email,
      metadata: { orderId: orderDB._id.toString() },
      success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token={token}`,
      cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token={token}`,
      line_items: orderDB.products.map((ele) => {
        return {
          price_data: {
            currency: 'EGP',
            product_data: {

            }
          }
        }
      })
    })

  }




  // ==================================================================
  // increase usageCount for coupon usage
  if (req.coupon) {
    for (const user of req.coupon.couponAssginedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount += 1
      }
    }
    await req.coupon.save()
  }

  // decrease product's stock by order's product quantity
  for (const product of cart.products) {
    await productModel.findOneAndUpdate(
      { _id: product.productId },
      {
        $inc: { stock: -parseInt(product.quantity) },
      },
    )
  }

  //TODO: remove product from userCart if exist
  cart.products = []
  await cart.save()


  // ========================== create invoice ==================================
  const orderCode = `${req.authUser.userName}_${nanoid(3)}`
  const orderinvoice = {
    shipping: {
      name: req.authUser.userName,
      address: orderDB.address,
      city: 'Cairo',
      state: 'Cairo',
      country: 'Cairo'
    },
    orderCode,
    date: orderDB.createdAt,
    items: orderDB.products,
    subTotal: orderDB.subTotal,
    paidAmount: orderDB.paidAmount
  }

  await createInvoice(orderinvoice, `${orderCode}.pdf`)
  await sendEmailService({
    to: req.authUser.email,
    subject: 'Order Confirmation',
    message: '<h1>Please find your invoice ...... </h1>',
    attachments: [
      {
        path: `./Files/${orderCode}.pdf`
      }
    ]
  })
  // ============================================================================

  return res.status(201).json({ message: 'Done', orderDB, cart })
}
