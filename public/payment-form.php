<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Input validation and sanitization
    $customerName = filter_input(INPUT_POST, 'customerName', FILTER_SANITIZE_STRING);
    $customerPhone = filter_input(INPUT_POST, 'customerPhone', FILTER_SANITIZE_STRING);
    $customerEmail = filter_input(INPUT_POST, 'customerEmail', FILTER_VALIDATE_EMAIL);
    $customerAddress = filter_input(INPUT_POST, 'customerAddress', FILTER_SANITIZE_STRING);
    $totalAmount = filter_input(INPUT_POST, 'totalAmount', FILTER_VALIDATE_FLOAT);
    $orderId = filter_input(INPUT_POST, 'orderId', FILTER_SANITIZE_STRING);
    
    // Error handling for required fields
    $errors = [];
    
    if (empty($customerName)) {
        $errors[] = 'Customer name is required';
    }
    
    if (empty($customerPhone) || !preg_match('/^[0-9+\-\s]+$/', $customerPhone)) {
        $errors[] = 'Valid phone number is required';
    }
    
    if (empty($customerEmail) || $customerEmail === false) {
        $errors[] = 'Valid email address is required';
    }
    
    if (empty($customerAddress)) {
        $errors[] = 'Customer address is required';
    }
    
    if (empty($totalAmount) || $totalAmount <= 0) {
        $errors[] = 'Valid total amount is required';
    }
    
    if (empty($orderId)) {
        $errors[] = 'Order ID is required';
    }
    
    // Return errors if validation fails
    if (!empty($errors)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    // Get SSL configuration from database
    try {
        // Read environment variables
        $envFile = __DIR__ . '/../.env.local';
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
        // Fallback to environment variables if database fetch fails
        $store_id = $env['SSLCOMMERZ_STORE_ID'] ?? 'sohubshop0live';
        $store_passwd = $env['SSLCOMMERZ_STORE_PASSWORD'] ?? '65FAB9002A98896874';
        $is_live = ($env['SSLCOMMERZ_IS_LIVE'] ?? 'true') === 'true';
    }

    $post_data = array();
    $post_data['store_id'] = $store_id;
    $post_data['store_passwd'] = $store_passwd;
    $post_data['total_amount'] = $totalAmount;
    $post_data['currency'] = "BDT";
    $post_data['tran_id'] = $orderId;
    $post_data['success_url'] = "https://ximpul.com/payment-success.php?tran_id=" . $orderId . "&amount=" . $totalAmount;
    $post_data['fail_url'] = "https://ximpul.com/payment-failed";
    $post_data['cancel_url'] = "https://ximpul.com/";

    $post_data['cus_name'] = $customerName;
    $post_data['cus_email'] = $customerEmail;
    $post_data['cus_add1'] = $customerAddress;
    $post_data['cus_phone'] = $customerPhone;
    $post_data['cus_city'] = "Dhaka";
    $post_data['cus_country'] = "Bangladesh";

    $post_data['ship_name'] = $customerName;
    $post_data['ship_add1'] = $customerAddress;
    $post_data['ship_city'] = "Dhaka";
    $post_data['ship_state'] = "Dhaka";
    $post_data['ship_postcode'] = "1000";
    $post_data['ship_country'] = "Bangladesh";
    
    $post_data['cus_state'] = "Dhaka";
    $post_data['cus_postcode'] = "1000";

    $post_data['shipping_method'] = "Courier";
    $post_data['product_name'] = "Ximpul Flow Water Bottle";
    $post_data['product_category'] = "Physical";
    $post_data['product_profile'] = "physical-goods";

    // Use correct SSL endpoint based on live/sandbox mode
    $direct_api_url = $is_live 
        ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php" 
        : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    // Initialize cURL with proper error handling
    $handle = curl_init();
    if ($handle === false) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Payment gateway unavailable']);
        exit;
    }
    
    // Configure cURL options
    $curl_options = [
        CURLOPT_URL => $direct_api_url,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => $post_data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3
    ];
    
    curl_setopt_array($handle, $curl_options);

    $content = curl_exec($handle);
    $curl_error = curl_error($handle);
    $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    curl_close($handle);

    if ($code !== 200 || $content === false || !empty($curl_error)) {
        header("Location: https://ximpul.com/payment-error");
        exit;
    }

    $sslcommerzResponse = $content;

    $sslcz = json_decode($sslcommerzResponse, true);

    if (isset($sslcz['GatewayPageURL']) && $sslcz['GatewayPageURL'] != "") {
        header("Location: " . $sslcz['GatewayPageURL']);
        exit;
    } else {
        // Redirect to error page for any SSL configuration issues
        header("Location: https://ximpul.com/payment-error");
        exit;
    }
}
?>