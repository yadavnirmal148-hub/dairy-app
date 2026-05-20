const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const QRCode = require("qrcode");
const Order = require("../models/Order");
const Razorpay = require("razorpay");

const UPI_ID = process.env.UPI_ID || "9772874927@ibl";
const MERCHANT = "Gokul Fresh";

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys missing");
  }
  return new Razorpay({ key_id, key_secret });
};

let razorpayOk = null;
async function checkRazorpay() {
  if (razorpayOk !== null) return razorpayOk;
  try {
    const r = getRazorpay();
    await r.orders.create({ amount: 100, currency: "INR", receipt: "health_" + Date.now() });
    razorpayOk = true;
  } catch {
    razorpayOk = false;
  }
  return razorpayOk;
}

router.get("/status", async (req, res) => {
  const configured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const working = configured ? await checkRazorpay() : false;
  res.json({
    upi: true,
    razorpay: { configured, working },
    cod: true,
  });
});

router.get("/upi-info", (req, res) => {
  res.json({ upiId: UPI_ID, merchantName: MERCHANT });
});

router.post("/initiate", auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const txnRef = `GF${Date.now()}`;
    const expiry = Date.now() + 10 * 60 * 1000;
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Gokul Fresh Order")}&tr=${txnRef}`;
    const qrCode = await QRCode.toDataURL(upiLink);

    res.json({
      success: true,
      amount: parseFloat(amount).toFixed(2),
      txnRef,
      upiId: UPI_ID,
      merchantName: MERCHANT,
      upiLink,
      qrCode,
      expiresAt: expiry,
    });
  } catch (err) {
    console.error("Initiate Error:", err);
    res.status(500).json({ message: "Payment initiation failed" });
  }
});

router.post("/confirm", auth, async (req, res) => {
  try {
    const { orderId, txnRef } = req.body;
    if (!orderId || !txnRef) {
      return res.status(400).json({ message: "Order ID and payment reference required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (String(txnRef).startsWith("GF")) {
      const createdTime = parseInt(String(txnRef).replace("GF", ""), 10);
      if (Date.now() - createdTime > 10 * 60 * 1000) {
        return res.status(400).json({ message: "Payment link expired. Please try again." });
      }
      order.paymentMethod = "UPI";
    } else if (String(txnRef).startsWith("COD")) {
      order.paymentMethod = "COD";
    } else {
      order.paymentMethod = "RAZORPAY";
    }

    order.paymentStatus = "paid";
    order.paymentRef = txnRef;
    order.orderStatus = "confirmed";
    await order.save();

    res.json({ success: true, message: "Payment confirmed", order });
  } catch (err) {
    console.error("Confirm Error:", err);
    res.status(500).json({ message: err.message || "Payment confirmation failed" });
  }
});

const createRazorpayOrder = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ message: "Minimum order amount is ₹1" });
    }

    if (!(await checkRazorpay())) {
      return res.status(503).json({
        message: "Online card payment is not available. Please use UPI QR or Cash on Delivery.",
      });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `gf_${Date.now()}`,
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay Error:", err.error || err.message || err);
    res.status(503).json({
      message: "Online payment unavailable. Use UPI QR or Cash on Delivery.",
    });
  }
};

router.post("/create-order", auth, createRazorpayOrder);
router.post("/create_order", auth, createRazorpayOrder);

module.exports = router;
