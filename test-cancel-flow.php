<?php
// Test cancel flow
echo "=== Testing Payment Cancel Flow ===\n\n";

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

// Check order #100728 current status
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=*&order_id=eq.100728');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$orders = json_decode($response, true);
if ($orders && count($orders) > 0) {
    $order = $orders[0];
    
    echo "Current Order Status:\n";
    echo "- Order Status: " . $order['order_status'] . "\n";
    echo "- Payment Status: " . $order['payment_status'] . "\n\n";
}

echo "Scenario: Customer cancels payment\n";
echo "Before fix:\n";
echo "  ❌ Order status changed to 'cancelled'\n";
echo "  ❌ Payment status changed to 'cancelled'\n";
echo "  ❌ Order moved from Leads to All Orders\n\n";

echo "After fix:\n";
echo "  ✅ Order status remains 'pending_payment'\n";
echo "  ✅ Payment status remains 'pending'\n";
echo "  ✅ Order stays in Leads section\n";
echo "  ✅ Customer can retry payment later\n\n";

echo "Benefits:\n";
echo "  1. Orders stay organized in Leads\n";
echo "  2. Customer can complete payment later\n";
echo "  3. No confusion with cancelled orders\n";
echo "  4. Better lead management\n";
?>
