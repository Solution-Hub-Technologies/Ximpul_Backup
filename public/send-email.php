<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['orderId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid order data']);
        exit;
    }
    
    // Call the local email server
    $data = [
        'order_id' => $input['orderId'],
        'customer_name' => $input['customerName'],
        'customer_email' => $input['customerEmail'],
        'customer_phone' => $input['customerPhone'],
        'customer_address' => $input['customerAddress'],
        'selected_edition' => $input['selectedEdition'],
        'selected_color' => $input['selectedColor'],
        'engraving_text' => $input['engravingText'],
        'total_amount' => $input['totalAmount'],
        'payment_method' => $input['paymentMethod']
    ];
    
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