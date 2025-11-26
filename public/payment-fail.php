<?php
// Disable error display in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Sanitize and validate inputs
$tran_id = filter_input(INPUT_GET, 'tran_id', FILTER_SANITIZE_STRING);
$amount = filter_input(INPUT_GET, 'amount', FILTER_VALIDATE_FLOAT);

// Validate UUID format for tran_id
if ($tran_id && !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tran_id)) {
    error_log("Invalid transaction ID format: $tran_id");
    header("Location: https://ximpul.com/payment-failed");
    exit;
}

if ($tran_id) {
    error_log("Payment Failed Callback - tran_id: $tran_id, amount: " . ($amount ?? 'N/A'));

    // Load Supabase configuration
    $config = require_once __DIR__ . '/payment-config.php';
    $supabaseUrl = $config['url'];
    $apiKey = $config['key'];
    
    if (empty($apiKey) || $apiKey === 'your-service-role-key-here') {
        error_log("Missing or invalid Supabase API key in payment-config.php");
        header("Location: https://ximpul.com/payment-failed");
        exit;
    }
    
    // Get order by UUID
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
    
    error_log("Payment Fail - API Response Code: $httpCode");
    
    if ($httpCode === 200) {
        $orders = json_decode($response, true);
        
        if ($orders && count($orders) > 0) {
            $order = $orders[0];
            error_log("Payment failed for order: " . $order['order_id']);
            error_log("Order remains in pending_payment status (Lead) - customer can retry payment later");
            
            // DO NOT change order status - keep it as pending_payment so it stays in Leads
            // Customer may retry payment later
        }
    }
}

// Redirect to payment failed page
header("Location: https://ximpul.com/payment-failed?tran_id=" . urlencode($tran_id ?? ''));
exit;
?>
