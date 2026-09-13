<?php

declare(strict_types=1);

namespace App\Domains\Reception\DTOs;

class TatAlertRuleDTO
{
    /**
     * @param  list<array<string, mixed>>  $tests
     * @param  list<array<string, mixed>>  $users
     * @param  list<array<string, mixed>>  $roles
     */
    public function __construct(
        public string $name,
        public int $days_left,
        public bool $active = true,
        public array $tests = [],
        public array $users = [],
        public array $roles = [],
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['name'],
            (int) $data['days_left'],
            (bool) ($data['active'] ?? true),
            $data['tests'] ?? [],
            $data['users'] ?? [],
            $data['roles'] ?? [],
        );
    }

    /**
     * Persistable columns only — tests, users and roles are relations and are synced separately.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'days_left' => $this->days_left,
            'active' => $this->active,
        ];
    }
}
