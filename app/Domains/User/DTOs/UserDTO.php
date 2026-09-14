<?php

declare(strict_types=1);

namespace App\Domains\User\DTOs;

class UserDTO
{
    /**
     * @param  array<string, mixed>|string|null  $signature
     * @param  array<string, mixed>|string|null  $stamp
     * @param  array<int, array<string, mixed>>  $roles
     */
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
        public bool              $isActive = true,
        public ?string           $attendanceNumber = null
    )
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'username' => $this->username,
            'attendance_number' => $this->attendanceNumber,
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
