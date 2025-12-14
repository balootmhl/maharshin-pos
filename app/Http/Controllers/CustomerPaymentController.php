<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerPaymentStoreRequest;
use App\Http\Requests\CustomerPaymentUpdateRequest;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $customerPayments = CustomerPayment::with(['customer', 'branch', 'createdBy'])->get();

        return Inertia::render('CustomerPayment/index', [
            'customerPayments' => $customerPayments,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('CustomerPayment/create', [
            'customers' => Customer::where('is_active', true)->get(),
            'branches' => Branch::where('is_active', true)->get(),
        ]);
    }

    public function store(CustomerPaymentStoreRequest $request): RedirectResponse
    {
        $customerPayment = CustomerPayment::create($request->validated());

        $request->session()->flash('customerPayment.id', $customerPayment->id);

        return redirect()->route('customer-payments.index');
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
            'customers' => Customer::where('is_active', true)->get(),
            'branches' => Branch::where('is_active', true)->get(),
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
