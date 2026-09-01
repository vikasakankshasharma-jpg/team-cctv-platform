const fs = require('fs');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('C:/Users/hp/Documents/TEAM Website/secure-easy/.env.production'));

const key_id = env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
const key_secret = env.RAZORPAY_KEY_SECRET;

console.log("key_id:", key_id);
console.log("key_secret:", key_secret ? "Exists" : "Missing");

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function run() {
  try {
    const order = await razorpay.orders.create({
      amount: 10000,
      currency: "INR",
      receipt: "rcpt_test_123"
    });
    console.log("SUCCESS:", order);
  } catch (error) {
    console.error("FAIL:", error);
  }
}
run();
