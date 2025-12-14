<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleReturnStoreRequest;
use App\Http\Requests\SaleReturnUpdateRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $saleReturns = SaleReturn::with(['sale.customer', 'branch', 'createdBy'])->latest()->get();

        return Inertia::render('SaleReturn/index', [
            'saleReturns' => $saleReturns,
        ]);
    }

    public function create(Request $request): Response
    {
        // Get sales that can still be returned (not fully returned)
        $sales = Sale::with(['customer', 'saleItems.product', 'branch'])
            ->latest()
            ->limit(100)
            ->get();

        return Inertia::render('SaleReturn/create', [
            'sales' => $sales,
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function store(SaleReturnStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            // Generate unique return number by finding the max existing number
            $maxReturnNo = SaleReturn::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(return_no, 5) AS UNSIGNED)) as max_num')
                ->value('max_num');
            $nextNumber = ($maxReturnNo ?? 0) + 1;
            $returnNo = 'RET-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            $sale = Sale::find($validated['sale_id']);

            // Create the return
            $saleReturn = SaleReturn::create([
                'return_no' => $returnNo,
                'sale_id' => $validated['sale_id'],
                'branch_id' => $validated['branch_id'],
                'return_date' => $validated['return_date'],
                'total_amount' => $validated['total_amount'],
                'refund_amount' => $validated['refund_amount'],
                'refund_method' => $validated['refund_method'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Create return items and update stock
            foreach ($validated['items'] as $item) {
                SaleReturnItem::create([
                    'sale_return_id' => $saleReturn->id,
                    'sale_item_id' => $item['sale_item_id'],
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update branch stock (add back the returned items)
                $branchStock = BranchStock::firstOrCreate(
                    ['branch_id' => $validated['branch_id'], 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );

                $oldQuantity = $branchStock->quantity;
                $branchStock->increment('quantity', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'return',
                    'quantity' => $item['quantity'],
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $branchStock->fresh()->quantity,
                    'reference_type' => SaleReturn::class,
                    'reference_id' => $saleReturn->id,
                    'notes' => "Return: {$saleReturn->return_no}",
                    'created_by' => Auth::id(),
                ]);
            }

            // Update customer balance if refund is made against credit
            if ($sale->customer_id && $validated['refund_amount'] > 0) {
                $customer = Customer::find($sale->customer_id);
                if ($customer->current_balance > 0) {
                    $refundToCredit = min($validated['refund_amount'], $customer->current_balance);
                    $customer->decrement('current_balance', $refundToCredit);

                    CustomerCreditLedger::create([
                        'customer_id' => $sale->customer_id,
                        'branch_id' => $validated['branch_id'],
                        'transaction_date' => $validated['return_date'],
                        'transaction_type' => 'refund',
                        'reference_type' => SaleReturn::class,
                        'reference_id' => $saleReturn->id,
                        'reference_no' => $saleReturn->return_no,
                        'debit' => 0,
                        'credit' => $refundToCredit,
                        'balance' => $customer->fresh()->current_balance,
                        'description' => "Return refund: {$saleReturn->return_no}",
                        'created_by' => Auth::id(),
                    ]);
                }
            }
        });

        return redirect()->route('sale-returns.index')->with('success', 'Return processed successfully.');
    }

    public function show(Request $request, SaleReturn $saleReturn): Response
    {
        $saleReturn->load(['sale.customer', 'branch', 'saleReturnItems.product', 'createdBy']);

        return Inertia::render('SaleReturn/show', [
            'saleReturn' => $saleReturn,
        ]);
    }

    public function edit(Request $request, SaleReturn $saleReturn): Response
    {
        $saleReturn->load('saleReturnItems.product');

        return Inertia::render('SaleReturn/edit', [
            'saleReturn' => $saleReturn,
            'sales' => Sale::with(['customer', 'saleItems.product'])->get(),
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function update(SaleReturnUpdateRequest $request, SaleReturn $saleReturn): RedirectResponse
    {
        $saleReturn->update($request->validated());

        return redirect()->route('sale-returns.index');
    }

    public function destroy(Request $request, SaleReturn $saleReturn): RedirectResponse
    {
        $saleReturn->delete();

        return redirect()->route('sale-returns.index');
    }
}
