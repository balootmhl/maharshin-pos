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
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');
Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $reportController = new ReportController;
        $dailySummary = $reportController->dailySummary();

        // Count low stock items
        $lowStockCount = BranchStock::whereRaw('quantity <= (SELECT low_stock_alert FROM products WHERE products.id = branch_stocks.product_id)')
            ->count();

        return Inertia::render('dashboard', [
            'dailySummary' => $dailySummary,
            'lowStockCount' => $lowStockCount,
        ]);
    })->name('dashboard');

    Route::group(['middleware' => ['role:god']], function () {
        Route::get('secret', function () {
            return Inertia::render('secret');
        })->name('secret');
    });

    Route::get('playground', PlaygroundController::class)->name('playground');

    Route::resource('users', UserController::class);

    Route::resource('roles', RoleController::class);

    Route::get('todos/export', [TodoController::class, 'export'])->name('todos.export');
    Route::resource('todos', TodoController::class);

    Route::resource('branches', BranchController::class);

    Route::resource('categories', CategoryController::class);

    Route::resource('groups', GroupController::class);

    Route::get('products/pricing', [ProductPricingController::class, 'index'])->name('products.pricing');
    Route::post('products/pricing', [ProductPricingController::class, 'update'])->name('products.pricing.update');

    Route::get('products/export', [ProductController::class, 'export'])->name('products.export');
    Route::resource('products', ProductController::class);

    Route::get('customers/{customer}/credit-ledger/export', [CustomerController::class, 'exportCreditLedger'])->name('customers.credit-ledger.export');
    Route::resource('customers', CustomerController::class);

    Route::resource('suppliers', SupplierController::class);

    Route::get('sales/trash', [SaleController::class, 'trash'])->name('sales.trash');
    Route::post('sales/{sale}/restore', [SaleController::class, 'restore'])->name('sales.restore')->withTrashed();
    Route::delete('sales/{sale}/force-delete', [SaleController::class, 'forceDelete'])->name('sales.force-delete')->withTrashed();
    Route::get('sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');
    Route::resource('sales', SaleController::class);

    Route::get('purchases/trash', [PurchaseController::class, 'trash'])->name('purchases.trash');
    Route::post('purchases/{purchase}/restore', [PurchaseController::class, 'restore'])->name('purchases.restore')->withTrashed();
    Route::delete('purchases/{purchase}/force-delete', [PurchaseController::class, 'forceDelete'])->name('purchases.force-delete')->withTrashed();
    Route::get('purchases/{purchase}/print', [PurchaseController::class, 'print'])->name('purchases.print');
    Route::resource('purchases', PurchaseController::class);

    Route::resource('sale-returns', SaleReturnController::class);

    Route::resource('customer-payments', CustomerPaymentController::class);

    Route::resource('customer-credit-ledgers', CustomerCreditLedgerController::class)->only('index');

    Route::resource('branch-stocks', BranchStockController::class)->only('index');

    Route::resource('stock-movements', StockMovementController::class)->only('index');

    Route::post('stock-adjustments/quick', [StockAdjustmentController::class, 'quickStore'])->name('stock-adjustments.quick');
    Route::resource('stock-adjustments', StockAdjustmentController::class)->only(['index', 'create', 'store', 'show']);

    Route::resource('stock-history', StockHistoryController::class)->only('index');

    Route::resource('settings', SettingController::class)->only('index', 'update');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('sales', [ReportController::class, 'salesReport'])->name('sales');
        Route::get('low-stock', [ReportController::class, 'lowStockReport'])->name('low-stock');
        Route::get('daily-profit', [ReportController::class, 'dailyProfitReport'])->name('daily-profit');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
