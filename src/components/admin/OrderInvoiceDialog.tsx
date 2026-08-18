import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer } from 'lucide-react';
import { Order } from '@/hooks/useOrders';

interface OrderInvoiceDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedProductItem {
  editionLabel: string;
  colorLabel: string;
  isLifestyle: boolean;
  bottleImg: string;
  inclusionsText: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export const OrderInvoiceDialog: React.FC<OrderInvoiceDialogProps> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  // 1. Check Engraving details & quantity
  const hasEngraving = Boolean(
    order.engraving_text && 
    order.engraving_text.trim() !== '' && 
    order.engraving_text.toLowerCase() !== 'none'
  );

  let engravingQty = 1;
  if (hasEngraving) {
    const engQtyMatch = order.engraving_text.match(/×\s*(\d+)/i) || 
                        order.engraving_text.match(/(\d+)\s*(?:pcs?|qty|pc)/i);
    if (engQtyMatch) {
      engravingQty = parseInt(engQtyMatch[1]) || 1;
    }
  }

  const engravingUnitPrice = 150;
  const engravingTotal = hasEngraving ? engravingQty * engravingUnitPrice : 0;

  // 2. Accessory Prices & Parsing
  const accessoryPricesMap: Record<string, number> = {
    'Straw Cap': 350,
    'Cleaning Brush': 90,
    'Bottle Brush': 90,
    'Straw Cleaning Brush': 50,
    'Aluminium Hook': 90,
    'Carabiner Hook': 90,
    'Silicone Sleeve': 250,
    'Grip Sleeve': 250
  };

  const getAccessoryImage = (name: string) => {
    const map: Record<string, string> = {
      'Straw Cap': '/ximpul-uploads/f260e012-e3be-4c1c-8b71-1d2d98fbc29f.png',
      'Cleaning Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
      'Bottle Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
      'Straw Cleaning Brush': '/ximpul-uploads/a09450ea-b274-4a61-ab28-d9f053a0d789.png',
      'Aluminium Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
      'Carabiner Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
      'Silicone Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png',
      'Grip Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png'
    };
    return map[name] || '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
  };

  const parsedAccessories = (order.selected_accessories || []).map((accStr) => {
    const match = accStr.match(/^(.+?)\s*×\s*(\d+)$/);
    if (match) {
      return { name: match[1].trim(), qty: parseInt(match[2]) || 1, price: accessoryPricesMap[match[1].trim()] || 90 };
    }
    return { name: accStr.trim(), qty: 1, price: accessoryPricesMap[accStr.trim()] || 90 };
  });

  const totalAccessoriesCost = parsedAccessories.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 3. Parse Product Items (supporting single or multi-edition orders)
  const editionStr = order.selected_edition || 'Base Edition';
  const rawParts = editionStr.includes(',') 
    ? editionStr.split(',').map(s => s.trim()).filter(Boolean)
    : [editionStr.trim()];

  // Calculate remaining pool for bottles
  const totalBottlePool = Math.max(0, order.subtotal - totalAccessoriesCost - engravingTotal);

  // First pass: extract items
  const extractedItems = rawParts.map(part => {
    const lowerPart = part.toLowerCase();
    const lowerColor = (order.selected_color || '').toLowerCase();

    // Check if lifestyle
    const isLifestyle = lowerPart.includes('lifestyle');

    // Check if grey / graphite (check both edition string and selected_color)
    const isGrey = lowerPart.includes('grey') || 
                   lowerPart.includes('gray') || 
                   lowerPart.includes('graphite') ||
                   lowerColor.includes('grey') ||
                   lowerColor.includes('gray') ||
                   lowerColor.includes('graphite');

    const editionLabel = isLifestyle ? 'Lifestyle Edition' : 'Base Edition';
    const colorLabel = isGrey ? 'Graphite Grey' : 'Obsidian Black';

    // Quantity extraction
    let qty = 1;
    const qtyMatch = part.match(/×\s*(\d+)/i) || part.match(/(\d+)\s*(?:pcs?|qty|pc)/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1]) || 1;
    }

