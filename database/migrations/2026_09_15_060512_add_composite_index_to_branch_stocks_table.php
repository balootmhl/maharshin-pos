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
        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->index(['branch_id', 'product_id'], 'branch_stocks_branch_product_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->dropIndex('branch_stocks_branch_product_idx');
        });
    }
};
