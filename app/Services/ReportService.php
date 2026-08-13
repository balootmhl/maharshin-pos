<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get data for Sales Report
     */
    public function getSalesReportData(string $startDate, string $endDate, ?int $branchId, string $groupBy): array
    {
        $query = Sale::query()
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->whereNull('deleted_at');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        // Summary stats
        $summary = (clone $query)->selectRaw('
            COUNT(*) as total_sales,
            SUM(total_amount) as total_revenue,
            SUM(paid_amount) as total_paid,
            SUM(credit_amount) as total_credit,
            AVG(total_amount) as average_sale
        ')->first();

        // Sales by date
        $salesByDate = (clone $query)
            ->selectRaw('
                DATE(sale_date) as date,
                COUNT(*) as sales_count,
                SUM(total_amount) as total_amount,
                SUM(paid_amount) as paid_amount
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Sales by payment status
        $salesByStatus = (clone $query)
            ->selectRaw('payment_status, COUNT(*) as count, SUM(total_amount) as total')
            ->groupBy('payment_status')
            ->get();

        // Top products
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->whereNull('sales.deleted_at')
            ->whereNull('sale_items.deleted_at')
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->selectRaw('products.name, products.code, SUM(sale_items.quantity) as qty_sold, SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return [
            'branches' => Branch::where('is_active', true)->get(['id', 'name']),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
                'group_by' => $groupBy,
            ],
            'summary' => $summary,
            'salesByDate' => $salesByDate,
            'salesByStatus' => $salesByStatus,
            'topProducts' => $topProducts,
        ];
    }

    /**
     * Get data for Low Stock Report
     */
    public function getLowStockReportData(?int $branchId, int $threshold): array
    {
        $query = BranchStock::with(['product:id,name,code,low_stock_alert,unit', 'branch:id,name'])
            ->where('quantity', '<=', DB::raw('(SELECT low_stock_alert FROM products WHERE products.id = branch_stocks.product_id)'));

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $lowStockItems = $query->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'branch' => $item->branch?->name,
                'product_name' => $item->product?->name,
                'product_code' => $item->product?->code,
                'unit' => $item->product?->unit,
                'current_stock' => $item->quantity,
                'low_stock_alert' => $item->product?->low_stock_alert ?? 10,
                'status' => $item->quantity == 0 ? 'out_of_stock' : 'low_stock',
            ];
        });

        // Also get products with zero stock (not in branch_stocks at all)
        $allProducts = Product::where('is_active', true)->pluck('id');
        $branches = Branch::where('is_active', true)->get();

        $outOfStock = [];
        foreach ($branches as $branch) {
            if ($branchId && $branch->id != $branchId) {
                continue;
            }

            $productsInBranch = BranchStock::where('branch_id', $branch->id)->pluck('product_id');
            $missingProducts = Product::whereNotIn('id', $productsInBranch)
                ->where('is_active', true)
                ->get(['id', 'name', 'code', 'unit', 'low_stock_alert']);

            foreach ($missingProducts as $product) {
                $outOfStock[] = [
                    'id' => "missing-{$branch->id}-{$product->id}",
                    'branch' => $branch->name,
                    'product_name' => $product->name,
                    'product_code' => $product->code,
                    'unit' => $product->unit,
                    'current_stock' => 0,
                    'low_stock_alert' => $product->low_stock_alert ?? 10,
                    'status' => 'out_of_stock',
                ];
            }
        }

        return [
            'branches' => $branches->map(fn ($b) => ['id' => $b->id, 'name' => $b->name]),
            'filters' => [
                'branch_id' => $branchId,
                'threshold' => $threshold,
            ],
            'lowStockItems' => $lowStockItems->merge($outOfStock)->sortBy('current_stock')->values(),
            'summary' => [
                'low_stock_count' => $lowStockItems->where('status', 'low_stock')->count(),
                'out_of_stock_count' => $lowStockItems->where('status', 'out_of_stock')->count() + count($outOfStock),
            ],
        ];
    }

    /**
     * Get data for Daily Summary (for Dashboard)
     */
    public function getDailySummaryData(): array
    {
        $today = now()->format('Y-m-d');

        $todaySales = Sale::whereDate('sale_date', $today)
            ->selectRaw('
                COUNT(*) as total_sales,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(paid_amount), 0) as total_cash
            ')
            ->first();

        $yesterdaySales = Sale::whereDate('sale_date', now()->subDay()->format('Y-m-d'))
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_revenue')
            ->first();

        $percentChange = $yesterdaySales->total_revenue > 0
            ? (($todaySales->total_revenue - $yesterdaySales->total_revenue) / $yesterdaySales->total_revenue) * 100
            : 0;

        return [
            'today_sales' => $todaySales->total_sales ?? 0,
            'today_revenue' => $todaySales->total_revenue ?? 0,
            'today_cash' => $todaySales->total_cash ?? 0,
            'percent_change' => round($percentChange, 1),
        ];
    }

    /**
     * Get data for Daily Profit Report
     */
    public function getDailyProfitReportData(User $user, string $date, ?int $branchId): array
    {
        if (!$user->is_super_admin) {
            $branchId = $user->branch_id;
        }

        // Base sale query for the selected date
        $saleQuery = Sale::withoutGlobalScopes()
            ->whereDate('sale_date', $date)
            ->whereNull('deleted_at')
            ->with(['customer:id,name', 'branch:id,name']);

        if ($branchId) {
            $saleQuery->where('branch_id', $branchId);
        } elseif (!$user->is_super_admin) {
            $saleQuery->where('branch_id', null);
        }

        $sales = $saleQuery->get();
        $saleIds = $sales->pluck('id');

        // Load sale items with product info and branch_stock cost_price via raw join
        $rawItems = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->leftJoin(DB::raw('(SELECT product_id, branch_id, MAX(cost_price) as cost_price FROM branch_stocks WHERE deleted_at IS NULL GROUP BY product_id, branch_id) as bs'), function ($join) {
                $join->on('bs.product_id', '=', 'si.product_id')
                     ->on('bs.branch_id', '=', 's.branch_id');
            })
            ->whereIn('si.sale_id', $saleIds)
            ->whereNull('si.deleted_at')
            ->select([
                'si.id',
                'si.sale_id',
                'si.product_id',
                'si.quantity',
                'si.unit_price',
                'si.subtotal',
                'p.name as product_name',
                'p.code as product_code',
                DB::raw('COALESCE(bs.cost_price, p.cost_price, 0) as cost_price'),
                DB::raw('(si.unit_price - COALESCE(bs.cost_price, p.cost_price, 0)) as profit_per_unit'),
                DB::raw('(si.unit_price - COALESCE(bs.cost_price, p.cost_price, 0)) * si.quantity as item_profit'),
            ])
            ->get()
            ->groupBy('sale_id');

        // Build structured invoice list
        $invoices = $sales->map(function ($sale) use ($rawItems) {
            $items = collect($rawItems->get($sale->id, []));
            $invoiceProfit = $items->sum('item_profit') - (float) $sale->discount_amount;

            return [
                'id'             => $sale->id,
                'invoice_no'     => $sale->invoice_no,
                'customer_name'  => $sale->customer?->name,
                'branch_name'    => $sale->branch?->name,
                'sale_date'      => $sale->sale_date->format('Y-m-d'),
                'payment_status' => $sale->payment_status,
                'subtotal'       => (float) $sale->subtotal,
                'discount_amount'=> (float) $sale->discount_amount,
                'tax_amount'     => (float) $sale->tax_amount,
                'total_amount'   => (float) $sale->total_amount,
                'invoice_profit' => (float) $invoiceProfit,
                'items'          => $items->map(fn ($item) => [
                    'product_name'   => $item->product_name,
                    'product_code'   => $item->product_code,
                    'quantity'       => (float) $item->quantity,
                    'unit_price'     => (float) $item->unit_price,
                    'cost_price'     => (float) $item->cost_price,
                    'profit_per_unit'=> (float) $item->profit_per_unit,
                    'item_profit'    => (float) $item->item_profit,
                    'subtotal'       => (float) $item->subtotal,
                ])->values(),
            ];
        })->values();

        // Overall summary
        $totalSubtotal = $invoices->sum('subtotal');
        $totalDiscount = $invoices->sum('discount_amount');
        $totalTax      = $invoices->sum('tax_amount');
        $totalRevenue  = $invoices->sum('total_amount');
        $totalProfit   = $invoices->sum('invoice_profit');

        return [
            'branches' => $user->is_super_admin
                ? Branch::where('is_active', true)->get(['id', 'name'])
                : Branch::where('is_active', true)->where('id', $user->branch_id)->get(['id', 'name']),
            'filters'  => [
                'date'      => $date,
                'branch_id' => $branchId,
            ],
            'summary' => [
                'total_invoices' => $invoices->count(),
                'total_subtotal' => $totalSubtotal,
                'total_discount' => $totalDiscount,
                'total_tax'      => $totalTax,
                'total_revenue'  => $totalRevenue,
                'total_profit'   => $totalProfit,
            ],
            'invoices' => $invoices,
        ];
    }
}
