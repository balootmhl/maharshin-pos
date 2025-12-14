<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Sales Report
     */
    public function salesReport(Request $request): Response
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $groupBy = $request->get('group_by', 'daily'); // daily, weekly, monthly

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
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->selectRaw('products.name, products.code, SUM(sale_items.quantity) as qty_sold, SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return Inertia::render('Report/SalesReport', [
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
        ]);
    }

    /**
     * Low Stock Report
     */
    public function lowStockReport(Request $request): Response
    {
        $branchId = $request->get('branch_id');
        $threshold = $request->get('threshold', 10);

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

        return Inertia::render('Report/LowStockReport', [
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
        ]);
    }

    /**
     * Daily Sales Summary (for Dashboard)
     */
    public function dailySummary(): array
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
}
