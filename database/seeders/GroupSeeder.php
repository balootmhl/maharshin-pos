<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Group;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();

        // Sample shelf locations for each branch
        $shelfNames = ['Shelf A', 'Shelf B', 'Shelf C', 'Counter Display', 'Back Storage'];

        foreach ($branches as $branch) {
            foreach ($shelfNames as $index => $name) {
                Group::create([
                    'code' => 'GRP-' . $branch->id . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                    'name' => $name,
                    'branch_id' => $branch->id,
                    'description' => "{$name} in {$branch->name}",
                    'is_active' => true,
                ]);
            }
        }
    }
}
