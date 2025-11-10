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

// Validate and sanitize input before forwarding
$sanitized_input = [];
foreach ($input as $key => $value) {
    if (is_string($value)) {
        $sanitized_input[$key] = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    } else {
        $sanitized_input[$key] = $value;
    }
}

// Forward request to localhost:3002
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3002/create-payment');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sanitized_input));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Payment service unavailable']);
} else {
    echo $response;
}
?>