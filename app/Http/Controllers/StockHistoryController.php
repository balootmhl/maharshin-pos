<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StockHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $activities = QueryBuilder::for(Activity::class)
            ->where('log_name', 'stock')
            ->allowedFilters([
                'description',
                AllowedFilter::callback('causer.name', function ($query, $value) {
                    $query->whereHas('causer', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('event'),
                AllowedFilter::exact('subject_type'),
                AllowedFilter::callback('date_start', function ($query, $value) {
                    $query->whereDate('created_at', '>=', $value);
                }),
                AllowedFilter::callback('date_end', function ($query, $value) {
                    $query->whereDate('created_at', '<=', $value);
                }),
            ])
            ->allowedSorts(['created_at', 'id'])
            ->defaultSort('-created_at')
            ->with(['causer'])
            ->with(['subject' => function ($query) {
                $query->morphWith([
                    \App\Models\BranchStock::class => ['product'],
                    \App\Models\StockMovement::class => ['product'],
                    \App\Models\StockAdjustment::class => ['product'],
                ]);
            }])
            ->paginate($request->input('per_page', 50))
            ->withQueryString();

        return Inertia::render('StockHistory/index', [
            'activities' => $activities,
        ]);
    }
}
