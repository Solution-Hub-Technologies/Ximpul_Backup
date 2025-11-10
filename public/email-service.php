<?php
// Disable error display in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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

try {
    // Use PHP's built-in mail function with proper headers
    $headers = "From: $from_name <ximpulshop@gmail.com>\r\n";
    $headers .= "Reply-To: ximpulshop@gmail.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Add CC if provided
    if (!empty($cc)) {
        $ccEmails = explode(',', $cc);
        $validCCs = [];
        foreach ($ccEmails as $ccEmail) {
            $ccEmail = trim($ccEmail);
            if (!empty($ccEmail) && filter_var($ccEmail, FILTER_VALIDATE_EMAIL)) {
                $validCCs[] = $ccEmail;
            }
        }
        if (!empty($validCCs)) {
            $headers .= "\r\nCc: " . implode(', ', $validCCs);
        }
    }
    
    // Format message
    $formattedMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    
    $success = mail($to, $subject, $formattedMessage, $headers);
    
    if (!$success) {
        throw new Exception('Mail function failed');
    }
    
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
        'error' => 'Failed to send email: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>