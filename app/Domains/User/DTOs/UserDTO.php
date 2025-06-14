<?php

namespace App\Domains\User\DTOs;

class UserDTO
{
    public function __construct(
        public string            $name,
        public string            $username,
        public string            $email,
        public string            $mobile,
        public ?string           $password,
        public array|string|null $signature,
        public array|string|null $stamp,
        public ?string           $title = null,
        public array             $roles = [],
        public bool              $isActive = true
    )
    {
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'mobile' => $this->mobile,
            "title" => $this->title,
            'signature' => $this->signature,
            'stamp' => $this->stamp,
            'roles' => $this->roles,
            'is_active' => $this->isActive
        ];
        if ($this->password) {
            $data['password'] = bcrypt($this->password);
        }
        return $data;
    }
}