    const bottleImg = isLifestyle 
      ? (isGrey ? '/ximpul-uploads/lifestyle.png' : '/ximpul-uploads/Ximpul Flow lifestyle - Grey.png')
      : (isGrey ? '/ximpul-uploads/1e2abc2a-2836-4dad-ad5b-7962aa9b7f98.png' : '/ximpul-uploads/1c49a7b6-451a-4563-8f46-c9195df603c2.png');

    const inclusionsText = isLifestyle 
      ? 'Including Silicon sleeve, Straw cap, Cleaning brush, Straw cleaning brush, Aluminium hook' 
      : 'Including Silicon sleeve';

    return {
      editionLabel,
      colorLabel,
      isLifestyle,
      bottleImg,
      inclusionsText,
      qty,
      catalogPrice: isLifestyle ? 1650 : 1190
    };
  });

  const totalBottleQty = extractedItems.reduce((sum, item) => sum + item.qty, 0);

  // If engraving qty was not explicitly parsed from text, default to bottle qty
  if (hasEngraving && !order.engraving_text.match(/×\s*\d+/i)) {
    engravingQty = totalBottleQty;
  }

  // Calculate actual unit price for items
  const productItems: ParsedProductItem[] = extractedItems.map(item => {
    let unitPrice = item.catalogPrice;
    if (totalBottlePool > 0 && totalBottleQty > 0) {
      unitPrice = totalBottlePool / totalBottleQty;
    }
    const subtotal = unitPrice * item.qty;
    return {
      ...item,
      unitPrice,
      subtotal
    };
  });

  const deliveryIconImg = '/ximpul-uploads/delivery icon.png';

  const orderDateObj = new Date(order.created_at);
  const formattedDate = orderDateObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  const formattedTime = orderDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Clean engraving subtitle
  const engravingSubtitle = order.engraving_text 
    ? (order.engraving_text.toLowerCase().includes('laser') 
        ? `***${order.engraving_text}` 
        : (order.engraving_text.toLowerCase().includes('logo') 
            ? `***${order.engraving_text} Laser engraving` 
            : `***${order.engraving_text} Logo Laser engraving`))
    : '***Custom Logo Laser engraving';

  // Calculate the total of all items in the table (Products + Accessories + Engraving + Delivery)
  const allTableRowsTotal = productItems.reduce((sum, item) => sum + item.subtotal, 0) +
                            parsedAccessories.reduce((sum, acc) => sum + (acc.price * acc.qty), 0) +
                            engravingTotal +
                            order.delivery_fee;

  const handlePrint = () => {
    const origin = window.location.origin;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Invoice - ${order.order_id}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 14mm 10mm 14mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-size: 11px;
                line-height: 1.35;
              }
              .invoice-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
              }
              .header-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }
              .logo-img {
                height: 38px;
                object-fit: contain;
              }
              .brand-tag {
                color: #dc2626;
                font-weight: 700;
                font-size: 17px;
                letter-spacing: -0.2px;
              }
              .title-center {
                text-align: center;
                margin: 2px 0 16px 0;
              }
              .site-url {
                font-size: 11px;
                color: #374151;
                margin: 0 0 2px 0;
              }
              .doc-title {
                font-size: 24px;
                font-weight: 700;
                margin: 0;
                color: #000000;
                letter-spacing: -0.3px;
              }
              .meta-top-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                font-size: 11.5px;
                margin-bottom: 3px;
              }
              .meta-customer {
                font-size: 11.5px;
                line-height: 1.45;
                margin-bottom: 12px;
              }
              .meta-customer p {
                margin: 1px 0;
              }
              table.items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
                font-size: 11px;
              }
              table.items-table th {
                border-top: 1px solid #d1d5db;
                border-bottom: 1px solid #d1d5db;
                padding: 6px 2px;
                font-weight: 700;
                color: #000000;
              }
              table.items-table td {
                padding: 6px 2px;
                vertical-align: top;
                border-bottom: 1px solid #e5e7eb;
              }
              table.items-table tbody tr:last-child td {
                border-bottom: none;
              }
              .product-cell {
                display: flex;
                gap: 12px;
                align-items: flex-start;
              }
              .thumb-wrapper {
                width: 58px;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
              }
              .bottle-thumb {
                object-fit: contain;
                flex-shrink: 0;
              }
              .bottle-thumb-base {
                height: 88px;
                width: auto;
                max-width: 44px;
                transform: scale(1.65);
                transform-origin: center center;
              }
              .bottle-thumb-lifestyle {
                height: 72px;
                width: 72px;
              }
              .logo-icon-thumb {
                height: 42px;
                width: 42px;
                object-fit: contain;
                flex-shrink: 0;
              }
              .scooter-icon-thumb {
                height: 42px;
                width: 42px;
                object-fit: contain;
                flex-shrink: 0;
              }
              .inclusions-title {
                font-weight: 700;
                color: #000000;
                font-size: 11px;
                margin: 1px 0 2px 0;
              }
              .specs-list {
                font-size: 9.5px;
                color: #111827;
                line-height: 1.3;
              }
              .specs-list p { margin: 1px 0; }
              .totals-section {
                border-top: 1.5px solid #000000;
                margin-top: 8px;
                padding: 6px 0;
                display: flex;
                justify-content: flex-end;
              }
              .totals-box {
                width: 290px;
                font-size: 11.5px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
                font-weight: 700;
                color: #000000;
              }
              .notes-box {
                margin-top: 16px;
                font-size: 9.5px;
                color: #111827;
                line-height: 1.4;
              }
              .notes-box p { margin: 2px 0; }
              .footer-box {
                text-align: center;
                margin-top: 24px;
                font-size: 10px;
                color: #374151;
                line-height: 1.4;
              }
              .footer-box p { margin: 2px 0; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <!-- Top Header -->
              <div class="header-row">
                <img class="logo-img" src="${origin}/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png" alt="ximpul" />
                <span class="brand-tag">#TruePrice</span>
              </div>
              <div class="title-center">
                <p class="site-url">www.ximpul.com</p>
                <h1 class="doc-title">Invoice</h1>
              </div>

              <!-- Metadata Section -->
              <div class="meta-top-row">
                <div>
                  <strong>Invoice No</strong> ${orderDateObj.getFullYear()}/${String(order.order_id).padStart(4, '0')}
                </div>
                <div>
                  <strong>Date</strong> ${formattedDate}
                </div>
              </div>

              <div class="meta-customer">
                <p><strong>Customer Details</strong></p>
                <p>${order.customer_name}</p>
                <p><strong>Mobile:</strong> ${order.customer_phone}</p>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="text-align: left; width: 55%;">Item Name</th>
                    <th style="text-align: center; width: 15%;">Quantity</th>
                    <th style="text-align: right; width: 15%;">Unit Price</th>
                    <th style="text-align: right; width: 15%;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Product Rows -->
                  ${productItems.map(item => `
                    <tr>
                      <td>
                        <div class="product-cell">
                          <div class="thumb-wrapper">
                            <img class="bottle-thumb ${item.isLifestyle ? 'bottle-thumb-lifestyle' : 'bottle-thumb-base'}" src="${origin}${item.bottleImg}" alt="Bottle" />
                          </div>
                          <div>
                            <div style="font-weight: 600; color: #000000;">Ximpul Flow ${item.editionLabel} - ${item.colorLabel}</div>
                            <div class="inclusions-title">${item.inclusionsText}</div>
                            <div class="specs-list">
                              <p><strong>Capacity:</strong> 500ml, perfect for daily hydration.</p>
                              <p><strong>Temperature:</strong> Keeps drinks hot for 12 hours, cold for 24 hours.</p>
                              <p><strong>Material:</strong> Crafted from premium 304 SS food-grade.</p>
                              <p><strong>Security:</strong> Triple-lock, advanced leak-proof seal technology.</p>
                              <p><strong>Maintenance:</strong> Wide mouth design for effortless cleaning.</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style="text-align: center; font-weight: 500;">${item.qty.toFixed(2)} Pc(s)</td>
                      <td style="text-align: right; font-weight: 500;">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align: right; font-weight: 600;">${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}

                  <!-- Accessories Rows -->
                  ${parsedAccessories.map(acc => `
                    <tr>
                      <td>
                        <div class="product-cell" style="align-items: center;">
                          <div class="thumb-wrapper">
                            <img class="logo-icon-thumb" src="${origin}${getAccessoryImage(acc.name)}" alt="${acc.name}" />
                          </div>
                          <div>
                            <div style="font-weight: 600; color: #000000;">${acc.name}</div>
                            <div style="color: #6b7280; font-size: 9.5px;">Official Ximpul Accessory</div>
                          </div>
                        </div>
                      </td>
                      <td style="text-align: center; font-weight: 500;">${acc.qty.toFixed(2)} Pc(s)</td>
                      <td style="text-align: right; font-weight: 500;">${acc.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align: right; font-weight: 600;">${(acc.price * acc.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}

                  <!-- Laser Engraving Row -->
                  ${hasEngraving ? `
                    <tr>
                      <td>
                        <div class="product-cell" style="align-items: center;">
                          <div class="thumb-wrapper">
                            <svg class="logo-icon-thumb" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="25" cy="18" r="14" fill="none" stroke="#2563eb" stroke-width="2"/>
                              <path d="M16 20c3-7 11-9 17-4-4 2-7 5-8 9-3-1-6-3-9-5z" fill="#3b82f6"/>
                              <path d="M24 11c4 3 5 9 2 14 5-3 6-7 5-12-2-1-4-2-7-2z" fill="#93c5fd"/>
                              <text x="25" y="42" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#374151" font-family="sans-serif" letter-spacing="0.5">COMPANY</text>
                            </svg>
                          </div>
                          <div>
                            <div style="font-weight: 600; color: #000000;">Laser Engraving Service(Logo)</div>
                            <div style="color: #374151; font-size: 10px; font-weight: 500;">${engravingSubtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td style="text-align: center; font-weight: 500;">${engravingQty.toFixed(2)} Pc(s)</td>
                      <td style="text-align: right; font-weight: 500;">${engravingUnitPrice.toFixed(2)}</td>
                      <td style="text-align: right; font-weight: 600;">${engravingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ` : ''}

                  <!-- Delivery Charge Row -->
                  <tr>
                    <td>
                      <div class="product-cell" style="align-items: center;">
                        <div class="thumb-wrapper">
                          <img class="scooter-icon-thumb" src="${origin}${deliveryIconImg}" alt="Delivery" />
                        </div>
                        <div>
                          <div style="font-weight: 600; color: #000000;">Delivery Charge</div>
                          <div style="color: #374151; font-size: 10px; font-weight: 500;">${order.delivery_fee === 0 ? 'Free Delivery' : 'Standard Delivery'}</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align: center; font-weight: 500;">1.00 Pc(s)</td>
                    <td style="text-align: right; font-weight: 500;">${order.delivery_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 600;">${order.delivery_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals Section -->
              <div class="totals-section">
                <div class="totals-box">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>৳ ${allTableRowsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-row" style="margin-top: 2px;">
                    <span>Grand Total(Excluding Vat & Tax):</span>
                    <span>৳ ${allTableRowsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <!-- Policy Notes -->
              <div class="notes-box">
                <p><strong>***Important Notes:</strong></p>
                <p>1. This document serves as the official proof of purchase and invoice.</p>
                <p>2. Standard unused items in original packaging are eligible for return/exchange within 7 days of delivery.</p>
                <p>3. Customized/engraved bottles and individual accessories are final sale and non-refundable.</p>
                <p>4. Please inspect items upon delivery. Any transit damage or issues must be reported immediately.</p>
              </div>

              <!-- Footer -->
              <div class="footer-box">
                <p style="font-weight: 700; color: #000000;">ximpul - Making Water Free Again</p>
                <p>Thank you for choosing ximpul! <strong style="color: #dc2626;">#TruePrice</strong></p>
                <p>For support, contact us at <strong>ximpulshop@gmail.com</strong> or <strong>+88 01881-408611</strong></p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto w-[96vw] p-4 md:p-8 bg-white text-gray-900">
        <DialogHeader className="no-print pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
                <FileText className="h-5 w-5 text-gray-700" />
                Invoice #{order.order_id}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Official Invoice & Receipt Preview
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Canvas matching reference image */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-10 text-gray-900 shadow-sm max-w-3xl mx-auto font-sans">
            {/* 1. Header */}
            <div className="flex justify-between items-start">
              <div>
                <img 
                  src="/ximpul-uploads/84aae5ae-dcca-4942-a63a-ee14ebc01c94.png" 
                  alt="ximpul" 
                  className="h-8 md:h-10 object-contain"
                />
              </div>
              <div className="text-right">
                <span className="text-[#dc2626] font-bold text-lg md:text-xl tracking-tight">#TruePrice</span>
              </div>
            </div>

            <div className="text-center mt-1">
              <p className="text-xs md:text-sm text-gray-700 font-normal">www.ximpul.com</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 tracking-tight">Invoice</h1>
            </div>

            {/* 2. Metadata Section */}
            <div className="mt-6 text-xs md:text-sm space-y-1">
              <div className="flex justify-between items-baseline">
                <div>
                  <strong className="font-bold text-gray-900">Invoice No </strong> 
                  <span className="font-normal text-gray-900">{orderDateObj.getFullYear()}/{String(order.order_id).padStart(4, '0')}</span>
                </div>
                <div className="text-right">
                  <strong className="font-bold text-gray-900">Date </strong> 
                  <span className="font-normal text-gray-900">{formattedDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <strong className="font-bold text-gray-900 block">Customer Details</strong>
                <p className="font-normal text-gray-900">{order.customer_name}</p>
                <p className="font-normal text-gray-900"><strong className="font-bold">Mobile:</strong> {order.customer_phone}</p>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-t border-b border-gray-300 text-gray-900 font-bold">
                    <th className="py-2.5 text-left font-bold w-[54%]">Item Name</th>
                    <th className="py-2 text-center font-bold w-[16%]">Quantity</th>
                    <th className="py-2 text-right font-bold w-[15%]">Unit Price</th>
                    <th className="py-2 text-right font-bold w-[15%]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Product Rows */}
                  {productItems.map((item, idx) => (
                    <tr key={`modal-prod-${idx}`}>
                      <td className="py-2 pr-2">
                        <div className="flex items-start gap-3">
                          <div className="w-14 shrink-0 flex justify-center items-center">
                            <img 
                              src={item.bottleImg} 
                              alt="Ximpul Flow Bottle" 
                              className={`object-contain ${item.isLifestyle ? 'h-18 w-18 md:h-20 md:w-20' : 'h-22 w-auto max-w-10 md:h-24 md:max-w-11 scale-150 md:scale-160 origin-center'}`}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-900 text-xs md:text-sm">
                              Ximpul Flow {item.editionLabel} - {item.colorLabel}
                            </div>
                            <div className="text-xs text-gray-900 font-bold">
                              {item.inclusionsText}
                            </div>
                            <div className="text-[10px] md:text-[11px] text-gray-800 leading-tight space-y-0.5 pt-0.5">
                              <p><strong>Capacity:</strong> 500ml, perfect for daily hydration.</p>
                              <p><strong>Temperature:</strong> Keeps drinks hot for 12 hours, cold for 24 hours.</p>
                              <p><strong>Material:</strong> Crafted from premium 304 SS food-grade.</p>
                              <p><strong>Security:</strong> Triple-lock, advanced leak-proof seal technology.</p>
                              <p><strong>Maintenance:</strong> Wide mouth design for effortless cleaning.</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-center align-top font-normal text-gray-900">
                        {item.qty.toFixed(2)} Pc(s)
                      </td>
                      <td className="py-2 text-right align-top font-normal text-gray-900">
                        {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right align-top font-semibold text-gray-900">
                        {item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Accessories Rows (if any) */}
                  {parsedAccessories.map((acc, idx) => (
                    <tr key={`modal-acc-${idx}`}>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="w-14 shrink-0 flex justify-center items-center">
                            <img 
                              src={getAccessoryImage(acc.name)} 
                              alt={acc.name} 
                              className="h-10 w-10 md:h-11 md:w-11 object-contain shrink-0"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs md:text-sm">{acc.name}</div>
                            <div className="text-[10px] text-gray-500">Official Ximpul Accessory</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-center align-middle font-normal text-gray-900">
                        {acc.qty.toFixed(2)} Pc(s)
                      </td>
                      <td className="py-2 text-right align-middle font-normal text-gray-900">
                        {acc.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right align-middle font-semibold text-gray-900">
                        {(acc.price * acc.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Laser Engraving Row (if applicable) */}
                  {hasEngraving && (
                    <tr>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="w-14 shrink-0 flex justify-center items-center">
                            <svg className="h-10 w-10 md:h-11 md:w-11 shrink-0" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="25" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="2"/>
                              <path d="M16 20c3-7 11-9 17-4-4 2-7 5-8 9-3-1-6-3-9-5z" fill="#3b82f6"/>
                              <path d="M24 11c4 3 5 9 2 14 5-3 6-7 5-12-2-1-4-2-7-2z" fill="#93c5fd"/>
                              <text x="25" y="42" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#374151" fontFamily="sans-serif" letterSpacing="0.5">COMPANY</text>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs md:text-sm">Laser Engraving Service(Logo)</div>
                            <div className="text-[11px] text-gray-700 font-medium">{engravingSubtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-center align-middle font-normal text-gray-900">
                        {engravingQty.toFixed(2)} Pc(s)
                      </td>
                      <td className="py-2 text-right align-middle font-normal text-gray-900">
                        {engravingUnitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 text-right align-middle font-semibold text-gray-900">
                        {engravingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {/* Delivery Charge Row */}
                  <tr>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 shrink-0 flex justify-center items-center">
                          <img 
                            src={deliveryIconImg} 
                            alt="Delivery Charge" 
                            className="h-10 w-10 md:h-11 md:w-11 object-contain shrink-0" 
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs md:text-sm">Delivery Charge</div>
                          <div className="text-[11px] text-gray-700 font-medium">
                            {order.delivery_fee === 0 ? 'Free Delivery' : 'Standard Delivery'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-center align-middle font-normal text-gray-900">
                      1.00 Pc(s)
                    </td>
                    <td className="py-2 text-right align-middle font-normal text-gray-900">
                      {order.delivery_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-right align-middle font-semibold text-gray-900">
                      {order.delivery_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Subtotal & Grand Total Section */}
            <div className="mt-2 pt-2 border-t-2 border-gray-900 flex justify-end">
              <div className="w-72 space-y-1 text-xs md:text-sm font-bold text-gray-900">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span>৳ {allTableRowsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Grand Total(Excluding Vat & Tax):</span>
                  <span>৳ {allTableRowsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* 5. Policy Notes */}
            <div className="mt-6 text-[10px] md:text-xs text-gray-900 space-y-1">
              <p className="font-bold">***Important Notes:</p>
              <p>1. This document serves as the official proof of purchase and invoice.</p>
              <p>2. Standard unused items in original packaging are eligible for return/exchange within 7 days of delivery.</p>
              <p>3. Customized/engraved bottles and individual accessories are final sale and non-refundable.</p>
              <p>4. Please inspect items upon delivery. Any transit damage or issues must be reported immediately.</p>
            </div>

            {/* 6. Footer */}
            <div className="text-center mt-8 text-xs md:text-sm space-y-1">
              <p className="font-bold text-gray-900">ximpul - Making Water Free Again</p>
              <p className="text-gray-800 font-medium">Thank you for choosing ximpul! <span className="font-bold text-[#dc2626]">#TruePrice</span></p>
              <p className="text-gray-700 text-[11px] md:text-xs">
                For support, contact us at <strong>ximpulshop@gmail.com</strong> or <strong>+88 01881-408611</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t no-print">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-xs md:text-sm h-9 md:h-10">
              Close
            </Button>
            <Button 
              onClick={handlePrint}
              className="flex items-center gap-2 w-full sm:w-auto justify-center text-xs md:text-sm h-9 md:h-10 bg-black hover:bg-gray-800 text-white font-medium"
            >
              <Printer className="h-4 w-4" />
              Print / Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
