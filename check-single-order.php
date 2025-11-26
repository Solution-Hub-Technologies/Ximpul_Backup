<?php
// Check specific order
require_once __DIR__ . '/public/payment-config.php';

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

$orderId = $argv[1] ?? '100753';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=*&order_id=eq.' . $orderId);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $orders = json_decode($response, true);
    
    if (count($orders) > 0) {
        $order = $orders[0];
        echo "=== Order #$orderId Details ===\n\n";
        echo "UUID: " . $order['id'] . "\n";
        echo "Order ID: " . $order['order_id'] . "\n";
        echo "Customer: " . $order['customer_name'] . "\n";
        echo "Phone: " . $order['customer_phone'] . "\n";
        echo "Email: " . $order['customer_email'] . "\n";
        echo "\n--- Status ---\n";
        echo "Order Status: " . $order['order_status'] . "\n";
        echo "Payment Status: " . $order['payment_status'] . "\n";
        echo "Payment Method: " . $order['payment_method'] . "\n";
        echo "\n--- Product ---\n";
        echo "Edition: " . $order['selected_edition'] . "\n";
        echo "Color: " . $order['selected_color'] . "\n";
        echo "Amount: " . $order['total_amount'] . " BDT\n";
        echo "\n--- Delivery ---\n";
        echo "Tracking Number: " . ($order['tracking_number'] ?? 'N/A') . "\n";
        echo "Address: " . $order['customer_address'] . "\n";
        echo "\n--- Timestamps ---\n";
        echo "Created: " . $order['created_at'] . "\n";
        echo "Updated: " . $order['updated_at'] . "\n";
    } else {
        echo "Order #$orderId not found\n";
    }
} else {
    echo "Error: HTTP $httpCode\n";
}
?>
