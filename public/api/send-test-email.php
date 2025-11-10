<?php
$autoload_path = realpath(__DIR__ . '/../../smtp_test/vendor/autoload.php');
if (!$autoload_path || !file_exists($autoload_path)) {
    http_response_code(500);
    echo json_encode(['error' => 'Autoload file not found']);
    exit;
}
require_once $autoload_path;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

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
if (strlen($raw_input) > 2048) {
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
$from = filter_var($input['from'] ?? '', FILTER_SANITIZE_EMAIL);
$fromName = htmlspecialchars($input['fromName'] ?? '', ENT_QUOTES, 'UTF-8');
$to = filter_var($input['to'] ?? '', FILTER_VALIDATE_EMAIL);
$subject = htmlspecialchars($input['subject'] ?? '', ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($input['message'] ?? '', ENT_QUOTES, 'UTF-8');

// Validate required fields
if (!$to || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email addresses']);
    exit;
}

// Validate host format
if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && !filter_var($host, FILTER_VALIDATE_IP)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid host format']);
    exit;
}

if (empty($host) || empty($user) || empty($pass) || empty($to)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Allow common email providers and prevent SSRF to private networks
    $allowedHosts = ['smtp.gmail.com', 'smtp.office365.com', 'smtp.yahoo.com', 'smtp.outlook.com', 'mail.smtp2go.com'];
    if (!in_array($host, $allowedHosts)) {
        $ip = gethostbyname($host);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            throw new Exception('Access to private/local networks not allowed');
        }
    }
    
    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $pass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $port;
    $mail->SMTPDebug = 0;

    $mail->setFrom($from, $fromName);
    $mail->addAddress($to);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = nl2br(htmlspecialchars($message));
    $mail->AltBody = $message;

    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Test email sent successfully',
        'to' => $to,
        'subject' => $subject,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to send email: ' . $mail->ErrorInfo,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>