<?php
// Verify payment for order #100728
require_once __DIR__ . '/public/payment-config.php';

$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

$orderId = '100728';
$orderUuid = 'aaea0b85-c75f-485f-a654-f2caa8014e95';

echo "=== Checking Payment Validation for Order #$orderId ===\n\n";

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
    die("SSL config not found!\n");
}

$sslConfig = $sslConfigs[0];
$store_id = $sslConfig['store_id'];
$store_passwd = $sslConfig['store_password'];
$is_live = $sslConfig['is_live'];

echo "SSL Config:\n";
echo "- Store ID: $store_id\n";
echo "- Is Live: " . ($is_live ? 'Yes' : 'No (Sandbox)') . "\n\n";

// Verify with merchant transaction ID API
$validation_url = $is_live 
    ? "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

echo "Checking with SSLCommerz API...\n";
echo "URL: $validation_url\n\n";

$validation_data = [
    'tran_id' => $orderUuid,
    'store_id' => $store_id,
    'store_passwd' => $store_passwd,
    'format' => 'json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $validation_url . '?' . http_build_query($validation_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Response Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n\n";

$result = json_decode($response, true);

if ($result && isset($result['element']) && count($result['element']) > 0) {
    $transaction = $result['element'][0];
    
    echo "=== Transaction Details ===\n";
    echo "Status: " . ($transaction['status'] ?? 'N/A') . "\n";
    echo "Bank Tran ID: " . ($transaction['bank_tran_id'] ?? 'N/A') . "\n";
    echo "Card Type: " . ($transaction['card_type'] ?? 'N/A') . "\n";
    echo "Amount: " . ($transaction['amount'] ?? 'N/A') . "\n";
    echo "Currency: " . ($transaction['currency_amount'] ?? 'N/A') . "\n";
    echo "Validation ID: " . ($transaction['val_id'] ?? 'N/A') . "\n";
    
    if ($transaction['status'] === 'VALID' || $transaction['status'] === 'VALIDATED') {
        echo "\n✅ Payment is VALID!\n";
        echo "\nYou can now process this order.\n";
    } else {
        echo "\n❌ Payment status: " . $transaction['status'] . "\n";
    }
} else {
    echo "❌ No transaction found or payment not completed\n";
    echo "This could mean:\n";
    echo "1. Payment was not completed by customer\n";
    echo "2. Payment failed\n";
    echo "3. Payment is still pending\n";
}
?>
