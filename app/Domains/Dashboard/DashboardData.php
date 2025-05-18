<?php

namespace App\Domains\Dashboard;


class DashboardData
{
    /** @var DashboardItem[] */
    private array $items = [];

    public function addItem(DashboardItem $item): self
    {
        $this->items[] = $item;
        return $this;
    }

    /** @return DashboardItem[] */
    public function getItems(): array
    {
        return $this->items;
    }

    public function toArray(): array
    {
        $result = [];

        foreach ($this->items as $item) {
            $category = $item->getCategory();
            $label = $item->getLabel();
            $value = $item->getValue();

            if (!isset($result[$category])) {
                $result[$category] = [];
            }

            $result[$category][$label] = $value;
        }

        return $result;
    }
}
