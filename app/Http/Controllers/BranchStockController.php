<?php

namespace App\Http\Controllers;

use App\Models\BranchStock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchStockController extends Controller
{
    public function index(Request $request): Response
    {
        $branchStocks = BranchStock::with(['product', 'branch'])->get();

        return Inertia::render('BranchStock/index', [
            'branchStocks' => $branchStocks,
        ]);
    }
}
