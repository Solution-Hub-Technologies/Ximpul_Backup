<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
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

// Validate inputs
$to = $_POST['to'] ?? '';
$cc = $_POST['cc'] ?? '';
$subject = filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING) ?: 'Email from Ximpul';
$message = $_POST['message'] ?? '';
$from_name = filter_input(INPUT_POST, 'from_name', FILTER_SANITIZE_STRING) ?: 'Ximpul Shop';

// Handle file upload
$attachment = '';
$attachment_name = 'attachment.pdf';
if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
    $attachment = base64_encode(file_get_contents($_FILES['pdf_file']['tmp_name']));
    $attachment_name = $_FILES['pdf_file']['name'];
    error_log('PDF file uploaded: ' . $attachment_name . ', size: ' . strlen($attachment));
} else {
    error_log('No PDF file uploaded or upload error');
}

// Parse TO emails (comma separated)
$to_emails = [];
if (!empty($to)) {
    $to_list = explode(',', $to);
    foreach ($to_list as $email) {
        $email = trim($email);
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $to_emails[] = $email;
        }
    }
}

// Parse CC emails (comma separated)
$cc_emails = [];
if (!empty($cc)) {
    $cc_list = explode(',', $cc);
    foreach ($cc_list as $email) {
        $email = trim($email);
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $cc_emails[] = $email;
        }
    }
}

if (empty($to_emails)) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid recipient emails provided']);
    exit;
}

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

try {
    // Load environment variables
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
    
    // Get SMTP configuration from database
    $supabase_url = ($env['VITE_SUPABASE_URL'] ?? 'https://ximpul.com/api') . '/rest/v1/smtp_config?is_active=eq.true&select=*';
    $anon_key = $env['VITE_SUPABASE_ANON_KEY'] ?? '';
    $service_key = $env['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    
    if (empty($anon_key) || empty($service_key)) {
        throw new Exception('Supabase keys not found in environment');
    }
    
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
        throw new Exception('No SMTP configuration found. Please configure SMTP settings in admin panel.');
    }
    
    $config = $smtp_configs[0];
    $smtp_host = $config['host'];
    $smtp_port = $config['port'];
    $smtp_user = $config['username'];
    $smtp_pass = $config['password'];
    $from_name = $config['from_name'] ?: $from_name;
    

    
    // Create socket connection
    $socket = fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
    if (!$socket) {
        throw new Exception("Could not connect to SMTP server: $errstr ($errno)");
    }
    
    // Read initial response
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '220') {
        throw new Exception("SMTP Error: $response");
    }
    
    // Send EHLO
    fputs($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
    // Read all EHLO responses
    do {
        $response = fgets($socket, 515);
    } while (substr($response, 3, 1) === '-');
    
    // Start TLS
    fputs($socket, "STARTTLS\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '220') {
        throw new Exception("STARTTLS failed: $response");
    }
    
    // Enable crypto
    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        throw new Exception("Failed to enable TLS encryption");
    }
    
    // Send EHLO again after TLS
    fputs($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
    // Read all EHLO responses after TLS
    do {
        $response = fgets($socket, 515);
    } while (substr($response, 3, 1) === '-');
    
    // Authenticate
    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '334') {
        throw new Exception("AUTH LOGIN failed: $response");
    }
    
    fputs($socket, base64_encode($smtp_user) . "\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '334') {
        throw new Exception("Username authentication failed: $response");
    }
    
    fputs($socket, base64_encode($smtp_pass) . "\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '235') {
        throw new Exception("Password authentication failed: $response");
    }
    
    // Send email
    fputs($socket, "MAIL FROM: <$smtp_user>\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        throw new Exception("MAIL FROM failed: $response");
    }
    
    // Add all TO recipients
    foreach ($to_emails as $email) {
        fputs($socket, "RCPT TO: <$email>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("RCPT TO failed for $email: $response");
        }
    }
    
    // Add all CC recipients
    foreach ($cc_emails as $email) {
        fputs($socket, "RCPT TO: <$email>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("RCPT TO failed for CC $email: $response");
        }
    }
    
    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '354') {
        throw new Exception("DATA command failed: $response");
    }
    
    // Email headers and body
    $boundary = md5(time());
    $email_content = "From: $from_name <$smtp_user>\r\n";
    $email_content .= "To: " . implode(', ', $to_emails) . "\r\n";
    if (!empty($cc_emails)) {
        $email_content .= "Cc: " . implode(', ', $cc_emails) . "\r\n";
    }
    $email_content .= "Subject: $subject\r\n";
    $email_content .= "MIME-Version: 1.0\r\n";
    
    if (!empty($attachment)) {
        // Multipart email with attachment
        $email_content .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
        $email_content .= "\r\n";
        $email_content .= "--$boundary\r\n";
        $email_content .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email_content .= "Content-Transfer-Encoding: 7bit\r\n";
        $email_content .= "\r\n";
        $email_content .= $message . "\r\n";
        $email_content .= "\r\n";
        $email_content .= "--$boundary\r\n";
        $email_content .= "Content-Type: application/pdf; name=\"$attachment_name\"\r\n";
        $email_content .= "Content-Transfer-Encoding: base64\r\n";
        $email_content .= "Content-Disposition: attachment; filename=\"$attachment_name\"\r\n";
        $email_content .= "\r\n";
        $email_content .= chunk_split($attachment) . "\r\n";
        $email_content .= "--$boundary--\r\n";
    } else {
        // Simple HTML email
        $email_content .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email_content .= "\r\n";
        $email_content .= $message;
    }
    $email_content .= "\r\n.\r\n";
    
    fputs($socket, $email_content);
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        throw new Exception("Email sending failed: $response");
    }
    
    // Quit
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully',
        'to' => $to_emails,
        'cc' => $cc_emails,
        'subject' => $subject,
        'has_attachment' => !empty($attachment),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>