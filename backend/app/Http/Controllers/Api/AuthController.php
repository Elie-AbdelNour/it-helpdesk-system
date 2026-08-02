<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'fullname' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $employeeRole = Role::where('rolename', 'Employee')->firstOrFail();

        $user = User::create([
            'roleid' => $employeeRole->id,
            'fullname' => $validated['fullname'],
            'email' => $validated['email'],
            'passwordhash' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        $this->recordActivity($request, $user->id, 'user_registered', 'User registered');

        return response()->json(['user' => $user->load('role')], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            $this->recordActivity(
                $request,
                null,
                'user_login_failed',
                'Failed login attempt for '.$credentials['email'],
            );

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();
        $user->forceFill(['lastloginat' => now()])->save();

        $this->recordActivity($request, $user->id, 'user_login', 'User logged in');

        return response()->json(['user' => $user->load('role')]);
    }

    public function logout(Request $request)
    {
        $userId = $request->user()?->id;

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $this->recordActivity($request, $userId, 'user_logout', 'User logged out');

        return response()->noContent();
    }

    public function user(Request $request)
    {
        return response()->json(['user' => $request->user()->load('role')]);
    }

    private function recordActivity(Request $request, ?int $userId, string $action, string $details): void
    {
        ActivityLog::create([
            'userid' => $userId,
            'action' => $action,
            'entitytype' => 'user',
            'entityid' => $userId,
            'details' => $details,
            'ipaddress' => $request->ip(),
        ]);
    }
}
