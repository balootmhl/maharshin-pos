<?php

namespace App\Http\Controllers;

use App\Models\CustomerCreditLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerCreditLedgerController extends Controller
{
    public function index(Request $request): Response
    {
        $ledgers = CustomerCreditLedger::with(['customer', 'branch', 'createdBy'])->latest()->get();

        return Inertia::render('CustomerCreditLedger/index', [
            'ledgers' => $ledgers,
        ]);
    }
}
