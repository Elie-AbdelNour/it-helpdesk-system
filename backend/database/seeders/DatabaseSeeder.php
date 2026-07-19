<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            StatusesSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
