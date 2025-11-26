<?php
// Check pending payment orders
require_once __DIR__ . '/public/payment-config.php';

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

// Get all online orders with pending payment
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=order_id,order_status,payment_status,payment_method,created_at&payment_method=eq.online&payment_status=eq.pending&order=created_at.desc&limit=20');
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
    
    echo "=== Pending Online Payment Orders ===\n\n";
    echo "Total: " . count($orders) . " orders\n\n";
    
    if (count($orders) > 0) {
        foreach ($orders as $order) {
            echo "Order ID: " . $order['order_id'] . "\n";
            echo "Status: " . $order['order_status'] . "\n";
            echo "Payment: " . $order['payment_status'] . "\n";
            echo "Created: " . $order['created_at'] . "\n";
            echo "---\n";
        }
    } else {
        echo "No pending online payment orders found.\n";
    }
} else {
    echo "Error: HTTP $httpCode\n";
    echo "Response: $response\n";
}
?>
