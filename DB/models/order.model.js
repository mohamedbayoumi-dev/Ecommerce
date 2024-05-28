
import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          required: true
        },
        title: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        //     price quantity 
        finalPrice: {
          type: Number,
          required: true
        }
      }
    ],
    subTotal: {
      type: Number,
      required: true,
      default: 0
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    //    After coupon || finalPrice
    paidAmount: {
      type: Number,
      required: true,
      default: 0                      // نسبة الخصم 
    },
    address: {
      type: String,
      required: true
    },
    phoneNumbers: [
      {
        type: String,
        required: true
      }
    ],
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'placed',
        'preparation',
        'on way',
        'delivered',
        'canceled'
      ]
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String
    }

  },
  {
    timestamps: true
  }
)

export const orderModel = model('Order', orderSchema)