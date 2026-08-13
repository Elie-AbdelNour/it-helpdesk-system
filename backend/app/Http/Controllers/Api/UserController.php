<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'roleid' => ['nullable', 'integer', 'exists:roles,id'],
            'isactive' => ['nullable', 'boolean'],
        ]);

        $query = User::query()->with('role');

        if ($search = $validated['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('fullname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (array_key_exists('roleid', $validated) && $validated['roleid'] !== null) {
            $query->where('roleid', $validated['roleid']);
        }

        if (array_key_exists('isactive', $validated) && $validated['isactive'] !== null) {
            $query->where('isactive', $validated['isactive']);
        }

        return $query->latest('createdat')->paginate(15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fullname' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:30'],
            'roleid' => ['required', 'integer', 'exists:roles,id'],
        ]);

        $user = User::create([
            'fullname' => $validated['fullname'],
            'email' => $validated['email'],
            'passwordhash' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'roleid' => $validated['roleid'],
            'isactive' => true,
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'fullname' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'roleid' => ['sometimes', 'required', 'integer', 'exists:roles,id'],
            'isactive' => ['sometimes', 'required', 'boolean'],
        ]);

        $user->update($validated);

        return $user->load('role');
    }
}
