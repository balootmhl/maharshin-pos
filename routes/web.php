<?php

use App\Http\Controllers\Api\ProductSearchController;
use Illuminate\Http\Request;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchStockController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerCreditLedgerController;
use App\Http\Controllers\CustomerPaymentController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\PlaygroundController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductPricingController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockHistoryController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\UserController;
use App\Models\BranchStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');
Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $reportController = app(ReportController::class);
        $dailySummary = $reportController->dailySummary();

        // Count low stock items
        $lowStockCount = BranchStock::whereRaw('quantity <= (SELECT low_stock_alert FROM products WHERE products.id = branch_stocks.product_id)')
            ->count();

        // 1. Recent Sales
        $recentSales = \App\Models\Sale::with(['customer:id,name', 'branch:id,name'])
            ->whereNull('deleted_at')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_no' => $sale->invoice_no,
                    'customer_name' => $sale->customer?->name ?? 'Walk-in Customer',
                    'branch_name' => $sale->branch?->name ?? 'Head Office',
                    'total_amount' => (float) $sale->total_amount,
                    'payment_status' => $sale->payment_status,
                    'sale_date' => $sale->sale_date->format('Y-m-d H:i'),
                ];
            });

        // 2. Top Selling Products
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereNull('sales.deleted_at')
            ->selectRaw('products.name, products.code, SUM(sale_items.quantity) as qty_sold, SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                return [
                    'name' => $p->name,
                    'code' => $p->code,
                    'qty_sold' => (float) $p->qty_sold,
                    'revenue' => (float) $p->revenue,
                ];
            });

        // 3. Sales Trend (Last 7 Days)
        $salesTrend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            $sales = \App\Models\Sale::whereDate('sale_date', $date)
                ->whereNull('deleted_at')
                ->selectRaw('COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count')
                ->first();
            return [
                'date' => now()->subDays($daysAgo)->format('M d'),
                'revenue' => (float) ($sales->revenue ?? 0),
                'sales_count' => (int) ($sales->count ?? 0),
            ];
        })->values()->toArray();

        // 4. Stock Summary
        $totalProductsCount = \App\Models\Product::where('is_active', true)->count();
        $outOfStockCount = BranchStock::where('quantity', 0)->count();
        $stockSummary = [
            'total_products' => $totalProductsCount,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
        ];

        return Inertia::render('dashboard', [
            'dailySummary' => $dailySummary,
            'lowStockCount' => $lowStockCount,
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
            'salesTrend' => $salesTrend,
            'stockSummary' => $stockSummary,
        ]);
    })->name('dashboard');

    Route::group(['middleware' => ['role:god']], function () {
        Route::get('secret', function () {
            return Inertia::render('secret');
        })->name('secret');

        Route::get('playground', PlaygroundController::class)->name('playground');
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
        Route::get('roles/{role}/permissions', [App\Http\Controllers\RolePermissionController::class, 'edit'])->name('roles.permissions.edit');
        Route::put('roles/{role}/permissions', [App\Http\Controllers\RolePermissionController::class, 'update'])->name('roles.permissions.update');
        Route::resource('branches', BranchController::class);
        Route::post('branches/{branch}/module-passwords', [BranchController::class, 'updateModulePasswords'])->name('branches.module-passwords.update');
    });

    // Module Unlock Routes
    Route::get('modules/{module}/unlock', [\App\Http\Controllers\ModuleUnlockController::class, 'showUnlockForm'])->name('modules.unlock.prompt');
    Route::post('modules/{module}/unlock', [\App\Http\Controllers\ModuleUnlockController::class, 'unlockModule'])->name('modules.unlock.submit');

    Route::get('todos/export', [TodoController::class, 'export'])->name('todos.export');
    Route::resource('todos', TodoController::class);

    // 1. Inventory Module Routes
    Route::middleware(['module.gate:inventory'])->group(function () {
        Route::resource('categories', CategoryController::class);
        Route::resource('groups', GroupController::class);
        Route::get('products/pricing', [ProductPricingController::class, 'index'])->name('products.pricing');
        Route::post('products/pricing', [ProductPricingController::class, 'update'])->name('products.pricing.update');
        Route::get('products/export', [ProductController::class, 'export'])->name('products.export');
        Route::resource('products', ProductController::class);
        Route::resource('branch-stocks', BranchStockController::class)->only('index');
        Route::resource('stock-movements', StockMovementController::class)->only('index');
        Route::post('stock-adjustments/quick', [StockAdjustmentController::class, 'quickStore'])->name('stock-adjustments.quick');
        Route::resource('stock-adjustments', StockAdjustmentController::class)->only(['index', 'create', 'store', 'show']);
        Route::resource('stock-history', StockHistoryController::class)->only('index');
    });

    // 2. Customer Module Routes
    Route::middleware(['module.gate:customer'])->group(function () {
        Route::get('customers/{customer}/credit-ledger/export', [CustomerController::class, 'exportCreditLedger'])->name('customers.credit-ledger.export');
        Route::resource('customers', CustomerController::class);
        Route::resource('customer-payments', CustomerPaymentController::class);
        Route::resource('customer-credit-ledgers', CustomerCreditLedgerController::class)->only('index');
    });

    // 3. Supplier Module Routes
    Route::middleware(['module.gate:supplier'])->group(function () {
        Route::resource('suppliers', SupplierController::class);
    });

    // 4. Sale Module Routes
    Route::middleware(['module.gate:sale'])->group(function () {
        Route::get('sales/trash', [SaleController::class, 'trash'])->name('sales.trash');
        Route::post('sales/{sale}/restore', [SaleController::class, 'restore'])->name('sales.restore')->withTrashed();
        Route::delete('sales/{sale}/force-delete', [SaleController::class, 'forceDelete'])->name('sales.force-delete')->withTrashed();
        Route::get('sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');
        Route::resource('sales', SaleController::class);
        Route::resource('sale-returns', SaleReturnController::class);
    });

    // 5. Purchase Module Routes
    Route::middleware(['module.gate:purchase'])->group(function () {
        Route::get('purchases/trash', [PurchaseController::class, 'trash'])->name('purchases.trash');
        Route::post('purchases/{purchase}/restore', [PurchaseController::class, 'restore'])->name('purchases.restore')->withTrashed();
        Route::delete('purchases/{purchase}/force-delete', [PurchaseController::class, 'forceDelete'])->name('purchases.force-delete')->withTrashed();
        Route::get('purchases/{purchase}/print', [PurchaseController::class, 'print'])->name('purchases.print');
        Route::resource('purchases', PurchaseController::class);
    });

    require __DIR__.'/settings.php';

    Route::group(['middleware' => ['role:god']], function () {
        Route::resource('settings', SettingController::class)->only('index', 'update');
    });

    // Reports Gated individually
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::middleware(['module.gate:sale'])->group(function () {
            Route::get('sales', [ReportController::class, 'salesReport'])->name('sales');
            Route::get('daily-profit', [ReportController::class, 'dailyProfitReport'])->name('daily-profit');
        });
        Route::middleware(['module.gate:inventory'])->group(function () {
            Route::get('low-stock', [ReportController::class, 'lowStockReport'])->name('low-stock');
        });
    });

    // Product Search API (JSON endpoints for POS & Purchase)
    Route::get('api/products/search', [ProductSearchController::class, 'search'])->name('api.products.search');
    Route::get('api/products/barcode-lookup', [ProductSearchController::class, 'barcodeLookup'])->name('api.products.barcode-lookup');

    // Debug & Layout Preview Routes
    Route::prefix('debug')->group(function () {
        Route::get('invoice', function (Request $request) {
            $sale = \App\Models\Sale::latest()->first();
            if (!$sale) return "No sales found in database for preview. Please create a sale first.";
            
            $sale->load(['branch', 'customer', 'saleItems.product', 'createdBy']);
            return view('print.invoice', [
                'sale' => $sale,
                'format' => $request->query('format', 'a4'),
            ]);
        })->name('debug.invoice');

        Route::get('po', function (Request $request) {
            $purchase = \App\Models\Purchase::latest()->first();
            if (!$purchase) return "No purchases found in database for preview. Please create a purchase PO first.";
            
            $purchase->load(['branch', 'supplier', 'purchaseItems.product', 'createdBy']);
            return view('print.purchase_order', [
                'purchase' => $purchase,
                'format' => $request->query('format', 'a4'),
            ]);
        })->name('debug.po');
    });

});

Route::impersonate();

require __DIR__.'/auth.php';
