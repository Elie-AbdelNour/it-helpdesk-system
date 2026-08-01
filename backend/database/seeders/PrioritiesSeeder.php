<?php

namespace Database\Seeders;

use App\Models\Priority;
use Illuminate\Database\Seeder;

class PrioritiesSeeder extends Seeder
{
    public function run(): void
    {
        $priorities = [
            ['name' => 'Low', 'level' => 1, 'targetresolutionhours' => 72],
            ['name' => 'Medium', 'level' => 2, 'targetresolutionhours' => 48],
            ['name' => 'High', 'level' => 3, 'targetresolutionhours' => 24],
            ['name' => 'Critical', 'level' => 4, 'targetresolutionhours' => 4],
        ];

        foreach ($priorities as $priority) {
            Priority::updateOrCreate(['name' => $priority['name']], $priority);
        }
    }
}
