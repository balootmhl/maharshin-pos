<?php

namespace App\Http\Controllers;

use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BranchStockController extends Controller
{
    public function index(Request $request): View
    {
        $branchStocks = BranchStock::with(product,branch)->get();

        return view('stock.index', [
            'stocks' => $stocks,
        ]);
    }
}
