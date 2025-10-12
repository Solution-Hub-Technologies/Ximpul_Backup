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

    $store_id = 'sohubshop0live';
    $store_passwd = '65FAB9002A98896874';
    $is_live = true;

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
    $post_data['ship_country'] = "Bangladesh";

    $post_data['shipping_method'] = "Courier";
    $post_data['product_name'] = "Ximpul Flow Water Bottle";
    $post_data['product_category'] = "Physical";
    $post_data['product_profile'] = "physical-goods";

    $direct_api_url = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

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
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Payment gateway error']);
        exit;
    }

    $sslcommerzResponse = $content;

    $sslcz = json_decode($sslcommerzResponse, true);

    if (isset($sslcz['GatewayPageURL']) && $sslcz['GatewayPageURL'] != "") {
        header("Location: " . $sslcz['GatewayPageURL']);
        exit;
    } else {
        // Efficient error response without exposing sensitive data
        http_response_code(400);
        header('Content-Type: application/json');
        
        $error_message = 'Payment gateway initialization failed';
        if (isset($sslcz['failedreason'])) {
            $error_message = htmlspecialchars($sslcz['failedreason'], ENT_QUOTES, 'UTF-8');
        }
        
        echo json_encode([
            'success' => false,
            'error' => $error_message
        ]);
        exit;
    }
}
?>