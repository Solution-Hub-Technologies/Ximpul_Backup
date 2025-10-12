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
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw_input = file_get_contents('php://input');
if (strlen($raw_input) > 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Request too large']);
    exit;
}
$input = json_decode($raw_input, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$host = filter_var($input['host'] ?? '', FILTER_SANITIZE_STRING);
$port = filter_var($input['port'] ?? 587, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]) ?: 587;
$user = filter_var($input['user'] ?? '', FILTER_SANITIZE_EMAIL);
$pass = $input['pass'] ?? '';

// Validate host format
if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && !filter_var($host, FILTER_VALIDATE_IP)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid host format']);
    exit;
}

if (empty($host) || empty($user) || empty($pass)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required SMTP configuration']);
    exit;
}

try {
    // Allow common email providers and prevent SSRF to private networks
    $allowedHosts = ['smtp.gmail.com', 'smtp.office365.com', 'smtp.yahoo.com', 'smtp.outlook.com', 'mail.smtp2go.com'];
    if (!in_array($host, $allowedHosts)) {
        $ip = gethostbyname($host);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            throw new Exception('Access to private/local networks not allowed');
        }
    }
    
    $socket = @fsockopen($host, $port, $errno, $errstr, 5);
    
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