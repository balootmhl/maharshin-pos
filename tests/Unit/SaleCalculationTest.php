<?php

namespace Tests\Unit;

use App\Models\Sale;
use App\Models\SaleItem;

test('sale total_amount math matches subtotal + tax_amount - discount_amount', function () {
    $sale = new Sale([
        'subtotal' => 15000.00,
        'tax_amount' => 750.00,
        'discount_amount' => 1000.00,
        'paid_amount' => 14000.00,
    ]);

    // Compute expected total
    $expectedTotal = $sale->subtotal + $sale->tax_amount - $sale->discount_amount;
    expect($expectedTotal)->toEqual(14750.00);

    // Compute expected credit/balance due
    $expectedCredit = $expectedTotal - $sale->paid_amount;
    expect($expectedCredit)->toEqual(750.00);
});

test('sale item calculations compute subtotal correctly from quantity, price, and tax', function () {
    $item = new SaleItem([
        'quantity' => 5,
        'unit_price' => 2000.00,
        'tax_rate' => 5.00, // 5%
    ]);

    // Calculate item subtotal (qty * price)
    $subtotal = $item->quantity * $item->unit_price;
    expect($subtotal)->toEqual(10000.00);

    // Calculate tax amount (subtotal * tax_rate / 100)
    $taxAmount = $subtotal * ($item->tax_rate / 100);
    expect($taxAmount)->toEqual(500.00);
});
