# Payment Flow - Visual Guide

## Complete Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER PLACES ORDER                         │
│                  (Selects Online Payment)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              useOrderSubmission.ts (Frontend)                    │
│  • Creates order in database                                     │
│  • Status: pending_payment                                       │
│  • Payment Status: pending                                       │
│  • NO EMAILS SENT (skipped for online payment)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              payment-form.php (Backend)                          │
│  • Receives order data                                           │
│  • Contacts SSLCommerz API                                       │
│  • Gets payment gateway URL                                      │
│  • Configures callback URLs:                                     │
│    - success_url: payment-success.php                           │
│    - fail_url: payment-fail.php                                 │
│    - cancel_url: payment-cancel.php                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SSLCommerz Payment Gateway                      │
│              (Customer enters payment details)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │   SUCCESS      │       │  FAIL/CANCEL   │
        └───────┬────────┘       └───────┬────────┘
                │                         │
                │                         │
    ┌───────────▼──────────┐   ┌─────────▼──────────────┐
    │ payment-success.php  │   │  payment-fail.php      │
    │                      │   │  payment-cancel.php    │
    └──────────────────────┘   └────────────────────────┘
```

## Scenario 1: SUCCESSFUL PAYMENT ✅

```
payment-success.php
    │
    ├─► Validate transaction ID (UUID format)
    │
    ├─► Check payment status parameter
    │   └─► If NOT "VALID" or "VALIDATED" → Redirect to fail page
    │
    ├─► Fetch order from database
    │
    ├─► Check if already processed
    │   └─► If yes → Skip processing, redirect to thank-you
    │
    ├─► Update order status
    │   ├─► order_status: "processing"
    │   └─► payment_status: "completed"
    │
    ├─► Deduct stock
    │   ├─► Product stock (by color)
    │   └─► Accessories stock
    │
    ├─► Send customer email ✅
    │   └─► "Payment Confirmed - Order #XXX"
    │
    ├─► Send admin email ✅
    │   └─► "Payment Received - Order #XXX"
    │
    ├─► Create Steadfast parcel
    │   └─► COD amount = 0 (already paid)
    │
    └─► Redirect to thank-you page
        └─► URL: /thank-you?orderId=XXX&totalAmount=XXX&paymentMethod=online
```

## Scenario 2: FAILED PAYMENT ❌

```
payment-fail.php
    │
    ├─► Validate transaction ID (UUID format)
    │
    ├─► Fetch order from database
    │
    ├─► Update order status
    │   ├─► order_status: "failed"
    │   └─► payment_status: "failed"
    │
    ├─► Log failure
    │   └─► "Payment failed for order: XXX"
    │
    ├─► NO EMAILS SENT ✅
    │
    ├─► NO STOCK DEDUCTED ✅
    │
    └─► Redirect to payment-failed page
        └─► URL: /payment-failed?tran_id=XXX
```

## Scenario 3: CANCELLED PAYMENT ❌

```
payment-cancel.php
    │
    ├─► Validate transaction ID (UUID format)
    │
    ├─► Fetch order from database
    │
    ├─► Update order status
    │   ├─► order_status: "cancelled"
    │   └─► payment_status: "cancelled"
    │
    ├─► Log cancellation
    │   └─► "Payment cancelled for order: XXX"
    │
    ├─► NO EMAILS SENT ✅
    │
    ├─► NO STOCK DEDUCTED ✅
    │
    └─► Redirect to home page
        └─► URL: /
```

## Order Status Flow

```
┌──────────────────┐
│  Order Created   │
│  Status: pending_payment
│  Payment: pending
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│SUCCESS │  │FAIL/CANCEL│
└───┬────┘  └────┬─────┘
    │            │
    ▼            ▼
┌────────────┐  ┌──────────────┐
│processing  │  │failed/       │
│completed   │  │cancelled     │
│✅ Emails   │  │❌ No Emails  │
│✅ Stock ↓  │  │❌ No Stock ↓ │
└────────────┘  └──────────────┘
```

## Email Sending Logic

### COD Orders (Cash on Delivery)
```
Order Created → Emails Sent Immediately
    ├─► Customer Email: "Order Confirmation"
    └─► Admin Email: "New Order Alert"
```

### Online Payment Orders
```
Order Created → NO EMAILS
    │
    ├─► Payment Success → EMAILS SENT ✅
    │   ├─► Customer Email: "Payment Confirmed"
    │   └─► Admin Email: "Payment Received"
    │
    └─► Payment Fail/Cancel → NO EMAILS ✅
```

## Key Security Features

1. **UUID Validation**
   - Ensures transaction ID is valid UUID format
   - Prevents injection attacks

2. **Status Verification**
   - Checks SSLCommerz status parameter
   - Only processes "VALID" or "VALIDATED" payments

3. **Idempotency Check**
   - Prevents duplicate processing
   - Checks if order already has status "processing/completed"

4. **Input Sanitization**
   - All inputs filtered and validated
   - SQL injection prevention

5. **Proper Error Logging**
   - All actions logged for audit trail
   - Easy debugging and monitoring

## Database Schema (Relevant Fields)

```sql
orders table:
├─ id (UUID) - Primary key, used as transaction ID
├─ order_id (String) - Human-readable order number
├─ order_status (String) - pending_payment | processing | failed | cancelled
├─ payment_status (String) - pending | completed | failed | cancelled
├─ payment_method (String) - cod | online
├─ customer_email (String)
├─ customer_name (String)
├─ total_amount (Float)
└─ created_at (Timestamp)
```

## Troubleshooting Guide

### Issue: Emails sent on failed payment
**Check:**
1. Is payment-fail.php being called?
2. Check error logs for "Payment Failed Callback"
3. Verify fail_url in payment gateway config

### Issue: Order status not updating
**Check:**
1. Supabase API key configured correctly
2. Check error logs for API response codes
3. Verify database permissions

### Issue: Stock deducted on failed payment
**Check:**
1. Verify payment-fail.php doesn't have stock deduction code
2. Check if payment-success.php is being called incorrectly
3. Review SSLCommerz callback URLs

## Testing Commands

```bash
# Check recent orders
curl -X GET "https://ximpul.com/api/orders?limit=10"

# Monitor logs in real-time
tail -f /var/log/php-error.log | grep "Payment"

# Test payment-fail.php directly (should redirect)
curl -I "https://ximpul.com/payment-fail.php?tran_id=test-uuid"
```
