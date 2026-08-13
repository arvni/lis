<?php

namespace Tests\Feature\Auth;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Auth\Services\AuthService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuthService;
    }

    private function makeUser(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'agent@example.com',
            'password' => bcrypt('secret-pass'),
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

    public function test_remember_me_issues_a_recaller_cookie_and_persists_the_token(): void
    {
        // The form defaults `remember` to true and the DTO carried it all the
        // way here, but Auth::login() was called without it, so the box did nothing.
        $user = $this->makeUser();

        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', true, '127.0.0.1'));

        $this->assertNotNull($user->fresh()->remember_token);
        $this->assertNotNull(Auth::guard('web')->getCookieJar()->queued(Auth::guard('web')->getRecallerName()));
    }

    public function test_login_without_remember_does_not_issue_a_recaller_cookie(): void
    {
        $this->makeUser();

        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '127.0.0.1'));

        $this->assertTrue(Auth::check());
        $this->assertNull(Auth::guard('web')->getCookieJar()->queued(Auth::guard('web')->getRecallerName()));
    }

    public function test_login_regenerates_the_session_id(): void
    {
        // Guards against session fixation. Nothing in AuthService does this
        // explicitly — SessionGuard::updateSession() calls session->regenerate(true)
        // as part of Auth::login(). Pinned here so a future refactor away from
        // the guard cannot silently drop it.
        $this->makeUser();
        session()->start();
        $before = session()->getId();

        $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '127.0.0.1'));

        $this->assertNotSame($before, session()->getId());
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

    public function test_inactive_user_gets_a_real_message_not_a_translation_key(): void
    {
        // `auth.disabled` is this app's own key and had no lang file, so the raw
        // key was rendered to the user at the login form.
        $this->makeUser(['is_active' => false]);

        try {
            $this->service->login(new LoginDTO('agent@example.com', 'secret-pass', false, '127.0.0.1'));
            $this->fail('Expected a ValidationException for the deactivated account.');
        } catch (ValidationException $e) {
            $message = $e->errors()['email'][0];
            $this->assertStringNotContainsString('auth.', $message);
            $this->assertStringContainsString('deactivated', $message);
        }
    }

    public function test_every_login_failure_message_resolves_to_real_text(): void
    {
        // Publishing lang/en/auth.php overrides the framework defaults for the
        // whole namespace — these must not regress to raw keys either.
        foreach (['auth.failed', 'auth.password', 'auth.throttle', 'auth.disabled'] as $key) {
            $this->assertNotSame($key, trans($key), "Missing translation for {$key}");
        }
    }

    public function test_unknown_account_is_indistinguishable_from_a_wrong_password(): void
    {
        // It used to report "disabled" for an identifier that simply does not
        // exist, which let anyone enumerate valid accounts.
        $this->makeUser();

        $unknown = $this->messageFor('nobody@example.com', 'secret-pass');
        $wrongPassword = $this->messageFor('agent@example.com', 'wrong-pass');

        $this->assertSame($wrongPassword, $unknown);
        $this->assertStringNotContainsString('deactivated', $unknown);
    }

    public function test_probing_an_unknown_account_still_counts_against_the_rate_limit(): void
    {
        // The old early return threw before RateLimiter::hit(), so probing was free.
        $key = Str::transliterate('nobody@example.com|127.0.0.1');
        RateLimiter::clear($key);

        $this->messageFor('nobody@example.com', 'secret-pass');

        $this->assertSame(1, RateLimiter::attempts($key));
    }

    private function messageFor(string $email, string $password): string
    {
        try {
            $this->service->login(new LoginDTO($email, $password, false, '127.0.0.1'));
            $this->fail("Expected a ValidationException for {$email}.");
        } catch (ValidationException $e) {
            return $e->errors()['email'][0];
        }
    }

    public function test_login_throttles_after_too_many_attempts(): void
    {
        $this->makeUser();
        $key = Str::transliterate('agent@example.com'.'|'.'10.0.0.1');
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
