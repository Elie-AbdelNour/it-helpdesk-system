<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['rolename' => 'Admin', 'description' => 'Full system access'],
            ['rolename' => 'IT Support Agent', 'description' => 'Manage and resolve tickets'],
            ['rolename' => 'Employee', 'description' => 'Create and track tickets'],
            ['rolename' => 'Manager', 'description' => 'Monitor team tickets and reports'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['rolename' => $role['rolename']], $role);
        }
    }
}
