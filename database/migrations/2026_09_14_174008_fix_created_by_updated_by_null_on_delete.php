<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tables and their created_by FK constraints to fix.
     *
     * @var array<string, array<string, string>>
     */
    protected array $tables = [
        'products'                 => [
            'created_by' => 'products_created_by_foreign',
            'updated_by' => 'products_updated_by_foreign',
        ],
        'stock_movements'          => ['created_by' => 'stock_movements_created_by_foreign'],
        'customer_credit_ledgers'  => ['created_by' => 'customer_credit_ledgers_created_by_foreign'],
        'sales'                    => ['created_by' => 'sales_created_by_foreign'],
        'purchases'                => ['created_by' => 'purchases_created_by_foreign'],
        'customer_payments'        => ['created_by' => 'customer_payments_created_by_foreign'],
        'sale_returns'             => ['created_by' => 'sale_returns_created_by_foreign'],
        'stock_adjustments'        => ['created_by' => 'stock_adjustments_created_by_foreign'],
    ];

    /**
     * Run the migrations.
     *
     * Drops existing FK constraints and re-creates them with nullOnDelete.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ($this->tables as $table => $columns) {
            foreach ($columns as $column => $constraint) {
                Schema::table($table, function (Blueprint $table) use ($constraint) {
                    // Drop the existing FK constraint
                    $table->dropForeign($constraint);
                });

                Schema::table($table, function (Blueprint $table) use ($column) {
                    // Re-create with nullOnDelete so deleting a user sets the column to NULL
                    $table->foreignId($column)
                        ->nullable()
                        ->change()
                        ->constrained('users')
                        ->nullOnDelete();
                });
            }
        }

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     *
     * Restores original RESTRICT behavior for created_by FK constraints.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ($this->tables as $table => $columns) {
            foreach ($columns as $column => $constraint) {
                Schema::table($table, function (Blueprint $table) use ($constraint) {
                    $table->dropForeign($constraint);
                });

                Schema::table($table, function (Blueprint $table) use ($column) {
                    $table->foreignId($column)
                        ->nullable()
                        ->change()
                        ->constrained('users');
                });
            }
        }

        Schema::enableForeignKeyConstraints();
    }
};
