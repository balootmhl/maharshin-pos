<?php

namespace App\Http\Controllers;

use App\Models\CustomerCreditLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\Branch;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CustomerCreditLedgerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:customers.view', only: ['index']),
        ];
    }

    public function index(Request $request): Response
    {
        $ledgers = QueryBuilder::for(CustomerCreditLedger::class)
            ->allowedFilters([
                AllowedFilter::callback('customer.name', function ($query, $value) {
                    $query->whereHas('customer', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                          ->orWhere('code', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('transaction_type'),
                AllowedFilter::scope('transaction_date_start'),
                AllowedFilter::scope('transaction_date_end'),
            ])
            ->allowedSorts(['transaction_date', 'debit', 'credit', 'balance', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['customer', 'branch', 'createdBy'])
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $branches = Branch::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('CustomerCreditLedger/index', [
            'ledgers' => $ledgers,
            'branches' => $branches,
        ]);
    }
}
