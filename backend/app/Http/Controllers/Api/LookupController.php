<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Priority;
use App\Models\Status;

class LookupController extends Controller
{
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
}
