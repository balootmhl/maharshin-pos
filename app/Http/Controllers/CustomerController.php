<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CustomerController extends Controller
{
    public function index(Request $request): View
    {
        $customers = Customer::all();

        return view('customer.index', [
            'customers' => $customers,
        ]);
    }

    public function create(Request $request): View
    {
        return view('customer.create');
    }

    public function store(CustomerStoreRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        $request->session()->flash('customer.id', $customer->id);

        return redirect()->route('customers.index');
    }

    public function show(Request $request, Customer $customer): View
    {
        return view('customer.show', [
            'customer' => $customer,
        ]);
    }

    public function edit(Request $request, Customer $customer): View
    {
        return view('customer.edit', [
            'customer' => $customer,
        ]);
    }

    public function update(CustomerUpdateRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        $request->session()->flash('customer.id', $customer->id);

        return redirect()->route('customers.index');
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        $customer->delete();

        return redirect()->route('customers.index');
    }
}
