<?php
// Check specific order status
require_once __DIR__ . '/public/payment-config.php';

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

// Check order 100750 and 100751
$orderIds = ['100750', '100751'];

foreach ($orderIds as $orderId) {
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
            echo "=== Order #$orderId ===\n";
            echo "Order Status: " . $order['order_status'] . "\n";
            echo "Payment Status: " . $order['payment_status'] . "\n";
            echo "Payment Method: " . $order['payment_method'] . "\n";
            echo "Tracking Number: " . ($order['tracking_number'] ?? 'N/A') . "\n";
            echo "Created: " . $order['created_at'] . "\n";
            echo "Updated: " . $order['updated_at'] . "\n";
            echo "\n";
        } else {
            echo "Order #$orderId not found\n\n";
        }
    }
}
?>
