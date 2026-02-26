<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $sale->invoice_no }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            @if ($format === 'thermal')
                size: 80mm auto;
                margin: 0;
            @elseif ($format === 'a5')
                size: A5;
                margin: 10mm;
            @else
                size: A4;
                margin: 10mm;
            @endif
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }

            .no-print {
                display: none !important;
            }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: {{ $format === 'thermal' ? '10px' : ($format === 'a5' ? '11px' : '12px') }};
            line-height: 1.2;
            color: #333;
            background: #fff;
        }

        .invoice-container {
            max-width: {{ $format === 'thermal' ? '72mm' : ($format === 'a5' ? '148mm' : '210mm') }};
            margin: 0 auto;
            padding: {{ $format === 'thermal' ? '5mm' : ($format === 'a5' ? '10mm' : '15mm') }};
        }

        /* Header */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: {{ $format === 'thermal' ? '10px' : ($format === 'a5' ? '15px' : '20px') }};
            padding-bottom: {{ $format === 'thermal' ? '5px' : '15px' }};
            border-bottom: {{ $format === 'thermal' ? '1px dashed #333' : '2px solid #1E3A5F' }};
            flex-direction: {{ $format === 'thermal' ? 'column' : 'row' }};
            align-items: {{ $format === 'thermal' ? 'center' : 'flex-start' }};
            text-align: {{ $format === 'thermal' ? 'center' : 'left' }};
        }

        .company-info {
            width: {{ $format === 'thermal' ? '100%' : 'auto' }};
            margin-bottom: {{ $format === 'thermal' ? '10px' : '0' }};
        }

        .company-info h1 {
            font-size: {{ $format === 'thermal' ? '16px' : ($format === 'a5' ? '18px' : '24px') }};
            color: #1E3A5F;
            margin-bottom: 5px;
        }

        .company-info p {
            font-size: {{ $format === 'thermal' ? '9px' : ($format === 'a5' ? '10px' : '11px') }};
            color: #666;
        }

        .invoice-title {
            text-align: {{ $format === 'thermal' ? 'center' : 'right' }};
            width: {{ $format === 'thermal' ? '100%' : 'auto' }};
        }

        .invoice-title h2 {
            font-size: {{ $format === 'thermal' ? '14px' : ($format === 'a5' ? '20px' : '28px') }};
            color: #F7941D;
            margin-bottom: 5px;
            display: {{ $format === 'thermal' ? 'none' : 'block' }};
        }

        .invoice-no {
            font-size: {{ $format === 'thermal' ? '10px' : ($format === 'a5' ? '12px' : '14px') }};
            font-weight: bold;
            color: #1E3A5F;
        }

        /* Details Section */
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: {{ $format === 'thermal' ? '10px' : ($format === 'a5' ? '15px' : '20px') }};
            flex-direction: {{ $format === 'thermal' ? 'column' : 'row' }};
            gap: {{ $format === 'thermal' ? '5px' : '0' }};
        }

        .detail-section {
            flex: 1;
            text-align: {{ $format === 'thermal' ? 'left' : 'inherit' }} !important;
        }

        .detail-section h3 {
            font-size: {{ $format === 'thermal' ? '9px' : ($format === 'a5' ? '10px' : '11px') }};
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: {{ $format === 'thermal' ? '2px' : '5px' }};
            display: {{ $format === 'thermal' ? 'none' : 'block' }};
        }

        .detail-section p {
            font-size: {{ $format === 'a5' ? '11px' : '12px' }};
            margin-bottom: 3px;
        }

        .detail-section strong {
            color: #1E3A5F;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: {{ $format === 'thermal' ? '10px' : ($format === 'a5' ? '15px' : '20px') }};
        }

        .items-table th {
            background: {{ $format === 'thermal' ? 'transparent' : '#1E3A5F' }};
            color: {{ $format === 'thermal' ? '#000' : 'white' }};
            padding: {{ $format === 'thermal' ? '5px 0' : ($format === 'a5' ? '8px 6px' : '10px 8px') }};
            text-align: left;
            font-size: {{ $format === 'thermal' ? '9px' : ($format === 'a5' ? '10px' : '11px') }};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: {{ $format === 'thermal' ? '1px dashed #000' : 'none' }};
        }

        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }

        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table td:nth-child(2),
        .items-table td:nth-child(3),
        .items-table td:nth-child(4) {
            text-align: center;
        }

        .items-table td {
            padding: {{ $format === 'thermal' ? '5px 0' : ($format === 'a5' ? '8px 6px' : '10px 8px') }};
            border-bottom: {{ $format === 'thermal' ? 'none' : '1px solid #eee' }};
            font-size: {{ $format === 'thermal' ? '9px' : ($format === 'a5' ? '10px' : '11px') }};
        }

        .items-table tr:nth-child(even) {
            background: {{ $format === 'thermal' ? 'transparent' : '#f9f9f9' }};
        }

        .product-code {
            color: #888;
            font-size: {{ $format === 'thermal' ? '8px' : ($format === 'a5' ? '9px' : '10px') }};
        }

        /* Totals */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: {{ $format === 'thermal' ? '10px' : '0' }};
            border-top: {{ $format === 'thermal' ? '1px dashed #000' : 'none' }};
            padding-top: {{ $format === 'thermal' ? '5px' : '0' }};
        }

        .totals-table {
            width: {{ $format === 'thermal' ? '100%' : ($format === 'a5' ? '180px' : '220px') }};
        }

        .totals-table tr td {
            padding: {{ $format === 'a5' ? '5px 8px' : '6px 10px' }};
            font-size: {{ $format === 'a5' ? '11px' : '12px' }};
        }

        .totals-table tr td:last-child {
            text-align: right;
            font-family: 'Courier New', monospace;
        }

        .totals-table .total-row {
            background: #1E3A5F;
            color: white;
            font-weight: bold;
            font-size: {{ $format === 'a5' ? '13px' : '14px' }};
        }

        .totals-table .paid-row td {
            color: #22c55e;
        }

        .totals-table .credit-row td {
            color: #ef4444;
        }

        /* Footer */
        .invoice-footer {
            margin-top: {{ $format === 'a5' ? '20px' : '30px' }};
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: {{ $format === 'a5' ? '9px' : '10px' }};
            color: #888;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: {{ $format === 'a5' ? '9px' : '10px' }};
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-paid {
            background: #dcfce7;
            color: #166534;
        }

        .status-unpaid {
            background: #fee2e2;
            color: #991b1b;
        }

        .status-partial {
            background: #fef3c7;
            color: #92400e;
        }

        /* Print Button */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #1E3A5F;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }

        .print-button:hover {
            background: #2a4a73;
        }
    </style>
</head>

<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print Invoice</button>

    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="company-info">
                <img src="{{ asset('logo.png') }}" alt="Logo" style="height: 50px; margin-bottom: 5px;">
                <h1>{{ $sale->branch?->name ?? 'Maharshin' }}</h1>
                <p>{{ $sale->branch?->address ?? '' }}</p>
                <p>{{ $sale->branch?->phone ?? '' }}</p>
            </div>
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <div class="invoice-no">{{ $sale->invoice_no }}</div>
            </div>
        </div>

        <!-- Details -->
        <div class="invoice-details">
            <div class="detail-section">
                <h3>Bill To</h3>
                <p><strong>{{ $sale->customer?->name ?? 'Walk-in Customer' }}</strong></p>
                @if ($sale->customer?->phone)
                    <p>{{ $sale->customer->phone }}</p>
                @endif
            </div>
            <div class="detail-section" style="text-align: right;">
                <h3>Invoice Details</h3>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($sale->sale_date)->format('d M Y') }}</p>
                <p><strong>Payment:</strong> {{ $sale->payment_method ?? 'N/A' }}</p>
                <p>
                    <span class="status-badge status-{{ $sale->payment_status }}">
                        {{ ucfirst($sale->payment_status) }}
                    </span>
                </p>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Group</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sale->saleItems as $item)
                    <tr>
                        <td>
                            {{ $item->product?->name ?? 'Unknown Product' }}
                            <div class="product-code">{{ $item->product?->code ?? '' }}</div>
                        </td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ number_format($item->unit_price, 0) }}</td>
                        <td>{{ $item->product?->branchStocks->where('branch_id', $sale->branch_id)->first()?->group?->name ?? '-' }}</td>
                        <td>{{ number_format($item->subtotal, 0) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Subtotal</td>
                    <td>{{ number_format($sale->subtotal, 0) }} Ks</td>
                </tr>
                <tr>
                    <td>Tax</td>
                    <td>{{ number_format($sale->tax_amount, 0) }} Ks</td>
                </tr>
                @if ($sale->discount_amount > 0)
                    <tr>
                        <td>Discount {{ $sale->subtotal > 0 ? '(' . floatval(number_format(($sale->discount_amount / $sale->subtotal) * 100, 2)) . '%)' : '' }}</td>
                        <td>-{{ number_format($sale->discount_amount, 0) }} Ks</td>
                    </tr>
                @endif
                <tr class="total-row">
                    <td>Total</td>
                    <td>{{ number_format($sale->total_amount, 0) }} Ks</td>
                </tr>
                @if ($sale->paid_amount > 0)
                    <tr class="paid-row">
                        <td>Paid</td>
                        <td>{{ number_format($sale->paid_amount, 0) }} Ks</td>
                    </tr>
                @endif
                @if ($sale->credit_amount > 0)
                    <tr class="credit-row">
                        <td>Credit</td>
                        <td>{{ number_format($sale->credit_amount, 0) }} Ks</td>
                    </tr>
                @endif
            </table>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
            <p>Thank you for your business!</p>
            <p>Invoice generated on {{ now()->format('d M Y, h:i A') }}</p>
            @if ($sale->createdBy)
                <p>Served by: {{ $sale->createdBy->name }}</p>
            @endif
        </div>
    </div>

    <script>
        // Auto-print if requested
        @if (request()->has('auto'))
            window.onload = function() {
                window.print();
            };
        @endif
    </script>
</body>

</html>
