<?php
namespace App\Domains\Auth\Services;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * @throws ValidationException
     */
    public function login(LoginDTO $loginDTO): void
    {
        $this->ensureIsNotRateLimited($loginDTO->email, $loginDTO->ip);
        $this->ensureIsActive($loginDTO->email);

        $credentials = $this->getCredentials($loginDTO->email, $loginDTO->password);

        if (!Auth::validate($credentials)) {
            RateLimiter::hit($this->throttleKey($loginDTO->email, $loginDTO->ip));

            throw ValidationException::withMessages(['email' => trans('auth.failed')]);
        }

        $user = Auth::getProvider()->retrieveByCredentials($credentials);
        Auth::login($user);

        RateLimiter::clear($this->throttleKey($loginDTO->email, $loginDTO->ip));
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(string $email, string $ip): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey($email, $ip), 5)) {
            return;
        }

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => RateLimiter::availableIn($this->throttleKey($email, $ip)),
                'minutes' => ceil(RateLimiter::availableIn($this->throttleKey($email, $ip)) / 60),
            ]),
        ]);
    }

    /**
     * @todo make User as shared model
     *
     * @throws ValidationException
     */
    private function ensureIsActive(string $email): void
    {
        if (User::where(filter_var($email, FILTER_VALIDATE_EMAIL) ? 'email' : 'userName', $email)
            ->where('is_active', true)
            ->exists()) {
            return;
        }

        throw ValidationException::withMessages(['email' => trans('auth.disabled')]);
    }

    private function getCredentials(string $username, string $password): array
    {
        return filter_var($username, FILTER_VALIDATE_EMAIL)
            ? ['email' => $username, 'password' => $password]
            : ['userName' => $username, 'password' => $password];
    }

    private function throttleKey(string $email, string $ip): string
    {
        return Str::transliterate(Str::lower($email) . '|' . $ip);
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
        session()->invalidate();
        session()->regenerateToken();
    }
}
