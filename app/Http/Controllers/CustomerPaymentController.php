<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerPaymentStoreRequest;
use App\Http\Requests\CustomerPaymentUpdateRequest;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\CustomerPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $customerPayments = CustomerPayment::with(['customer', 'branch', 'createdBy'])->latest()->get();

        return Inertia::render('CustomerPayment/index', [
            'customerPayments' => $customerPayments,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('CustomerPayment/create', [
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code', 'current_balance']),
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function store(CustomerPaymentStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            // Generate unique payment number
            $maxPaymentNo = CustomerPayment::withTrashed()
                ->selectRaw('MAX(CAST(SUBSTRING(payment_no, 5) AS UNSIGNED)) as max_num')
                ->value('max_num');
            $nextNumber = ($maxPaymentNo ?? 0) + 1;
            $paymentNo = 'PAY-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Create the payment
            $customerPayment = CustomerPayment::create([
                'payment_no' => $paymentNo,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Update customer balance
            $customer = Customer::find($validated['customer_id']);
            $customer->decrement('current_balance', $validated['amount']);

            // Create credit ledger entry
            CustomerCreditLedger::create([
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'transaction_date' => $validated['payment_date'],
                'transaction_type' => 'payment',
                'reference_type' => CustomerPayment::class,
                'reference_id' => $customerPayment->id,
                'reference_no' => $paymentNo,
                'debit' => 0,
                'credit' => $validated['amount'],
                'balance' => $customer->fresh()->current_balance,
                'description' => "Payment received: {$paymentNo}",
                'created_by' => Auth::id(),
            ]);
        });

        return redirect()->route('customer-payments.index')->with('success', 'Payment recorded successfully.');
    }

    public function show(Request $request, CustomerPayment $customerPayment): Response
    {
        $customerPayment->load(['customer', 'branch', 'createdBy']);

        return Inertia::render('CustomerPayment/show', [
            'customerPayment' => $customerPayment,
        ]);
    }

    public function edit(Request $request, CustomerPayment $customerPayment): Response
    {
        return Inertia::render('CustomerPayment/edit', [
            'customerPayment' => $customerPayment,
            'customers' => Customer::where('is_active', true)->get(['id', 'name', 'code']),
            'branches' => Branch::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function update(CustomerPaymentUpdateRequest $request, CustomerPayment $customerPayment): RedirectResponse
    {
        $customerPayment->update($request->validated());

        $request->session()->flash('customerPayment.id', $customerPayment->id);

        return redirect()->route('customer-payments.index');
    }

    public function destroy(Request $request, CustomerPayment $customerPayment): RedirectResponse
    {
        $customerPayment->delete();

        return redirect()->route('customer-payments.index');
    }
}
