<?php

namespace App\Services;

use App\Models\ProductPriceHistory;
use Illuminate\Support\Facades\Auth;

class PriceHistoryService
{
    /**
     * Record a price history change if prices actually changed.
     */
    public function recordChange(
        int $productId,
        ?int $branchId,
        ?float $oldCostPrice,
        ?float $newCostPrice,
        ?float $oldSellingPrice,
        ?float $newSellingPrice,
        string $changeType = 'manual',
        ?string $reason = null,
        ?int $userId = null
    ): ?ProductPriceHistory {
        $costChanged = abs((float) ($oldCostPrice ?? 0) - (float) ($newCostPrice ?? 0)) > 0.0001;
        $sellingChanged = abs((float) ($oldSellingPrice ?? 0) - (float) ($newSellingPrice ?? 0)) > 0.0001;

        if (!$costChanged && !$sellingChanged) {
            return null;
        }

        return ProductPriceHistory::create([
            'product_id' => $productId,
            'branch_id' => $branchId,
            'old_cost_price' => $oldCostPrice,
            'new_cost_price' => $newCostPrice,
            'old_selling_price' => $oldSellingPrice,
            'new_selling_price' => $newSellingPrice,
            'change_type' => $changeType,
            'reason' => $reason,
            'changed_by' => $userId ?? Auth::id(),
            'effective_date' => now(),
        ]);
    }
}
