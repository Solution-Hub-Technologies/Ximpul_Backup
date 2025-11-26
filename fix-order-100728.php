<?php
// Fix order #100728 - manually process the payment
require_once __DIR__ . '/public/payment-config.php';

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

$orderId = '100728';
$orderUuid = 'aaea0b85-c75f-485f-a654-f2caa8014e95';

echo "=== Processing Order #$orderId ===\n\n";

// Get order details
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=*&order_id=eq.' . $orderId);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$orders = json_decode($response, true);

if (!$orders || count($orders) === 0) {
    die("Order not found!\n");
}

$order = $orders[0];

echo "Current Status:\n";
echo "- Order Status: " . $order['order_status'] . "\n";
echo "- Payment Status: " . $order['payment_status'] . "\n\n";

// Update order status to processing and payment to completed
echo "Step 1: Updating order status...\n";
$updateData = json_encode([
    'order_status' => 'processing',
    'payment_status' => 'completed'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?id=eq.' . urlencode($orderUuid));
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$updateResponse = curl_exec($ch);
$updateCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($updateCode === 200 || $updateCode === 204) {
    echo "✅ Order status updated successfully\n\n";
} else {
    die("❌ Failed to update order status: $updateResponse\n");
}

// Deduct stock
echo "Step 2: Deducting stock...\n";
$productUrl = $supabaseUrl . '/products?select=*&edition=eq.' . urlencode($order['selected_edition']);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $productUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$productResponse = curl_exec($ch);
curl_close($ch);

$products = json_decode($productResponse, true);
if ($products && count($products) > 0) {
    $product = $products[0];
    $stockField = $order['selected_color'] === 'obsidian' ? 'stock_black' : 'stock_grey';
    $currentStock = $product[$stockField] ?? 0;
    
    echo "- Current stock ($stockField): $currentStock\n";
    
    if ($currentStock > 0) {
        $newStock = $currentStock - 1;
        $stockUpdateData = json_encode([$stockField => $newStock]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/products?edition=eq.' . urlencode($order['selected_edition']));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $stockUpdateData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
        
        echo "✅ Stock deducted: $currentStock -> $newStock\n\n";
        
        // Log stock change
        $stockLogData = json_encode([
            'item_id' => $product['id'],
            'item_type' => 'product',
            'item_name' => $order['selected_edition'],
            'color' => $order['selected_color'],
            'change_amount' => -1,
            'reason' => 'Manual fix - Payment confirmed for Order #' . $order['order_id'],
            'previous_stock' => $currentStock,
            'new_stock' => $newStock
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/stock_logs');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $stockLogData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }
}

// Send customer email
echo "Step 3: Sending customer email...\n";
$customerEmailHTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order Confirmation</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc"><div style="max-width:600px;margin:0 auto;background-color:#fff"><div style="background:linear-gradient(135deg,#1f2937 0%,#111827 100%);padding:40px 30px;text-align:center"><h1 style="color:#fff;font-size:28px;font-weight:300;margin:0 0 10px 0;letter-spacing:1px">XIMPUL FLOW</h1><p style="color:#d1d5db;font-size:16px;margin:0">Order Confirmation</p></div><div style="padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb"><div style="width:60px;height:60px;background-color:#10b981;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:24px">✓</span></div><h2 style="color:#1f2937;font-size:24px;font-weight:400;margin:0 0 10px 0">Thank You, ' . htmlspecialchars($order['customer_name']) . '!</h2><p style="color:#6b7280;font-size:16px;margin:0">Your order has been confirmed and is being processed.</p></div><div style="padding:30px"><div style="background-color:#f9fafb;border-radius:12px;padding:25px;margin-bottom:30px"><h3 style="color:#1f2937;font-size:18px;font-weight:600;margin:0 0 20px 0;border-bottom:2px solid #e5e7eb;padding-bottom:10px">Order Summary</h3><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#6b7280;font-weight:500">Order ID:</td><td style="padding:8px 0;color:#1f2937;font-weight:700;font-family:monospace">#' . $order['order_id'] . '</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-weight:500">Product:</td><td style="padding:8px 0;color:#1f2937;font-weight:600">' . $order['selected_edition'] . ' Edition</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-weight:500">Color:</td><td style="padding:8px 0;color:#1f2937;font-weight:600">' . $order['selected_color'] . '</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-weight:500">Payment:</td><td style="padding:8px 0;color:#1f2937;font-weight:600">Online Payment</td></tr><tr style="border-top:1px solid #e5e7eb"><td style="padding:12px 0 8px 0;color:#1f2937;font-weight:700;font-size:18px">Total:</td><td style="padding:12px 0 8px 0;color:#1f2937;font-weight:700;font-size:18px">' . $order['total_amount'] . ' BDT</td></tr></table></div><div style="background:linear-gradient(135deg,#1f2937 0%,#374151 100%);border-radius:12px;padding:25px;text-align:center;margin-bottom:30px"><h3 style="color:#fff;font-size:18px;font-weight:600;margin:0 0 15px 0">Track Your Order</h3><p style="color:#d1d5db;margin:0 0 20px 0">Monitor your order status in real-time</p><a href="https://ximpul.com/track-order?orderId=' . $order['order_id'] . '" style="display:inline-block;background-color:#fff;color:#1f2937;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:600">Track Order #' . $order['order_id'] . '</a></div></div></div></body></html>';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://ximpul.com/smtp-mailer.php');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'to' => $order['customer_email'],
    'subject' => 'Payment Confirmed - Order #' . $order['order_id'] . ' | Ximpul Flow',
    'message' => $customerEmailHTML,
    'from_name' => 'Ximpul Shop'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$emailResponse = curl_exec($ch);
curl_close($ch);

echo "✅ Customer email sent\n\n";

echo "=== Order #$orderId Fixed Successfully! ===\n";
echo "Customer can now visit: https://ximpul.com/thank-you?orderId=$orderId&totalAmount=" . $order['total_amount'] . "&paymentMethod=online\n";
?>
