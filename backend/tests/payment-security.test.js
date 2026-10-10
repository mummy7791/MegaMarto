const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

function sign(orderId, paymentId, secret) {
 return crypto.createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex");
}
function validPayment(payment, expectedPaise) {
 return payment && payment.status === "captured" && payment.currency === "INR" &&
 Number.isSafeInteger(expectedPaise) && Number(payment.amount) === expectedPaise;
}
test("Razorpay signature changes when payment ID is tampered with", () => {
 const expected = sign("order_123","pay_123","test_secret");
 assert.equal(expected, sign("order_123","pay_123","test_secret"));
 assert.notEqual(expected, sign("order_123","pay_456","test_secret"));
});
test("Captured INR payment must match backend amount", () => {
 assert.equal(validPayment({status:"captured",currency:"INR",amount:12345},12345),true);
 assert.equal(validPayment({status:"authorized",currency:"INR",amount:12345},12345),false);
 assert.equal(validPayment({status:"captured",currency:"INR",amount:12344},12345),false);
 assert.equal(validPayment({status:"captured",currency:"USD",amount:12345},12345),false);
});
