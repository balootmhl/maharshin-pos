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
        Schema::create('branch_module_passwords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('module');
            $table->string('password');
            $table->timestamps();

            $table->unique(['branch_id', 'module']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_module_passwords');
    }
};
