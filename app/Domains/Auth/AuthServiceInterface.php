<?php

namespace App\Domains\Auth;

use App\Domains\Auth\DTOs\LoginDTO;

interface AuthServiceInterface
{
    public function login(LoginDTO $loginDTO): bool;
    public function logout(): void;
}
