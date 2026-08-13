<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_reset_password_via_emailed_link(): void
    {
        $this->withHeader('referer', 'http://localhost:5173');
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');

        Mail::fake();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $resetUrl = null;
        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) use (&$resetUrl, $user) {
            $resetUrl = $mail->resetUrl;

            return $mail->hasTo($user->email);
        });

        $this->assertDatabaseCount('passwordresets', 1);

        parse_str(parse_url($resetUrl, PHP_URL_QUERY), $query);
        $token = $query['token'];

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'wrong-token',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertStatus(422);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'NewPassword123!',
        ])->assertOk();

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'AnotherPassword123!',
            'password_confirmation' => 'AnotherPassword123!',
        ])->assertStatus(422);
    }

    public function test_forgot_password_gives_generic_response_for_unknown_email(): void
    {
        $this->seed(RolesSeeder::class);
        Mail::fake();

        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.test'])->assertOk();

        Mail::assertNothingSent();
        $this->assertDatabaseCount('passwordresets', 0);
    }

    private function createUser(string $roleName, string $email): User
    {
        return User::create([
            'roleid' => Role::where('rolename', $roleName)->firstOrFail()->id,
            'fullname' => $roleName.' User',
            'email' => $email,
            'passwordhash' => 'Password123!',
            'isactive' => true,
        ]);
    }
}
