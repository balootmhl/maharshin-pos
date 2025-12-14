<?php

use App\Http\Controllers\PlaygroundController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');
Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $reportController = new App\Http\Controllers\ReportController;
        $dailySummary = $reportController->dailySummary();

        // Count low stock items
        $lowStockCount = App\Models\BranchStock::whereColumn('quantity', '<=',
            \Illuminate\Support\Facades\DB::raw('(SELECT low_stock_alert FROM products WHERE products.id = branch_stocks.product_id)')
        )->count();

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

    Route::resource('users', App\Http\Controllers\UserController::class);

    Route::resource('roles', App\Http\Controllers\RoleController::class);

    Route::get('todos/export', [App\Http\Controllers\TodoController::class, 'export'])->name('todos.export');
    Route::resource('todos', App\Http\Controllers\TodoController::class);

    Route::resource('branches', App\Http\Controllers\BranchController::class);

    Route::resource('categories', App\Http\Controllers\CategoryController::class);

    Route::resource('products', App\Http\Controllers\ProductController::class);

    Route::get('customers/{customer}/credit-ledger/export', [App\Http\Controllers\CustomerController::class, 'exportCreditLedger'])->name('customers.credit-ledger.export');
    Route::resource('customers', App\Http\Controllers\CustomerController::class);

    Route::resource('suppliers', App\Http\Controllers\SupplierController::class);

    Route::resource('sales', App\Http\Controllers\SaleController::class);

    Route::resource('purchases', App\Http\Controllers\PurchaseController::class);

    Route::resource('sale-returns', App\Http\Controllers\SaleReturnController::class);

    Route::resource('customer-payments', App\Http\Controllers\CustomerPaymentController::class);

    Route::resource('customer-credit-ledgers', App\Http\Controllers\CustomerCreditLedgerController::class)->only('index');

    Route::resource('branch-stocks', App\Http\Controllers\BranchStockController::class)->only('index');

    Route::resource('stock-movements', App\Http\Controllers\StockMovementController::class)->only('index');

    Route::resource('settings', App\Http\Controllers\SettingController::class)->only('index', 'update');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('sales', [App\Http\Controllers\ReportController::class, 'salesReport'])->name('sales');
        Route::get('low-stock', [App\Http\Controllers\ReportController::class, 'lowStockReport'])->name('low-stock');
    });

});

Route::impersonate();

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
