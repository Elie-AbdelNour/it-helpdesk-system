<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Seeder;

class StatusesSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'Open', 'sortorder' => 1],
            ['name' => 'In Progress', 'sortorder' => 2],
            ['name' => 'Pending', 'sortorder' => 3],
            ['name' => 'Resolved', 'sortorder' => 4],
            ['name' => 'Closed', 'sortorder' => 5],
        ];

        foreach ($statuses as $status) {
            Status::updateOrCreate(['name' => $status['name']], $status);
        }
    }
}
