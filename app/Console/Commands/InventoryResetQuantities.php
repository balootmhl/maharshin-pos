<?php

namespace App\Console\Commands;

use App\Models\BranchStock;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InventoryResetQuantities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:reset-quantities';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set all branch stock quantities to 0 (Soft Reset)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->alert('⚠️  WARNING: You are about to RESET ALL STOCK QUANTITIES TO 0! ⚠️');
        $this->warn('This action will set the quantity of EVERY product in EVERY branch to 0.');
        $this->warn('This is a "Soft Reset" - it preserves sales, purchases, and movement history, but current stock levels will be wiped.');
        
        if (!$this->confirm('Are you absolutely sure you want to proceed?', false)) {
            $this->info('Operation cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Starting inventory reset...');

        // We use withoutGlobalScopes to ensure we catch stocks from all branches
        $query = BranchStock::withoutGlobalScopes();
        $count = $query->count();

        if ($count === 0) {
            $this->info('No branch stocks found to reset.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        // Process in chunks to manage memory
        $query->chunk(100, function ($stocks) use ($bar) {
            foreach ($stocks as $stock) {
                // We create a transaction for each item to ensure atomicity of the update+log
                // though strictly speaking not critical for a bulk reset, it's good practice.
                // However, for speed in a loop, straightforward save is fine.
                // The key is $stock->save() triggers the activity log trait.
                
                $stock->quantity = 0;
                $stock->save(); 
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        
        $this->info("✅ Successfully reset {$count} branch stock records to 0.");
        
        return Command::SUCCESS;
    }
}
