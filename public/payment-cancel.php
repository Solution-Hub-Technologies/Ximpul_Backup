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
    header("Location: https://ximpul.com/");
    exit;
}

if ($tran_id) {
    error_log("Payment Cancelled Callback - tran_id: $tran_id, amount: " . ($amount ?? 'N/A'));

    // Load Supabase configuration
    $config = require_once __DIR__ . '/payment-config.php';
    $supabaseUrl = $config['url'];
    $apiKey = $config['key'];
    
    if (empty($apiKey) || $apiKey === 'your-service-role-key-here') {
        error_log("Missing or invalid Supabase API key in payment-config.php");
        header("Location: https://ximpul.com/");
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
    
    error_log("Payment Cancel - API Response Code: $httpCode");
    
    if ($httpCode === 200) {
        $orders = json_decode($response, true);
        
        if ($orders && count($orders) > 0) {
            $order = $orders[0];
            error_log("Payment cancelled for order: " . $order['order_id']);
            
            // Update order status to cancelled
            $updateData = json_encode([
                'order_status' => 'cancelled',
                'payment_status' => 'cancelled'
            ]);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?id=eq.' . urlencode($tran_id));
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
            
            error_log("Order status updated to cancelled for: " . $order['order_id']);
        }
    }
}

// Redirect to home page
header("Location: https://ximpul.com/");
exit;
?>
