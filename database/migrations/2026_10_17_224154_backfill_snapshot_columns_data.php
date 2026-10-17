<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Backfill sale_items
        DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->leftJoin('branch_stocks as bs', function ($join) {
                $join->on('bs.product_id', '=', 'si.product_id')
                     ->on('bs.branch_id', '=', 's.branch_id');
            })
            ->whereNull('si.product_name')
            ->select([
                'si.id',
                'p.name as product_name',
                'p.code as product_code',
                'p.unit',
                DB::raw('COALESCE(bs.cost_price, p.cost_price, 0) as cost_price'),
            ])
            ->orderBy('si.id')
            ->chunk(500, function ($items) {
                foreach ($items as $item) {
                    DB::table('sale_items')
                        ->where('id', $item->id)
                        ->update([
                            'product_name' => $item->product_name,
                            'product_code' => $item->product_code,
                            'unit'         => $item->unit ?? 'pcs',
                            'cost_price'   => $item->cost_price ?? 0,
                        ]);
                }
            });

        // 2. Backfill purchase_items
        DB::table('purchase_items as pi')
            ->join('products as p', 'pi.product_id', '=', 'p.id')
            ->whereNull('pi.product_name')
            ->select([
                'pi.id',
                'p.name as product_name',
                'p.code as product_code',
                'p.unit',
            ])
            ->orderBy('pi.id')
            ->chunk(500, function ($items) {
                foreach ($items as $item) {
                    DB::table('purchase_items')
                        ->where('id', $item->id)
                        ->update([
                            'product_name' => $item->product_name,
                            'product_code' => $item->product_code,
                            'unit'         => $item->unit ?? 'pcs',
                        ]);
                }
            });

        // 3. Backfill sale_return_items
        DB::table('sale_return_items as sri')
            ->leftJoin('sale_items as si', 'sri.sale_item_id', '=', 'si.id')
            ->join('products as p', 'sri.product_id', '=', 'p.id')
            ->whereNull('sri.product_name')
            ->select([
                'sri.id',
                'p.name as product_name',
                'p.code as product_code',
                DB::raw('COALESCE(si.cost_price, p.cost_price, 0) as cost_price'),
            ])
            ->orderBy('sri.id')
            ->chunk(500, function ($items) {
                foreach ($items as $item) {
                    DB::table('sale_return_items')
                        ->where('id', $item->id)
                        ->update([
                            'product_name' => $item->product_name,
                            'product_code' => $item->product_code,
                            'cost_price'   => $item->cost_price ?? 0,
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive: down does not need to empty columns
    }
};
