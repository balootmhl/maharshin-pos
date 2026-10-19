<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BatchPricingService
{
    /**
     * Apply rounding algorithm to a given price.
     */
    public function applyRounding(float $price, string $rounding): float
    {
        if ($price <= 0) {
            return 0.0;
        }

        return match ($rounding) {
            'nearest_50' => (float) (round($price / 50) * 50),
            'nearest_100' => (float) (round($price / 100) * 100),
            'round_up_100' => (float) (ceil($price / 100) * 100),
            'round_down_100' => (float) (floor($price / 100) * 100),
            default => round($price, 2),
        };
    }

    /**
     * Calculate new price based on current price, percentage adjustment, and rounding rule.
     */
    public function calculateNewPrice(float $currentPrice, float $percentage, string $rounding): float
    {
        $raw = $currentPrice * (1 + ($percentage / 100));
        if ($raw < 0) {
            return 0.0;
        }

        return $this->applyRounding($raw, $rounding);
    }

    /**
     * Build base query for products based on scope filter.
     */
    public function buildScopeQuery(string $scopeType, ?int $scopeId, ?int $branchId = null): Builder
    {
        $query = Product::where('is_active', true);

        if ($scopeType === 'category' && $scopeId) {
            $query->where('category_id', $scopeId);
        } elseif ($scopeType === 'group' && $scopeId) {
            $query->whereHas('branchStocks', function ($q) use ($scopeId, $branchId) {
                $q->withoutGlobalScopes()->where('group_id', $scopeId);
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            });
        }

        return $query;
    }

    /**
     * Get preview data: total count and 10 sample items showing before & after prices.
     */
    public function getPreviewData(
        ?int $branchId,
        string $scopeType,
        ?int $scopeId,
        string $targetField,
        float $percentage,
        string $rounding
    ): array {
        $query = $this->buildScopeQuery($scopeType, $scopeId, $branchId);

        $totalCount = (clone $query)->count();

        // Sample first 10 products
        $sampleProducts = (clone $query)
            ->with(['category:id,name'])
            ->select(['id', 'code', 'name', 'category_id', 'unit', 'cost_price', 'selling_price'])
            ->orderBy('id')
            ->limit(10)
            ->get();

        // Fetch branch stocks for these 10 items if branchId is provided
        $branchStocks = collect();
        if ($branchId && $sampleProducts->isNotEmpty()) {
            $branchStocks = BranchStock::withoutGlobalScopes()
                ->where('branch_id', $branchId)
                ->whereIn('product_id', $sampleProducts->pluck('id'))
                ->get()
                ->keyBy('product_id');
        }

        $previewItems = $sampleProducts->map(function ($product) use ($branchStocks, $targetField, $percentage, $rounding) {
            /** @var BranchStock|null $bs */
            $bs = $branchStocks->get($product->id);

            $currentCost = (float) ($bs?->cost_price ?? $product->cost_price ?? 0);
            $currentSelling = (float) ($bs?->selling_price ?? $product->selling_price ?? 0);

            $newCost = $currentCost;
            $newSelling = $currentSelling;

            if ($targetField === 'cost_price' || $targetField === 'both') {
                $newCost = $this->calculateNewPrice($currentCost, $percentage, $rounding);
            }

            if ($targetField === 'selling_price' || $targetField === 'both') {
                $newSelling = $this->calculateNewPrice($currentSelling, $percentage, $rounding);
            }

            return [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'category_name' => $product->category?->name ?? 'Uncategorized',
                'unit' => $product->unit ?? 'pcs',
                'current_cost_price' => $currentCost,
                'new_cost_price' => $newCost,
                'cost_diff' => round($newCost - $currentCost, 2),
                'current_selling_price' => $currentSelling,
                'new_selling_price' => $newSelling,
                'selling_diff' => round($newSelling - $currentSelling, 2),
            ];
        });

        return [
            'total_count' => $totalCount,
            'sample_items' => $previewItems,
        ];
    }

    /**
     * Apply batch price update in chunks of 250 with bulk history insertion.
     *
     * @param array<int> $branchIds
     * @return int Number of branch stock records updated or created
     */
    public function applyBatchUpdate(
        array $branchIds,
        string $scopeType,
        ?int $scopeId,
        string $targetField,
        float $percentage,
        string $rounding,
        ?string $customNote,
        int $userId
    ): int {
        $totalProcessed = 0;
        $sign = $percentage >= 0 ? '+' : '';
        $fieldLabel = match ($targetField) {
            'cost_price' => 'Cost Price',
            'selling_price' => 'Selling Price',
            default => 'Cost & Selling Price',
        };

        $scopeLabel = 'All Products';
        if ($scopeType === 'category' && $scopeId) {
            $cat = Category::find($scopeId);
            $scopeLabel = 'Category: ' . ($cat?->name ?? (string) $scopeId);
        } elseif ($scopeType === 'group' && $scopeId) {
            $grp = Group::withoutGlobalScopes()->find($scopeId);
            $scopeLabel = 'Group: ' . ($grp?->name ?? (string) $scopeId);
        }

        $autoReason = "Batch update: {$sign}{$percentage}% on {$fieldLabel} ({$scopeLabel})";
        if (!empty($customNote)) {
            $autoReason .= ' - ' . trim($customNote);
        }

        $now = now();

        DB::transaction(function () use (
            $branchIds,
            $scopeType,
            $scopeId,
            $targetField,
            $percentage,
            $rounding,
            $autoReason,
            $userId,
            $now,
            &$totalProcessed
        ) {
            foreach ($branchIds as $branchId) {
                $query = $this->buildScopeQuery($scopeType, $scopeId, $branchId);

                $query->select(['id', 'code', 'name', 'cost_price', 'selling_price'])
                    ->orderBy('id')
                    ->chunkById(250, function (Collection $products) use (
                        $branchId,
                        $targetField,
                        $percentage,
                        $rounding,
                        $autoReason,
                        $userId,
                        $now,
                        &$totalProcessed
                    ) {
                        /** @var Collection<int, BranchStock> $existingStocks */
                        $existingStocks = BranchStock::withoutGlobalScopes()
                            ->where('branch_id', $branchId)
                            ->whereIn('product_id', $products->pluck('id'))
                            ->get()
                            ->keyBy('product_id');

                        $historyRecords = [];

                        foreach ($products as $product) {
                            /** @var BranchStock|null $bs */
                            $bs = $existingStocks->get($product->id);

                            $oldCost = $bs ? ($bs->cost_price !== null ? (float) $bs->cost_price : null) : ($product->cost_price !== null ? (float) $product->cost_price : null);
                            $oldSelling = $bs ? ($bs->selling_price !== null ? (float) $bs->selling_price : null) : ($product->selling_price !== null ? (float) $product->selling_price : null);

                            $newCost = $oldCost;
                            $newSelling = $oldSelling;

                            if ($targetField === 'cost_price' || $targetField === 'both') {
                                $newCost = $oldCost !== null ? $this->calculateNewPrice((float) $oldCost, $percentage, $rounding) : 0.0;
                            }

                            if ($targetField === 'selling_price' || $targetField === 'both') {
                                $newSelling = $oldSelling !== null ? $this->calculateNewPrice((float) $oldSelling, $percentage, $rounding) : 0.0;
                            }

                            $costChanged = abs((float) ($oldCost ?? 0) - (float) ($newCost ?? 0)) > 0.0001;
                            $sellingChanged = abs((float) ($oldSelling ?? 0) - (float) ($newSelling ?? 0)) > 0.0001;

                            if (!$costChanged && !$sellingChanged) {
                                continue;
                            }

                            if ($bs) {
                                $bs->update([
                                    'cost_price' => $newCost,
                                    'selling_price' => $newSelling,
                                ]);
                            } else {
                                BranchStock::withoutGlobalScopes()->create([
                                    'product_id' => $product->id,
                                    'branch_id' => $branchId,
                                    'quantity' => 0,
                                    'cost_price' => $newCost,
                                    'selling_price' => $newSelling,
                                ]);
                            }

                            $totalProcessed++;

                            $historyRecords[] = [
                                'product_id' => $product->id,
                                'branch_id' => $branchId,
                                'old_cost_price' => $oldCost,
                                'new_cost_price' => $newCost,
                                'old_selling_price' => $oldSelling,
                                'new_selling_price' => $newSelling,
                                'change_type' => 'batch_pricing',
                                'reason' => $autoReason,
                                'changed_by' => $userId,
                                'effective_date' => $now,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }

                        if (!empty($historyRecords)) {
                            ProductPriceHistory::insert($historyRecords);
                        }

                        unset($existingStocks, $historyRecords);
                    });
            }
        });

        return $totalProcessed;
    }
}
