<?php
// Auto-cleanup abandoned online payment orders
// Orders older than 30 minutes in pending_payment status will be marked as cancelled

require_once __DIR__ . '/payment-config.php';

$config = require __DIR__ . '/payment-config.php';
$supabaseUrl = $config['url'];
$apiKey = $config['key'];

// Calculate timestamp for 30 minutes ago
$thirtyMinutesAgo = date('Y-m-d\TH:i:s', strtotime('-30 minutes'));

// Get abandoned orders (pending_payment for more than 30 minutes)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?select=id,order_id,created_at&payment_method=eq.online&payment_status=eq.pending&order_status=eq.pending_payment&created_at=lt.' . urlencode($thirtyMinutesAgo));
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
    
    error_log("🧹 Cleanup: Found " . count($orders) . " abandoned orders");
    
    foreach ($orders as $order) {
        // Update order status to cancelled
        $updateData = json_encode([
            'order_status' => 'cancelled',
            'payment_status' => 'failed'
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/orders?id=eq.' . urlencode($order['id']));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $apiKey,
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $updateResponse = curl_exec($ch);
        $updateCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($updateCode === 200 || $updateCode === 204) {
            error_log("✅ Cancelled abandoned order: " . $order['order_id']);
        } else {
            error_log("❌ Failed to cancel order: " . $order['order_id']);
        }
    }
    
    echo json_encode(['success' => true, 'cancelled' => count($orders)]);
} else {
    error_log("❌ Cleanup failed: HTTP $httpCode");
    echo json_encode(['success' => false, 'error' => 'API error']);
}
?>
