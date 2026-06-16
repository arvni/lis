<?php

namespace Tests\Feature\Auth;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Auth\Services\AuthService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuthService();
    }

    private function makeUser(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'email'     => 'agent@example.com',
            'password'  => bcrypt('secret-pass'),
            'is_active' => true,
        ], $attrs));
    }

    public function test_login_authenticates_valid_active_user(): void
    {
        $user = $this->makeUser();

        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '127.0.0.1'));

        $this->assertTrue(Auth::check());
        $this->assertSame($user->id, Auth::id());
    }

    public function test_login_throws_on_wrong_password(): void
    {
        $this->makeUser();

        $this->expectException(ValidationException::class);
        $this->service->login(new LoginDTO('agent@example.com', 'wrong', false, '127.0.0.1'));
    }

    public function test_login_throws_for_inactive_user(): void
    {
        $this->makeUser(['is_active' => false]);

        $this->expectException(ValidationException::class);
        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '127.0.0.1'));
    }

    public function test_login_throttles_after_too_many_attempts(): void
    {
        $this->makeUser();
        $key = \Illuminate\Support\Str::transliterate('agent@example.com' . '|' . '10.0.0.1');
        for ($i = 0; $i < 5; $i++) {
            RateLimiter::hit($key);
        }

        $this->expectException(ValidationException::class);
        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '10.0.0.1'));
    }

    public function test_logout_clears_authentication(): void
    {
        $user = $this->makeUser();
        $this->actingAs($user);
        $this->assertTrue(Auth::check());

        $this->service->logout();

        $this->assertFalse(Auth::guard('web')->check());
    }
}
