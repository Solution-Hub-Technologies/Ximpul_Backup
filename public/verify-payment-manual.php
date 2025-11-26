<?php
// Manual payment verification for stuck orders
require_once __DIR__ . '/payment-config.php';

$config = require __DIR__ . '/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

// Get order UUID from command line or GET parameter
$orderUuid = $_GET['order_uuid'] ?? ($argv[1] ?? null);

if (!$orderUuid) {
    die("Usage: php verify-payment-manual.php <order_uuid>\nOr: verify-payment-manual.php?order_uuid=<uuid>\n");
}

echo "Checking order: $orderUuid\n\n";

// Get order details
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=*&id=eq.' . urlencode($orderUuid));
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
    die("Order not found\n");
}

$order = $orders[0];

echo "Order ID: " . $order['order_id'] . "\n";
echo "Status: " . $order['order_status'] . "\n";
echo "Payment Status: " . $order['payment_status'] . "\n";
echo "Amount: " . $order['total_amount'] . " BDT\n\n";

if ($order['payment_status'] === 'completed') {
    die("Payment already completed\n");
}

// Get SSL config
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/ssl_config?select=*&limit=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$sslConfigResponse = curl_exec($ch);
curl_close($ch);

$sslConfigs = json_decode($sslConfigResponse, true);

if (!$sslConfigs || count($sslConfigs) === 0) {
    die("SSL config not found\n");
}

$sslConfig = $sslConfigs[0];
$store_id = $sslConfig['store_id'];
$store_passwd = $sslConfig['store_password'];
$is_live = $sslConfig['is_live'];

// Check with SSLCommerz using session_id (order UUID)
$validation_url = $is_live 
    ? "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

$validation_data = [
    'tran_id' => $orderUuid,
    'store_id' => $store_id,
    'store_passwd' => $store_passwd,
    'format' => 'json'
];

echo "Checking with SSLCommerz...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $validation_url . '?' . http_build_query($validation_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$validation_response = curl_exec($ch);
$validation_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Response Code: $validation_code\n";
echo "Response: $validation_response\n\n";

$validation_result = json_decode($validation_response, true);

// Check if payment is valid (element array format)
if ($validation_result && isset($validation_result['element']) && count($validation_result['element']) > 0) {
    $transaction = $validation_result['element'][0];
    
    if ($transaction['status'] === 'VALID' || $transaction['status'] === 'VALIDATED') {
        echo "✅ PAYMENT IS VALID!\n\n";
        echo "Bank Transaction ID: " . $transaction['bank_tran_id'] . "\n";
        echo "Card Type: " . $transaction['card_type'] . "\n";
        echo "Amount: " . $transaction['amount'] . " BDT\n\n";
    echo "Processing order...\n";
    
    // Update order status
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
    curl_exec($ch);
    curl_close($ch);
    
        echo "✅ Order status updated to processing\n";
        echo "✅ Payment status updated to completed\n";
        echo "\nPlease manually:\n";
        echo "1. Deduct stock from inventory\n";
        echo "2. Send confirmation emails\n";
        echo "3. Create Steadfast parcel\n";
    } else {
        echo "❌ Payment status: " . $transaction['status'] . "\n";
    }
} else {
    echo "❌ Payment NOT valid\n";
    echo "Status: " . ($validation_result['status'] ?? 'Unknown') . "\n";
    echo "\nThis payment was likely cancelled or failed.\n";
}
?>
