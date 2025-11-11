<?php
// Disable error display in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Sanitize and validate inputs
$tran_id = filter_input(INPUT_GET, 'tran_id', FILTER_SANITIZE_STRING);
$amount = filter_input(INPUT_GET, 'amount', FILTER_VALIDATE_FLOAT);

// Validate UUID format for tran_id
if ($tran_id && !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tran_id)) {
    error_log("Invalid transaction ID format: $tran_id");
    header("Location: https://ximpul.com/");
    exit;
}

if ($tran_id && $amount) {
    error_log("Payment Success Callback - tran_id: $tran_id, amount: $amount");

    // Get environment variables
    $supabaseUrl = $_ENV['SUPABASE_URL'] ?? 'https://ximpul.com/api/rest/v1/orders';
    $apiKey = $_ENV['SUPABASE_ANON_KEY'] ?? '';
    
    if (empty($apiKey)) {
        error_log("Missing Supabase API key");
        header("Location: https://ximpul.com/");
        exit;
    }
    
    // Get order by UUID with proper escaping
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '?select=*&id=eq.' . urlencode($tran_id));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $apiKey,
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    error_log("API Response Code: $httpCode");
    error_log("API Response: $response");
    
    if ($httpCode === 200) {
        $orders = json_decode($response, true);
        error_log("Orders found: " . count($orders ?? []));
        
        if ($orders && count($orders) > 0) {
            $order = $orders[0];
            error_log("Order details: " . print_r($order, true));
            
            // Update order status
            $updateData = json_encode([
                'order_status' => 'confirmed',
                'payment_status' => 'completed'
            ]);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '?id=eq.' . urlencode($tran_id));
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $apiKey,
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $updateResponse = curl_exec($ch);
            $updateCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            error_log("Update Response Code: $updateCode");
            error_log("Update Response: $updateResponse");
            
            // Deduct stock for successful online payment
            if ($updateCode === 200 || $updateCode === 204) {
                error_log("Deducting stock for online order: " . $order['order_id']);
                
                // Get product data to deduct stock
                $productUrl = str_replace('/orders', '/products', $supabaseUrl) . '?select=*&edition=eq.' . urlencode($order['selected_edition']);
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $productUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'apikey: ' . $apiKey,
                    'Authorization: Bearer ' . $apiKey,
                    'Content-Type: application/json'
                ]);
                
                $productResponse = curl_exec($ch);
                $productCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($productCode === 200) {
                    $products = json_decode($productResponse, true);
                    if ($products && count($products) > 0) {
                        $product = $products[0];
                        $stockField = $order['selected_color'] === 'obsidian' ? 'stock_black' : 'stock_grey';
                        $currentStock = $product[$stockField] ?? 0;
                        
                        if ($currentStock > 0) {
                            // Update stock
                            $newStock = $currentStock - 1;
                            $stockUpdateData = json_encode([$stockField => $newStock]);
                            
                            $ch = curl_init();
                            curl_setopt($ch, CURLOPT_URL, str_replace('/orders', '/products', $supabaseUrl) . '?edition=eq.' . urlencode($order['selected_edition']));
                            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
                            curl_setopt($ch, CURLOPT_POSTFIELDS, $stockUpdateData);
                            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                                'apikey: ' . $apiKey,
                                'Authorization: Bearer ' . $apiKey,
                                'Content-Type: application/json'
                            ]);
                            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                            $stockUpdateResponse = curl_exec($ch);
                            $stockUpdateCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                            curl_close($ch);
                            
                            error_log("Stock update response code: $stockUpdateCode");
                            error_log("Stock deducted: $currentStock -> $newStock for " . $order['selected_color']);
                            
                            // Log stock change
                            $stockLogData = json_encode([
                                'item_id' => $product['id'],
                                'item_type' => 'product',
                                'item_name' => $order['selected_edition'],
                                'color' => $order['selected_color'],
                                'change_amount' => -1,
                                'reason' => 'Online payment confirmed - Order ID: ' . $order['order_id'],
                                'previous_stock' => $currentStock,
                                'new_stock' => $newStock
                            ]);
                            
                            $ch = curl_init();
                            curl_setopt($ch, CURLOPT_URL, str_replace('/orders', '/stock_logs', $supabaseUrl));
                            curl_setopt($ch, CURLOPT_POST, 1);
                            curl_setopt($ch, CURLOPT_POSTFIELDS, $stockLogData);
                            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                                'apikey: ' . $apiKey,
                                'Authorization: Bearer ' . $apiKey,
                                'Content-Type: application/json'
                            ]);
                            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                            curl_exec($ch);
                            curl_close($ch);
                        } else {
                            error_log("Warning: No stock available for " . $order['selected_color'] . " - Order: " . $order['order_id']);
                        }
                    }
                }
                
                // Deduct accessories stock
                if (!empty($order['selected_accessories']) && is_array($order['selected_accessories'])) {
                    error_log("Deducting accessories stock: " . json_encode($order['selected_accessories']));
                    
                    foreach ($order['selected_accessories'] as $accessoryName) {
                        // Get accessory data
                        $accessoryUrl = str_replace('/orders', '/accessories', $supabaseUrl) . '?select=*&name=eq.' . urlencode($accessoryName);
                        
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $accessoryUrl);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'apikey: ' . $apiKey,
                            'Authorization: Bearer ' . $apiKey,
                            'Content-Type: application/json'
                        ]);
                        
                        $accessoryResponse = curl_exec($ch);
                        $accessoryCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);
                        
                        if ($accessoryCode === 200) {
                            $accessories = json_decode($accessoryResponse, true);
                            if ($accessories && count($accessories) > 0) {
                                $accessory = $accessories[0];
                                $currentAccessoryStock = $accessory['stock'] ?? 0;
                                
                                if ($currentAccessoryStock > 0) {
                                    $newAccessoryStock = $currentAccessoryStock - 1;
                                    $accessoryStockUpdateData = json_encode(['stock' => $newAccessoryStock]);
                                    
                                    $ch = curl_init();
                                    curl_setopt($ch, CURLOPT_URL, str_replace('/orders', '/accessories', $supabaseUrl) . '?name=eq.' . urlencode($accessoryName));
                                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
                                    curl_setopt($ch, CURLOPT_POSTFIELDS, $accessoryStockUpdateData);
                                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                                        'apikey: ' . $apiKey,
                                        'Authorization: Bearer ' . $apiKey,
                                        'Content-Type: application/json'
                                    ]);
                                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                    curl_exec($ch);
                                    curl_close($ch);
                                    
                                    error_log("Accessory stock deducted: $accessoryName ($currentAccessoryStock -> $newAccessoryStock)");
                                    
                                    // Log accessory stock change
                                    $accessoryLogData = json_encode([
                                        'item_id' => $accessory['id'],
                                        'item_type' => 'accessory',
                                        'item_name' => $accessoryName,
                                        'color' => null,
                                        'change_amount' => -1,
                                        'reason' => 'Online payment confirmed - Order ID: ' . $order['order_id'],
                                        'previous_stock' => $currentAccessoryStock,
                                        'new_stock' => $newAccessoryStock
                                    ]);
                                    
                                    $ch = curl_init();
                                    curl_setopt($ch, CURLOPT_URL, str_replace('/orders', '/stock_logs', $supabaseUrl));
                                    curl_setopt($ch, CURLOPT_POST, 1);
                                    curl_setopt($ch, CURLOPT_POSTFIELDS, $accessoryLogData);
                                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                                        'apikey: ' . $apiKey,
                                        'Authorization: Bearer ' . $apiKey,
                                        'Content-Type: application/json'
                                    ]);
                                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                    curl_exec($ch);
                                    curl_close($ch);
                                } else {
                                    error_log("Warning: No stock available for accessory: $accessoryName - Order: " . $order['order_id']);
                                }
                            }
                        }
                    }
                }
            }
            
            // Deduct stock for successful online payment
            if ($updateCode === 200 || $updateCode === 204) {
                error_log("Deducting stock for online order: $tran_id");
                
                // Call stock deduction function
                $stockData = json_encode([
                    'orderId' => $tran_id,
                    'newStatus' => 'confirmed'
                ]);
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/functions/v1/deduct-stock');
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $stockData);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'apikey: ' . $apiKey,
                    'Authorization: Bearer ' . $apiKey,
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $stockResponse = curl_exec($ch);
                $stockCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                error_log("Stock Deduction Response Code: $stockCode");
                error_log("Stock Deduction Response: $stockResponse");
            }
            
            // Send customer email with same format as COD
            if (!empty($order['customer_email'])) {
                // Build secure email template
                $customerName = htmlspecialchars($order['customer_name'], ENT_QUOTES, 'UTF-8');
                $orderId = htmlspecialchars($order['order_id'], ENT_QUOTES, 'UTF-8');
                $selectedEdition = htmlspecialchars($order['selected_edition'], ENT_QUOTES, 'UTF-8');
                $selectedColor = htmlspecialchars($order['selected_color'], ENT_QUOTES, 'UTF-8');
                $totalAmount = htmlspecialchars($order['total_amount'], ENT_QUOTES, 'UTF-8');
                
                $customerEmailHTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Confirmation - Ximpul Flow</title></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 30px; text-align: center;"><h1 style="color: #ffffff; font-size: 28px; font-weight: 300; margin: 0 0 10px 0; letter-spacing: 1px;">XIMPUL FLOW</h1><p style="color: #d1d5db; font-size: 16px; margin: 0;">Order Confirmation</p></div><div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;"><div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 24px;">✓</span></div><h2 style="color: #1f2937; font-size: 24px; font-weight: 400; margin: 0 0 10px 0;">Thank You, ' . $customerName . '!</h2><p style="color: #6b7280; font-size: 16px; margin: 0;">Your order has been confirmed and is being processed.</p></div><div style="padding: 30px;"><div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;"><h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3><table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order ID:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 700; font-family: monospace;">#' . $orderId . '</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Product:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">' . $selectedEdition . ' Edition</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Color:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">' . $selectedColor . '</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Payment:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">Online Payment</td></tr><tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 0 8px 0; color: #1f2937; font-weight: 700; font-size: 18px;">Total:</td><td style="padding: 12px 0 8px 0; color: #1f2937; font-weight: 700; font-size: 18px;">' . $totalAmount . ' BDT</td></tr></table></div><div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;"><h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Track Your Order</h3><p style="color: #d1d5db; margin: 0 0 20px 0;">Monitor your order status in real-time</p><a href="https://ximpul.com/track-order?orderId=' . urlencode($order['order_id']) . '" style="display: inline-block; background-color: #ffffff; color: #1f2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Track Order #' . $orderId . '</a><p style="color: #9ca3af; font-size: 14px; margin: 15px 0 0 0;">Or visit ximpul.com/track-order</p></div><div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px;"><h4 style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">What happens next?</h4><p style="color: #047857; margin: 0; line-height: 1.6;">Your payment has been processed successfully. We will prepare your order for delivery.</p></div><div style="text-align: center; padding: 20px 0;"><p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Thank you for choosing Ximpul Flow - a product built with care, purpose, and the belief that water should be free.</p><p style="color: #1f2937; font-weight: 600; font-size: 18px; margin: 0;">Your Water. Your Freedom.</p></div></div><div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact us:</p><p style="color: #1f2937; font-weight: 600; margin: 0;">Email: ximpulshop@gmail.com | Phone: 01881408611</p><p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Copyright 2024 Ximpul. All rights reserved.</p></div></div></body></html>';
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://ximpul.com/smtp-mailer.php');
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                    'to' => $order['customer_email'],
                    'subject' => 'Payment Confirmed - Order #' . $order['order_id'] . ' | Ximpul Flow',
                    'message' => $customerEmailHTML,
                    'from_name' => 'Ximpul Shop'
                ]));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $emailResponse = curl_exec($ch);
                curl_close($ch);
                
                error_log("Customer Email Response: $emailResponse");
            }
            
            // Send admin emails with same format as COD
            $adminEmailHTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Order Alert - Ximpul Admin</title></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f5f9;"><div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;"><div style="background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 24px;">!</span></div><h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 5px 0;">New Order Alert</h1><p style="color: #fecaca; font-size: 14px; margin: 0;">Immediate attention required</p></div><div style="padding: 30px;"><div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;"><h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">Order #' . htmlspecialchars($order['order_id']) . '</h2><p style="color: #d1d5db; font-size: 14px; margin: 0;">Total: <span style="font-size: 18px; font-weight: 700; color: #10b981;">' . htmlspecialchars($order['total_amount']) . ' BDT</span></p></div><div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px;"><h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Customer Information</h3><div style="display: grid; gap: 12px;"><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Name:</span><span style="color: #1f2937; font-weight: 600;">' . htmlspecialchars($order['customer_name']) . '</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Phone:</span><span style="color: #1f2937; font-weight: 600;">' . htmlspecialchars($order['customer_phone']) . '</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Email:</span><span style="color: #1f2937; font-weight: 600;">' . htmlspecialchars($order['customer_email']) . '</span></div><div style="padding: 8px 0;"><span style="color: #64748b; font-weight: 500; display: block; margin-bottom: 5px;">Address:</span><span style="color: #1f2937; font-weight: 600; background-color: #ffffff; padding: 10px; border-radius: 6px; display: block;">' . htmlspecialchars($order['customer_address']) . '</span></div></div></div><div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin-bottom: 25px;"><h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; border-bottom: 2px solid #bfdbfe; padding-bottom: 8px;">Product Details</h3><div style="display: grid; gap: 12px;"><div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Edition:</span><span style="color: #1f2937; font-weight: 600;">' . htmlspecialchars($order['selected_edition']) . '</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Color:</span><span style="color: #1f2937; font-weight: 600;">' . htmlspecialchars($order['selected_color']) . '</span></div>' . (!empty($order['engraving_text']) ? '<div style="padding: 8px 0;"><span style="color: #1e40af; font-weight: 500; display: block; margin-bottom: 5px;">Engraving:</span><span style="color: #1f2937; font-weight: 600; background-color: #ffffff; padding: 10px; border-radius: 6px; display: block; font-style: italic;">' . htmlspecialchars($order['engraving_text']) . '</span></div>' : '') . '<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Payment Method:</span><span style="color: #1f2937; font-weight: 600;">Online Payment</span></div></div></div><div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 20px; text-align: center;"><h4 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Action Required</h4><p style="color: #fef3c7; margin: 0 0 15px 0; font-size: 14px;">Please process this order in the admin dashboard</p><a href="https://ximpul.com/admin/orders" style="display: inline-block; background-color: #ffffff; color: #d97706; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Dashboard</a></div></div><div style="background-color: #1f2937; padding: 20px; text-align: center;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">Ximpul Admin Panel | Order Management System</p><p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">This is an automated notification</p></div></div></body></html>';
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://ximpul.com/smtp-mailer.php');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'to' => 'ximpulshop@gmail.com',
                'cc' => 'nahid@sohub.com.bd,shariar@sohub.com.bd,sadiq.shahrior19@gmail.com,sunnyat@sohub.com.bd',
                'subject' => 'Payment Received - Order #' . $order['order_id'],
                'message' => $adminEmailHTML,
                'from_name' => 'Ximpul Shop'
            ]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $emailResponse = curl_exec($ch);
            curl_close($ch);
            
            error_log("Admin Email Response: $emailResponse");
            
            // Redirect with order_id, amount and payment method
            header("Location: https://ximpul.com/thank-you?orderId=" . urlencode($order['order_id']) . "&totalAmount=" . urlencode($order['total_amount']) . "&paymentMethod=online");
            exit;
        } else {
            error_log("No orders found for UUID: $tran_id");
        }
    } else {
        error_log("API call failed with code: $httpCode, response: $response");
    }
    
    // If order not found or API failed, redirect with UUID
    header("Location: https://ximpul.com/thank-you?orderId=$tran_id&amount=$amount");
} else {
    error_log("Missing tran_id or amount in callback");
    header("Location: https://ximpul.com/");
}
exit;
?>