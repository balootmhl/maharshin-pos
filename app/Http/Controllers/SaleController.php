<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleStoreRequest;
use App\Http\Requests\SaleUpdateRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $sales = Sale::with(['branch', 'customer', 'createdBy'])->latest()->get();

        return Inertia::render('Sale/index', [
            'sales' => $sales,
        ]);
    }

    public function create(Request $request): Response
    {
        // Generate invoice number
        $lastSale = Sale::latest()->first();
        $nextNumber = $lastSale ? (int) preg_replace('/[^0-9]/', '', $lastSale->invoice_no) + 1 : 1;
        $invoiceNo = 'INV-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        $defaultBranch = Branch::where('is_active', true)->first();

        // Get products with stock for the default branch
        $products = Product::with('category:id,name')
            ->where('is_active', true)
            ->get(['id', 'name', 'code', 'barcode', 'selling_price', 'cost_price', 'tax_rate', 'category_id', 'unit'])
            ->map(function ($product) use ($defaultBranch) {
                $stock = $defaultBranch ? BranchStock::where('branch_id', $defaultBranch->id)
                    ->where('product_id', $product->id)
                    ->value('quantity') ?? 0 : 0;
                $product->stock = $stock;

                return $product;
            });

        return Inertia::render('Sale/create', [
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code', 'credit_limit', 'current_balance']),
            'products' => $products,
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'invoiceNo' => $invoiceNo,
        ]);
    }

    public function store(SaleStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            // Generate unique invoice number by finding the max existing number
            $maxInvoiceNo = Sale::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(invoice_no, 5) AS UNSIGNED)) as max_num')
                ->value('max_num');
            $nextNumber = ($maxInvoiceNo ?? 0) + 1;
            $invoiceNo = 'INV-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Create the sale
            $sale = Sale::create([
                'invoice_no' => $invoiceNo,
                'branch_id' => $validated['branch_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_date' => $validated['sale_date'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => $validated['payment_status'],
                'payment_method' => $validated['payment_method'] ?? null,
                'paid_amount' => $validated['paid_amount'],
                'credit_amount' => $validated['credit_amount'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Create sale items and update stock
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update branch stock
                $branchStock = BranchStock::firstOrCreate(
                    ['branch_id' => $validated['branch_id'], 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );

                $oldQuantity = $branchStock->quantity;
                $branchStock->decrement('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => "Sale: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Update customer balance if credit sale
            if ($validated['customer_id'] && $validated['credit_amount'] > 0) {
                $customer = Customer::find($validated['customer_id']);
                $oldBalance = $customer->current_balance;
                $customer->increment('current_balance', $validated['credit_amount']);

                // Record credit ledger entry
                CustomerCreditLedger::create([
                    'customer_id' => $validated['customer_id'],
                    'branch_id' => $validated['branch_id'],
                    'transaction_date' => $validated['sale_date'],
                    'transaction_type' => 'credit',
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'reference_no' => $sale->invoice_no,
                    'debit' => $validated['credit_amount'],
                    'credit' => 0,
                    'balance' => $customer->fresh()->current_balance,
                    'description' => "Credit sale: {$sale->invoice_no}",
                    'created_by' => Auth::id(),
                ]);
            }
        });

        return redirect()->route('sales.index')->with('success', 'Sale completed successfully.');
    }

    public function show(Request $request, Sale $sale): Response
    {
        $sale->load(['branch', 'customer', 'saleItems.product', 'createdBy']);

        return Inertia::render('Sale/show', [
            'sale' => $sale,
        ]);
    }

    public function edit(Request $request, Sale $sale): Response
    {
        $sale->load('saleItems.product');

        return Inertia::render('Sale/edit', [
            'sale' => $sale,
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code', 'credit_limit', 'current_balance']),
            'products' => Product::with('category:id,name')
                ->where('is_active', true)
                ->get(['id', 'name', 'code', 'barcode', 'selling_price', 'cost_price', 'tax_rate', 'category_id', 'unit']),
        ]);
    }

    public function update(SaleUpdateRequest $request, Sale $sale): RedirectResponse
    {
        $sale->update($request->validated());

        $request->session()->flash('sale.id', $sale->id);

        return redirect()->route('sales.index');
    }

    public function destroy(Request $request, Sale $sale): RedirectResponse
    {
        $sale->delete();

        return redirect()->route('sales.index');
    }
}
