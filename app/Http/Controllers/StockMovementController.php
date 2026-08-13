<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class StockMovementController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:stocks.view', only: ['index']),
        ];
    }

    public function index(Request $request): Response
    {
        $stockMovements = QueryBuilder::for(StockMovement::class)
            ->with(['product', 'branch', 'createdBy'])
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
                AllowedFilter::exact('movement_type'),
                AllowedFilter::scope('created_at_start'),
                AllowedFilter::scope('created_at_end'),
            ])
            ->allowedSorts(['created_at', 'quantity'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('StockMovement/index', [
            'stockMovements' => $stockMovements,
        ]);
    }
}
