<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    if (strlen($raw_input) > 4096) {
        http_response_code(413);
        echo json_encode(['success' => false, 'error' => 'Request too large']);
        exit;
    }
    $input = json_decode($raw_input, true);
    
    if (!$input || !isset($input['orderId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid order data']);
        exit;
    }
    
    // Sanitize and validate input data
    $data = [
        'order_id' => preg_replace('/[^a-zA-Z0-9\-_]/', '', $input['orderId'] ?? ''),
        'customer_name' => htmlspecialchars($input['customerName'] ?? '', ENT_QUOTES, 'UTF-8'),
        'customer_email' => filter_var($input['customerEmail'] ?? '', FILTER_VALIDATE_EMAIL),
        'customer_phone' => preg_replace('/[^0-9+\-\s]/', '', $input['customerPhone'] ?? ''),
        'customer_address' => htmlspecialchars($input['customerAddress'] ?? '', ENT_QUOTES, 'UTF-8'),
        'selected_edition' => htmlspecialchars($input['selectedEdition'] ?? '', ENT_QUOTES, 'UTF-8'),
        'selected_color' => htmlspecialchars($input['selectedColor'] ?? '', ENT_QUOTES, 'UTF-8'),
        'engraving_text' => htmlspecialchars($input['engravingText'] ?? '', ENT_QUOTES, 'UTF-8'),
        'total_amount' => filter_var($input['totalAmount'] ?? 0, FILTER_VALIDATE_FLOAT),
        'payment_method' => htmlspecialchars($input['paymentMethod'] ?? '', ENT_QUOTES, 'UTF-8')
    ];
    
    if (!$data['customer_email'] || !$data['total_amount']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input data']);
        exit;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/send-order-emails');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false || $httpCode !== 200) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Email service unavailable']);
    } else {
        echo $response;
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>