<?php


namespace App\Domains\Auth\DTOs;

class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public bool $remember = false,
        public string $ip = '',
    ) {}

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'password' => $this->password,
            'remember' => $this->remember,
            'ip' => $this->ip,
        ];
    }
}
