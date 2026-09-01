const Razorpay = require('razorpay');

const key_id = "rzp_test_TWrw7dyvDSQhmK";
const key_secret = "cJStuaW4t7SHRUzwIEzpQxQH";

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
    console.log("SUCCESS:", order.id);
  } catch (error) {
    console.error("FAIL:", error);
  }
}
run();
