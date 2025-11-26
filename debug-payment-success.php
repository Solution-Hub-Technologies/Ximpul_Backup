<?php
// Debug version of payment-success.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DEBUG: Payment Success Processing ===\n\n";

// Sanitize and validate inputs
$tran_id = filter_input(INPUT_GET, 'tran_id', FILTER_SANITIZE_STRING) ?? 'aaea0b85-c75f-485f-a654-f2caa8014e95';
$amount = filter_input(INPUT_GET, 'amount', FILTER_VALIDATE_FLOAT) ?? 10;

echo "Step 1: Input validation\n";
echo "- tran_id: $tran_id\n";
echo "- amount: $amount\n\n";

// Validate UUID format
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tran_id)) {
    die("ERROR: Invalid UUID format\n");
}

echo "Step 2: Loading config\n";
$config = require __DIR__ . '/public/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];
echo "- Supabase URL: $supabaseUrl\n";
echo "- API Key: " . substr($apiKey, 0, 20) . "...\n\n";

echo "Step 3: Getting SSL config\n";
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
    die("ERROR: SSL config not found\n");
}

$sslConfig = $sslConfigs[0];
echo "- SSL Config loaded\n\n";

echo "Step 4: Verifying payment with SSLCommerz\n";
$validation_url = $sslConfig['is_live'] 
    ? "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

$validation_data = [
    'tran_id' => $tran_id,
    'store_id' => $sslConfig['store_id'],
    'store_passwd' => $sslConfig['store_password'],
    'format' => 'json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $validation_url . '?' . http_build_query($validation_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$fallback_response = curl_exec($ch);
curl_close($ch);

$fallback_result = json_decode($fallback_response, true);
echo "- Transactions found: " . ($fallback_result['no_of_trans_found'] ?? 0) . "\n";

$validTransaction = null;
if ($fallback_result && isset($fallback_result['element'])) {
    foreach ($fallback_result['element'] as $trans) {
        if ($trans['status'] === 'VALID' || $trans['status'] === 'VALIDATED') {
            $validTransaction = $trans;
            echo "- Found VALID/VALIDATED transaction\n";
            break;
        }
    }
}

if (!$validTransaction) {
    die("ERROR: No valid transaction found\n");
}

$bank_tran_id = $validTransaction['bank_tran_id'] ?? null;
$card_type = $validTransaction['card_type'] ?? null;
$val_id = $validTransaction['val_id'] ?? null;

echo "- Bank Tran ID: $bank_tran_id\n";
echo "- Card Type: $card_type\n\n";

echo "Step 5: Getting order from database\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=*&id=eq.' . urlencode($tran_id));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "- HTTP Code: $httpCode\n";

if ($httpCode !== 200) {
    die("ERROR: Failed to get order\n");
}

$orders = json_decode($response, true);
if (!$orders || count($orders) === 0) {
    die("ERROR: Order not found\n");
}

$order = $orders[0];
echo "- Order ID: " . $order['order_id'] . "\n";
echo "- Current Status: " . $order['order_status'] . "\n";
echo "- Payment Status: " . $order['payment_status'] . "\n\n";

if ($order['payment_status'] === 'completed') {
    echo "✅ Order already completed - redirecting to thank you page\n";
    $redirectUrl = "https://ximpul.com/thank-you?orderId=" . urlencode($order['order_id']) . "&totalAmount=" . urlencode($order['total_amount']) . "&paymentMethod=online";
    echo "Redirect URL: $redirectUrl\n";
    exit;
}

if ($order['order_status'] !== 'pending_payment') {
    die("ERROR: Order status is not pending_payment (current: " . $order['order_status'] . ")\n");
}

echo "Step 6: Updating order status\n";
$updateData = json_encode([
    'order_status' => 'processing',
    'payment_status' => 'completed'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?id=eq.' . urlencode($tran_id));
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $apiKey,
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
    'Prefer: return=representation'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$updateResponse = curl_exec($ch);
$updateCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "- Update HTTP Code: $updateCode\n";
echo "- Update Response: $updateResponse\n\n";

if ($updateCode === 200 || $updateCode === 204) {
    echo "✅ Order updated successfully!\n\n";
    echo "Final redirect URL:\n";
    echo "https://ximpul.com/thank-you?orderId=" . urlencode($order['order_id']) . "&totalAmount=" . urlencode($order['total_amount']) . "&paymentMethod=online\n";
} else {
    echo "❌ Failed to update order\n";
}
?>
