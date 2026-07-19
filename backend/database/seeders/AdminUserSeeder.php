<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('rolename', 'Admin')->firstOrFail();

        User::updateOrCreate(
            ['email' => 'admin@ithelpdesk.test'],
            [
                'roleid' => $adminRole->id,
                'fullname' => 'System Administrator',
                'passwordhash' => 'Password123!',
                'isactive' => true,
            ]
        );
    }
}
