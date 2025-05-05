<?php
namespace App\Domains\User\DTOs;

class RoleDTO
{
    public function __construct(
        public string $name,
        public array $permissions
    ) {}

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            "permissions"=>$this->prmissions
        ];
    }
}
