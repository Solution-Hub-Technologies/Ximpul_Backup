# Payment Fix - Deployment Checklist

## Pre-Deployment

- [ ] Backup current live files:
  - [ ] `public/payment/create-payment.php`
  - [ ] `public/payment-form.php`
  - [ ] `public/payment-success.php`
  - [ ] Database backup (orders table)

## Files to Upload

### New Files (CREATE)
- [ ] `public/payment-fail.php`
- [ ] `public/payment-cancel.php`

### Updated Files (REPLACE)
- [ ] `public/payment/create-payment.php`
- [ ] `public/payment-form.php`
- [ ] `public/payment-success.php`

## Post-Deployment Verification

### 1. File Permissions
```bash
chmod 644 public/payment-fail.php
chmod 644 public/payment-cancel.php
chmod 644 public/payment/create-payment.php
chmod 644 public/payment-form.php
chmod 644 public/payment-success.php
```

### 2. Test URLs (Direct Access)
- [ ] https://ximpul.com/payment-fail.php (should redirect)
- [ ] https://ximpul.com/payment-cancel.php (should redirect)
- [ ] https://ximpul.com/payment-success.php (should redirect)

### 3. Test Payment Flows

#### Test 1: Successful Payment
1. [ ] Place order with online payment
2. [ ] Complete payment successfully
3. [ ] Verify order status = `processing`
4. [ ] Verify payment status = `completed`
5. [ ] **Verify customer email received** ✅
6. [ ] **Verify admin email received** ✅
7. [ ] Verify stock deducted
8. [ ] Verify redirect to thank-you page

#### Test 2: Failed Payment
1. [ ] Place order with online payment
2. [ ] Let payment fail (use test card that fails)
3. [ ] Verify order status = `failed`
4. [ ] Verify payment status = `failed`
5. [ ] **Verify NO customer email sent** ✅
6. [ ] **Verify NO admin email sent** ✅
7. [ ] Verify NO stock deducted
8. [ ] Verify redirect to payment-failed page

#### Test 3: Cancelled Payment
1. [ ] Place order with online payment
2. [ ] Cancel payment on gateway page
3. [ ] Verify order status = `cancelled`
4. [ ] Verify payment status = `cancelled`
5. [ ] **Verify NO customer email sent** ✅
6. [ ] **Verify NO admin email sent** ✅
7. [ ] Verify NO stock deducted
8. [ ] Verify redirect to home page

### 4. Monitor Error Logs
```bash
# Check PHP error logs
tail -f /path/to/php-error.log

# Look for these log entries:
# - "Payment Success Callback"
# - "Payment Failed Callback"
# - "Payment Cancelled Callback"
# - "Order status updated to failed"
# - "Order status updated to cancelled"
```

### 5. Database Verification
```sql
-- Check recent orders
SELECT order_id, order_status, payment_status, payment_method, created_at 
FROM orders 
WHERE payment_method = 'online' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for failed/cancelled orders
SELECT order_id, order_status, payment_status, customer_email 
FROM orders 
WHERE order_status IN ('failed', 'cancelled') 
ORDER BY created_at DESC;
```

## Rollback Plan (If Issues Occur)

1. [ ] Restore backed-up files:
   ```bash
   # Restore from backup
   cp backup/payment/create-payment.php public/payment/
   cp backup/payment-form.php public/
   cp backup/payment-success.php public/
   ```

2. [ ] Remove new files:
   ```bash
   rm public/payment-fail.php
   rm public/payment-cancel.php
   ```

3. [ ] Clear any cached files

4. [ ] Notify team of rollback

## Success Criteria

✅ All tests pass
✅ No emails sent for failed/cancelled payments
✅ Emails sent only for successful payments
✅ Order statuses correctly updated
✅ Stock deduction only on success
✅ No errors in logs
✅ Customer experience is smooth

## Support Contact

If issues arise:
- Check error logs first
- Review database order statuses
- Contact development team
- Have transaction IDs ready for debugging

## Notes

- Test in sandbox mode first if possible
- Monitor for at least 24 hours after deployment
- Keep backup files for at least 7 days
- Document any issues encountered
