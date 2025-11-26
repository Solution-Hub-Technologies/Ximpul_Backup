<?php
// Test payment callback for order #100728
$orderUuid = 'aaea0b85-c75f-485f-a654-f2caa8014e95';
$amount = 10;

echo "Testing payment callback for order #100728...\n\n";

// Simulate the callback URL
$callbackUrl = "https://ximpul.com/payment-success.php?tran_id=" . urlencode($orderUuid) . "&amount=" . $amount;

echo "Callback URL: $callbackUrl\n\n";

// Make the request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $callbackUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

echo "Response Code: $httpCode\n";
echo "Final URL: $finalUrl\n\n";

if (strpos($finalUrl, 'thank-you') !== false) {
    echo "✅ SUCCESS! Redirected to thank you page!\n";
    echo "Order has been processed successfully.\n";
} else {
    echo "❌ FAILED! Did not redirect to thank you page.\n";
    echo "Final URL: $finalUrl\n";
}
?>
