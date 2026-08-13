<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Priority;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;

class LookupController extends Controller
{
    private const ASSIGNABLE_ROLES = ['Admin', 'Manager', 'IT Support Agent'];

    public function categories()
    {
        return Category::orderBy('name')->get();
    }

    public function priorities()
    {
        return Priority::orderBy('level')->get();
    }

    public function statuses()
    {
        return Status::orderBy('sortorder')->get();
    }

    public function roles()
    {
        return Role::orderBy('rolename')->get();
    }

    public function assignableUsers()
    {
        return User::with('role')
            ->where('isactive', true)
            ->whereHas('role', fn ($query) => $query->whereIn('rolename', self::ASSIGNABLE_ROLES))
            ->orderBy('fullname')
            ->get();
    }
}
