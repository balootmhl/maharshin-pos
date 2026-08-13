<?php

namespace App\Http\Controllers;

use App\Models\BranchStock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BranchStockController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:stocks.view', only: ['index']),
        ];
    }

    public function index(Request $request): Response
    {
        $branchStocks = QueryBuilder::for(BranchStock::class)
            ->with(['product', 'branch'])
            ->allowedFilters([
                AllowedFilter::callback('product.name', function ($query, $value) {
                    $query->whereHas('product', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                          ->orWhere('code', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::callback('branch.name', function ($query, $value) {
                    $query->whereHas('branch', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::scope('low_stock'),
            ])
            ->allowedSorts(['quantity', 'updated_at'])
            ->defaultSort('updated_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('BranchStock/index', [
            'branchStocks' => $branchStocks,
        ]);
    }
}
