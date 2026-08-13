<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LoginOtpMail;
use App\Mail\PasswordResetMail;
use App\Models\ActivityLog;
use App\Models\LoginOtp;
use App\Models\PasswordReset;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'fullname' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
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

        if (! Auth::attempt([...$credentials, 'isactive' => true])) {
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

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            PasswordReset::where('userid', $user->id)->whereNull('usedat')->delete();

            $token = Str::random(64);

            PasswordReset::create([
                'userid' => $user->id,
                'tokenhash' => hash('sha256', $token),
                'expiresat' => now()->addMinutes(60),
            ]);

            $resetUrl = rtrim(config('app.frontend_url'), '/').'/reset-password?token='.$token.'&email='.urlencode($user->email);

            Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));
        }

        return response()->json([
            'message' => 'If that email is registered, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('email', $validated['email'])->first();
        $tokenHash = hash('sha256', $validated['token']);

        $reset = $user
            ? PasswordReset::where('userid', $user->id)
                ->where('tokenhash', $tokenHash)
                ->whereNull('usedat')
                ->where('expiresat', '>', now())
                ->latest('createdat')
                ->first()
            : null;

        if (! $reset) {
            throw ValidationException::withMessages([
                'token' => ['This password reset link is invalid or has expired.'],
            ]);
        }

        $user->forceFill(['passwordhash' => $validated['password']])->save();
        $reset->update(['usedat' => now()]);

        $this->recordActivity($request, $user->id, 'password_reset', 'Password reset via emailed link');

        return response()->json(['message' => 'Your password has been reset. You can now log in.']);
    }

    public function requestOtp(Request $request)
    {
        $validated = $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            LoginOtp::where('userid', $user->id)->whereNull('usedat')->delete();

            $code = (string) random_int(100000, 999999);

            LoginOtp::create([
                'userid' => $user->id,
                'codehash' => Hash::make($code),
                'expiresat' => now()->addMinutes(10),
            ]);

            Mail::to($user->email)->send(new LoginOtpMail($user, $code));
        }

        return response()->json([
            'message' => 'If that email is registered, a login code has been sent.',
        ]);
    }

    public function loginWithOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        $otp = $user
            ? LoginOtp::where('userid', $user->id)
                ->whereNull('usedat')
                ->where('expiresat', '>', now())
                ->latest('createdat')
                ->first()
            : null;

        if (! $otp || ! $user->isactive || ! Hash::check($validated['code'], $otp->codehash)) {
            throw ValidationException::withMessages([
                'code' => ['That code is invalid or has expired.'],
            ]);
        }

        $otp->update(['usedat' => now()]);

        Auth::login($user);
        $request->session()->regenerate();

        $user->forceFill(['lastloginat' => now()])->save();

        $this->recordActivity($request, $user->id, 'user_login_otp', 'User logged in via OTP');

        return response()->json(['user' => $user->load('role')]);
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
