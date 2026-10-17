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
        Schema::create('product_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('old_cost_price', 15, 2)->nullable();
            $table->decimal('new_cost_price', 15, 2)->nullable();
            $table->decimal('old_selling_price', 15, 2)->nullable();
            $table->decimal('new_selling_price', 15, 2)->nullable();
            $table->string('change_type', 50)->default('manual');
            $table->string('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('effective_date')->useCurrent();
            $table->timestamps();

            $table->index(['product_id', 'branch_id']);
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_price_histories');
    }
};
