<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Load environment
    $envFile = __DIR__ . '/../.env.local';
    $env = [];
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
    
    // Get SMTP config from database
    $supabase_url = ($env['VITE_SUPABASE_URL'] ?? 'https://ximpul.com/api') . '/rest/v1/smtp_config?is_active=eq.true&select=*';
    $anon_key = $env['VITE_SUPABASE_ANON_KEY'] ?? '';
    $service_key = $env['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'apikey: ' . $anon_key,
                'Authorization: Bearer ' . $service_key,
                'Content-Type: application/json'
            ]
        ]
    ]);
    
    $response = file_get_contents($supabase_url, false, $context);
    $smtp_configs = json_decode($response, true);
    
    if (empty($smtp_configs)) {
        throw new Exception('No SMTP configuration found');
    }
    
    $config = $smtp_configs[0];
    
    // Get POST data
    $to = $_POST['to'] ?? '';
    $cc = $_POST['cc'] ?? '';
    $subject = $_POST['subject'] ?? 'Email from Ximpul';
    $message = $_POST['message'] ?? '';
    $from_name = $_POST['from_name'] ?? 'Ximpul Shop';
    $pdf_base64 = $_POST['pdf_base64'] ?? '';
    $pdf_filename = $_POST['pdf_filename'] ?? 'document.pdf';
    
    // Create PHPMailer instance
    $mail = new PHPMailer(true);
    
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $config['port'];
    $mail->CharSet = 'UTF-8';
    
    // Sender
    $mail->setFrom($config['username'], $from_name);
    
    // Recipients
    $to_emails = array_filter(array_map('trim', explode(',', $to)));
    foreach ($to_emails as $email) {
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $mail->addAddress($email);
        }
    }
    
    // CC
    if (!empty($cc)) {
        $cc_emails = array_filter(array_map('trim', explode(',', $cc)));
        foreach ($cc_emails as $email) {
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($email);
            }
        }
    }
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $message;
    
    // Add PDF attachment if provided
    if (!empty($pdf_base64)) {
        $pdf_data = base64_decode($pdf_base64);
        if ($pdf_data !== false) {
            $mail->addStringAttachment($pdf_data, $pdf_filename, 'base64', 'application/pdf');
        }
    }
    
    // Send
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully with attachment',
        'has_attachment' => !empty($pdf_base64)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
