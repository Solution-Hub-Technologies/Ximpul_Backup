<?php
// Disable error display in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../smtp_test/vendor/autoload.php';

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => true, 'message' => 'SMTP Test endpoint is ready', 'methods' => ['POST']]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Sanitize and validate inputs
$to = filter_input(INPUT_POST, 'to', FILTER_SANITIZE_EMAIL);
$cc = filter_input(INPUT_POST, 'cc', FILTER_SANITIZE_STRING);
$subject = filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING) ?: 'SMTP Test Email';
$message = $_POST['message'] ?? 'This is a test email.';
$from_name = filter_input(INPUT_POST, 'from_name', FILTER_SANITIZE_STRING) ?: 'Ximpul Shop';

// Validate email format
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid recipient email format']);
    exit;
}

if (empty($to)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recipient email is required']);
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'] ?? 'ximpulshop@gmail.com';
    $mail->Password = $_ENV['SMTP_PASS'] ?? 'grnj yivy gcmd dknp';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->SMTPDebug = 0;

    $mail->setFrom('ximpulshop@gmail.com', $from_name);
    $mail->addAddress($to);
    
    // Add CC recipients if provided
    if (!empty($cc)) {
        $ccEmails = explode(',', $cc);
        foreach ($ccEmails as $ccEmail) {
            $ccEmail = trim($ccEmail);
            if (!empty($ccEmail) && filter_var($ccEmail, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($ccEmail);
            }
        }
    }

    $mail->isHTML(true);
    $mail->Subject = $subject;
    
    // Determine if message contains HTML content
    $isHtmlContent = (strpos($message, '<!DOCTYPE html>') !== false || strpos($message, '<html>') !== false);
    
    if ($isHtmlContent) {
        $mail->Body = $message;
        $mail->AltBody = strip_tags($message);
    } else {
        $sanitizedMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $mail->Body = nl2br($sanitizedMessage);
        $mail->AltBody = $sanitizedMessage;
    }

    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully',
        'to' => $to,
        'subject' => $subject,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email: ' . htmlspecialchars($mail->ErrorInfo, ENT_QUOTES, 'UTF-8'),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>