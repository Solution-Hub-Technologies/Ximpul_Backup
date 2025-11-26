<?php
// Direct test of payment validation logic
error_reporting(E_ALL);
ini_set('display_errors', 1);

$orderUuid = 'aaea0b85-c75f-485f-a654-f2caa8014e95';

echo "=== Testing Payment Validation Logic ===\n\n";

// Load config
$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

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
$sslConfig = $sslConfigs[0];
$store_id = $sslConfig['store_id'];
$store_passwd = $sslConfig['store_password'];
$is_live = $sslConfig['is_live'];

// Verify with merchant transaction ID API
$validation_url = $is_live 
    ? "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

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
$fallback_response = curl_exec($ch);
curl_close($ch);

$fallback_result = json_decode($fallback_response, true);

echo "API Response:\n";
print_r($fallback_result);
echo "\n\n";

// Test the new logic
if ($fallback_result && isset($fallback_result['element']) && count($fallback_result['element']) > 0) {
    echo "Found " . count($fallback_result['element']) . " transactions\n\n";
    
    $validTransaction = null;
    
    // Loop through all transactions
    foreach ($fallback_result['element'] as $index => $trans) {
        echo "Transaction #" . ($index + 1) . ":\n";
        echo "  Status: " . $trans['status'] . "\n";
        echo "  Bank Tran ID: " . ($trans['bank_tran_id'] ?? 'N/A') . "\n";
        echo "  Card Type: " . ($trans['card_type'] ?? 'N/A') . "\n";
        echo "  Val ID: " . ($trans['val_id'] ?? 'N/A') . "\n\n";
        
        if ($trans['status'] === 'VALID' || $trans['status'] === 'VALIDATED') {
            $validTransaction = $trans;
            echo "  ✅ This transaction is VALID/VALIDATED!\n\n";
            break;
        }
    }
    
    if ($validTransaction) {
        echo "=== RESULT: Payment is VALID ===\n";
        echo "Bank Tran ID: " . ($validTransaction['bank_tran_id'] ?? 'N/A') . "\n";
        echo "Card Type: " . ($validTransaction['card_type'] ?? 'N/A') . "\n";
        echo "Val ID: " . ($validTransaction['val_id'] ?? 'N/A') . "\n";
    } else {
        echo "=== RESULT: No valid transaction found ===\n";
    }
} else {
    echo "No transactions found\n";
}
?>
