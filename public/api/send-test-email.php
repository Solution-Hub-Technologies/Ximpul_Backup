<?php
require_once __DIR__ . '/../../smtp_test/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

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
$from = $input['from'] ?? '';
$fromName = $input['fromName'] ?? '';
$to = $input['to'] ?? '';
$subject = $input['subject'] ?? '';
$message = $input['message'] ?? '';

if (empty($host) || empty($user) || empty($pass) || empty($to)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$mail = new PHPMailer(true);

try {
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