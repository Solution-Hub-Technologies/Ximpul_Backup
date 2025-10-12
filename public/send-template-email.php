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

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $template_name = $input['template_name'] ?? '';
    $to = $input['to'] ?? '';
    $variables = $input['variables'] ?? [];
    
    if (empty($template_name) || empty($to)) {
        throw new Exception('Template name and recipient email are required');
    }
    
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
    
    // Get template from database
    $supabase_url = $env['VITE_SUPABASE_URL'] ?? '';
    $anon_key = $env['VITE_SUPABASE_ANON_KEY'] ?? '';
    $service_key = $env['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    
    if (empty($supabase_url)) {
        throw new Exception('Supabase URL not found in environment');
    }
    
    $api_url = $supabase_url . '/rest/v1/email_templates?name=eq.' . urlencode($template_name) . '&select=*';
    
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
    
    $response = file_get_contents($api_url, false, $context);
    $templates = json_decode($response, true);
    
    if (empty($templates)) {
        throw new Exception("Template '$template_name' not found");
    }
    
    $template = $templates[0];
    $subject = $template['subject'];
    $message = $template['template'];
    
    // Replace variables in subject and message
    foreach ($variables as $key => $value) {
        $subject = str_replace('{{' . $key . '}}', $value, $subject);
        $message = str_replace('{{' . $key . '}}', $value, $message);
    }
    
    // Send email using SMTP mailer
    $params = [
        'to' => $to,
        'subject' => $subject,
        'message' => $message,
        'from_name' => 'Ximpul Shop'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://ximpul.com/smtp-mailer.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('Failed to send email: HTTP ' . $httpCode);
    }
    
    $emailResult = json_decode($result, true);
    
    if (!$emailResult || !$emailResult['success']) {
        throw new Exception('Email sending failed: ' . ($emailResult['error'] ?? 'Unknown error'));
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Template email sent successfully',
        'template' => $template_name,
        'to' => $to
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>