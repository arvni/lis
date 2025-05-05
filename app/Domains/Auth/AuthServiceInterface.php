<?php

namespace App\Domain\Auth;

use App\Domain\Auth\DTOs\LoginDTO;

interface AuthServiceInterface
{
    public function login(LoginDTO $loginDTO): bool;
    public function logout(): void;
}
