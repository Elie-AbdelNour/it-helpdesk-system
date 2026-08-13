<?php

namespace Tests\Feature;

use App\Mail\LoginOtpMail;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_log_in_with_an_emailed_otp_code(): void
    {
        $this->withHeader('referer', 'http://localhost:5173');
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');

        Mail::fake();

        $this->postJson('/api/login/otp/request', ['email' => $user->email])->assertOk();

        $code = null;
        Mail::assertSent(LoginOtpMail::class, function (LoginOtpMail $mail) use (&$code, $user) {
            $code = $mail->code;

            return $mail->hasTo($user->email);
        });

        $this->postJson('/api/login/otp/verify', [
            'email' => $user->email,
            'code' => '000000',
        ])->assertStatus(422);

        $this->postJson('/api/login/otp/verify', [
            'email' => $user->email,
            'code' => $code,
        ])->assertOk()->assertJsonPath('user.email', $user->email);

        $this->postJson('/api/login/otp/verify', [
            'email' => $user->email,
            'code' => $code,
        ])->assertStatus(422);
    }

    public function test_deactivated_user_cannot_log_in_with_otp(): void
    {
        $this->withHeader('referer', 'http://localhost:5173');
        $this->seed(RolesSeeder::class);
        $user = $this->createUser('Employee', 'employee@example.test');
        $user->update(['isactive' => false]);

        Mail::fake();

        $this->postJson('/api/login/otp/request', ['email' => $user->email])->assertOk();

        $code = null;
        Mail::assertSent(LoginOtpMail::class, function (LoginOtpMail $mail) use (&$code) {
            $code = $mail->code;

            return true;
        });

        $this->postJson('/api/login/otp/verify', [
            'email' => $user->email,
            'code' => $code,
        ])->assertStatus(422);
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
