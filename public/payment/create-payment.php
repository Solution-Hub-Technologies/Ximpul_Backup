<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$customerName = $input['customerName'] ?? '';
$customerPhone = $input['customerPhone'] ?? '';
$customerEmail = $input['customerEmail'] ?? '';
$customerAddress = $input['customerAddress'] ?? '';
$totalAmount = $input['totalAmount'] ?? 0;
$orderId = $input['orderId'] ?? '';

if (empty($customerName) || empty($totalAmount) || empty($orderId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// SSLCommerz configuration
$post_data = [
    'store_id' => 'sohubshop0live',
    'store_passwd' => '65FAB9002A98896874',
    'total_amount' => $totalAmount,
    'currency' => 'BDT',
    'tran_id' => $orderId,
    'success_url' => "https://ximpul.com/payment-success?tran_id={$orderId}&amount={$totalAmount}",
    'fail_url' => 'https://ximpul.com/payment-failed',
    'cancel_url' => 'https://ximpul.com/',
    'ipn_url' => 'https://ximpul.com/api/ipn',

    'cus_name' => $customerName,
    'cus_email' => $customerEmail,
    'cus_add1' => $customerAddress,
    'cus_phone' => $customerPhone,
    'cus_city' => 'Dhaka',
    'cus_country' => 'Bangladesh',
    'ship_name' => $customerName,
    'ship_add1' => $customerAddress,
    'ship_city' => 'Dhaka',
    'ship_country' => 'Bangladesh',
    'shipping_method' => 'Courier',
    'product_name' => 'Ximpul Flow Water Bottle',
    'product_category' => 'Physical',
    'product_profile' => 'physical-goods'
];

# REQUEST SEND TO SSLCOMMERZ
$direct_api_url = 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

$handle = curl_init();
curl_setopt($handle, CURLOPT_URL, $direct_api_url);
curl_setopt($handle, CURLOPT_TIMEOUT, 30);
curl_setopt($handle, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($handle, CURLOPT_POST, 1);
curl_setopt($handle, CURLOPT_POSTFIELDS, $post_data);
curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, FALSE); # KEEP IT FALSE IF YOU RUN FROM LOCAL PC

$content = curl_exec($handle);
$code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

if ($code == 200 && !curl_errno($handle)) {
    curl_close($handle);
    $sslcommerzResponse = $content;
} else {
    curl_close($handle);
    echo json_encode(['success' => false, 'error' => 'CURL Error: ' . curl_error($handle)]);
    exit;
}

# PARSE THE JSON RESPONSE
$sslcz = json_decode($sslcommerzResponse, true);

if (isset($sslcz['GatewayPageURL']) && $sslcz['GatewayPageURL'] != "") {
    echo json_encode([
        'success' => true,
        'gatewayPageURL' => $sslcz['GatewayPageURL']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to get payment gateway URL',
        'response' => $sslcz
    ]);
}
?>