<?php

namespace App\Http\Controllers\Auth;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Auth\Requests\LoginRequest;
use App\Domains\Auth\Services\AuthService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(protected AuthService $authService) {}

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Welcome',
            ['status' => session('status')]);
    }

    /**
     * Handle an incoming authentication request.
     * @throws ValidationException
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $dto = new LoginDTO(
            $request->input('email'),
            $request->input('password'),
            $request->boolean('remember'),
            $request->ip()
        );

        $this->authService->login($dto);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(): RedirectResponse
    {
        $this->authService->logout();

        return redirect('/');
    }
}
