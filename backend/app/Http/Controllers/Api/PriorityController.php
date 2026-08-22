<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Priority;
use Illuminate\Http\Request;

class PriorityController extends Controller
{
    public function update(Request $request, Priority $priority)
    {
        $validated = $request->validate([
            'targetresolutionhours' => ['required', 'integer', 'min:1', 'max:8760'],
        ]);

        $priority->update($validated);

        return $priority;
    }
}
