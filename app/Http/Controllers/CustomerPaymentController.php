<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerPaymentStoreRequest;
use App\Http\Requests\CustomerPaymentUpdateRequest;
use App\Models\CustomerPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CustomerPaymentController extends Controller
{
    public function index(Request $request): View
    {
        $customerPayments = CustomerPayment::all();

        return view('customerPayment.index', [
            'customerPayments' => $customerPayments,
        ]);
    }

    public function create(Request $request): View
    {
        return view('customerPayment.create');
    }

    public function store(CustomerPaymentStoreRequest $request): RedirectResponse
    {
        $customerPayment = CustomerPayment::create($request->validated());

        $request->session()->flash('customerPayment.id', $customerPayment->id);

        return redirect()->route('customerPayments.index');
    }

    public function show(Request $request, CustomerPayment $customerPayment): View
    {
        return view('customerPayment.show', [
            'customerPayment' => $customerPayment,
        ]);
    }

    public function edit(Request $request, CustomerPayment $customerPayment): View
    {
        return view('customerPayment.edit', [
            'customerPayment' => $customerPayment,
        ]);
    }

    public function update(CustomerPaymentUpdateRequest $request, CustomerPayment $customerPayment): RedirectResponse
    {
        $customerPayment->update($request->validated());

        $request->session()->flash('customerPayment.id', $customerPayment->id);

        return redirect()->route('customerPayments.index');
    }

    public function destroy(Request $request, CustomerPayment $customerPayment): RedirectResponse
    {
        $customerPayment->delete();

        return redirect()->route('customerPayments.index');
    }
}
