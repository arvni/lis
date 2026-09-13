<?php

declare(strict_types=1);

namespace App\Domains\Reception\Resources;

use App\Domains\Reception\Models\TatAlertRule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TatAlertRule
 */
class TatAlertRuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // {id, name} pairs so the edit form can feed them straight back into SelectSearch.
        $asOptions = fn (iterable $models) => collect($models)
            ->map(fn (Model $model) => ['id' => $model->getKey(), 'name' => $model->getAttribute('name')])
            ->values();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'days_left' => $this->days_left,
            'active' => $this->active,
            'last_run_on' => $this->last_run_on?->format('Y-m-d'),
            'tests' => $this->whenLoaded('tests', fn () => $asOptions($this->tests)),
            'users' => $this->whenLoaded('users', fn () => $asOptions($this->users)),
            'roles' => $this->whenLoaded('roles', fn () => $asOptions($this->roles)),
        ];
    }
}
