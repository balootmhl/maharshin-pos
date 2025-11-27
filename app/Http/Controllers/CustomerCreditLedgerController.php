<?php

namespace App\Http\Controllers;

use App\Models\CustomerCreditLedger;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CustomerCreditLedgerController extends Controller
{
    public function index(Request $request): View
    {
        $customerCreditLedgers = CustomerCreditLedger::with(customer,branch)->get();

        return view('customer-credit.index', [
            'ledgers' => $ledgers,
        ]);
    }
}
