<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleReturnStoreRequest;
use App\Http\Requests\SaleReturnUpdateRequest;
use App\Models\SaleReturn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SaleReturnController extends Controller
{
    public function index(Request $request): View
    {
        $saleReturns = SaleReturn::all();

        return view('saleReturn.index', [
            'saleReturns' => $saleReturns,
        ]);
    }

    public function create(Request $request): View
    {
        return view('saleReturn.create');
    }

    public function store(SaleReturnStoreRequest $request): RedirectResponse
    {
        $saleReturn = SaleReturn::create($request->validated());

        $request->session()->flash('saleReturn.id', $saleReturn->id);

        return redirect()->route('saleReturns.index');
    }

    public function show(Request $request, SaleReturn $saleReturn): View
    {
        return view('saleReturn.show', [
            'saleReturn' => $saleReturn,
        ]);
    }

    public function edit(Request $request, SaleReturn $saleReturn): View
    {
        return view('saleReturn.edit', [
            'saleReturn' => $saleReturn,
        ]);
    }

    public function update(SaleReturnUpdateRequest $request, SaleReturn $saleReturn): RedirectResponse
    {
        $saleReturn->update($request->validated());

        $request->session()->flash('saleReturn.id', $saleReturn->id);

        return redirect()->route('saleReturns.index');
    }

    public function destroy(Request $request, SaleReturn $saleReturn): RedirectResponse
    {
        $saleReturn->delete();

        return redirect()->route('saleReturns.index');
    }
}
