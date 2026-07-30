<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw_input = file_get_contents('php://input');
if (strlen($raw_input) > 4096) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => 'Request too large']);
    exit;
}
$input = json_decode($raw_input, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$customerName = htmlspecialchars($input['customerName'] ?? '', ENT_QUOTES, 'UTF-8');
$customerPhone = preg_replace('/[^0-9+\-\s]/', '', $input['customerPhone'] ?? '');
$customerEmail = filter_var($input['customerEmail'] ?? '', FILTER_VALIDATE_EMAIL);
$customerAddress = htmlspecialchars($input['customerAddress'] ?? '', ENT_QUOTES, 'UTF-8');
$totalAmount = filter_var($input['totalAmount'] ?? 0, FILTER_VALIDATE_FLOAT, ['options' => ['min_range' => 0.01]]);
$orderId = preg_replace('/[^a-zA-Z0-9\-_]/', '', $input['orderId'] ?? '');

// Additional validation
if (!$customerEmail) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

if (!$totalAmount || $totalAmount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid amount']);
    exit;
}

if (empty($customerName) || empty($totalAmount) || empty($orderId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Get SSL configuration from database
try {
    // Read environment variables
    $envFile = __DIR__ . '/../../.env.local';
    $env = [];
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                list($key, $value) = explode('=', $line, 2);
                $env[trim($key)] = trim($value);
            }
        }
    }
    
    $supabaseUrl = $env['VITE_SUPABASE_URL'] ?? '';
    $serviceRoleKey = $env['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    
    // Fetch SSL config from Supabase
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $serviceRoleKey,
                'apikey: ' . $serviceRoleKey
            ]
        ]
    ]);
    
    $response = file_get_contents($supabaseUrl . '/rest/v1/ssl_config?select=*', false, $context);
    $sslConfigs = json_decode($response, true);
    
    if (!empty($sslConfigs) && is_array($sslConfigs)) {
        $sslConfig = $sslConfigs[0];
        $store_id = $sslConfig['store_id'];
        $store_passwd = $sslConfig['store_password'];
        $is_live = $sslConfig['is_live'];
    } else {
        throw new Exception('SSL configuration not found');
    }
} catch (Exception $e) {
    // Read from environment variables
    $store_id = $env['SSLCOMMERZ_STORE_ID'] ?? getenv('SSLCOMMERZ_STORE_ID') ?? '';
    $store_passwd = $env['SSLCOMMERZ_STORE_PASSWORD'] ?? getenv('SSLCOMMERZ_STORE_PASSWORD') ?? '';
    $is_live = ($env['SSLCOMMERZ_IS_LIVE'] ?? getenv('SSLCOMMERZ_IS_LIVE') ?? 'true') !== 'false';
}

// SSLCommerz configuration
$post_data = [
    'store_id' => $store_id,
    'store_passwd' => $store_passwd,
    'total_amount' => $totalAmount,
    'currency' => 'BDT',
    'tran_id' => $orderId,
    'success_url' => "https://ximpul.com/payment-success.php?tran_id={$orderId}&amount={$totalAmount}",
    'fail_url' => "https://ximpul.com/payment-fail.php?tran_id={$orderId}&amount={$totalAmount}",
    'cancel_url' => "https://ximpul.com/payment-cancel.php?tran_id={$orderId}&amount={$totalAmount}",
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
    'ship_state' => 'Dhaka',
    'ship_postcode' => '1000',
    'ship_country' => 'Bangladesh',
    
    'cus_state' => 'Dhaka',
    'cus_postcode' => '1000',
    'shipping_method' => 'Courier',
    'product_name' => 'Ximpul Flow Water Bottle',
    'product_category' => 'Physical',
    'product_profile' => 'physical-goods'
];

# REQUEST SEND TO SSLCOMMERZ
// Use correct SSL endpoint based on live/sandbox mode
$direct_api_url = $is_live 
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

$handle = curl_init();
curl_setopt($handle, CURLOPT_URL, $direct_api_url);
curl_setopt($handle, CURLOPT_TIMEOUT, 30);
curl_setopt($handle, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($handle, CURLOPT_POST, 1);
curl_setopt($handle, CURLOPT_POSTFIELDS, $post_data);
curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, TRUE);
curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 2);

$content = curl_exec($handle);
$code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

if ($code == 200 && !curl_errno($handle)) {
    curl_close($handle);
    $sslcommerzResponse = $content;
} else {
    curl_close($handle);
    echo json_encode(['success' => false, 'error' => 'Payment gateway temporarily unavailable']);
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
        'error' => 'Payment gateway temporarily unavailable'
    ]);
}
?>