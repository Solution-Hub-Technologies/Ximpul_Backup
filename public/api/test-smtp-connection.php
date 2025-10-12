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
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$host = $input['host'] ?? '';
$port = $input['port'] ?? 587;
$user = $input['user'] ?? '';
$pass = $input['pass'] ?? '';

if (empty($host) || empty($user) || empty($pass)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required SMTP configuration']);
    exit;
}

try {
    $socket = @fsockopen($host, $port, $errno, $errstr, 10);
    
    if (!$socket) {
        throw new Exception("Cannot connect to $host:$port - $errstr ($errno)");
    }
    
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        throw new Exception("Invalid SMTP response: $response");
    }
    
    fclose($socket);
    
    echo json_encode([
        'success' => true,
        'message' => 'SMTP connection successful',
        'host' => $host,
        'port' => $port,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'SMTP connection failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>