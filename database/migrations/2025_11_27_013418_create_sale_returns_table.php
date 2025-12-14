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
        Schema::disableForeignKeyConstraints();

        Schema::create('sale_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_no', 50)->unique()->index();
            $table->foreignId('sale_id')->constrained();
            $table->foreignId('branch_id')->constrained();
            $table->date('return_date')->index();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('refund_amount', 15, 2)->default(0);
            $table->string('refund_method', 50)->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
