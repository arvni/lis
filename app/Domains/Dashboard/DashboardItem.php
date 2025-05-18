<?php

namespace App\Domains\Dashboard;

/**
 * Dashboard Domain Entity
 */
class DashboardItem
{
    private string $category;
    private string $label;
    private mixed $value;

    public function __construct(string $category, string $label, mixed $value)
    {
        $this->category = $category;
        $this->label = $label;
        $this->value = $value;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getValue(): mixed
    {
        return $this->value;
    }

    public function toArray(): array
    {
        return [
            'category' => $this->category,
            'label' => $this->label,
            'value' => $this->value,
        ];
    }
}
