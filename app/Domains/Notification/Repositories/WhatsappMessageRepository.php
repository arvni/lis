<?php

namespace App\Domains\Notification\Repositories;

use App\Domains\Notification\Models\WhatsappMessage;
use DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class WhatsappMessageRepository
{

    /**
     * @param $queryData
     * @return LengthAwarePaginator
     */
    public function listMessages($queryData): LengthAwarePaginator
    {
        $query = WhatsappMessage::query();
        if ($queryData["filters"] ?? null) {
            $this->applyFilters($query, $queryData["filters"]);
        }
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);

    }

    public function listContacts($queryData): LengthAwarePaginator
    {
        $query = WhatsappMessage::query()
            ->select([
                "waId",
                DB::raw("MAX(created_at) as latest_created_at"),
                DB::raw("FIRST_VALUE(messageable_id) OVER (PARTITION BY waId ORDER BY created_at DESC) as messageable_id"),
                DB::raw("FIRST_VALUE(messageable_type) OVER (PARTITION BY waId ORDER BY created_at DESC) as messageable_type")
            ])
            ->groupBy("waId")
        ->with("messageable");
        if ($queryData["filters"]["search"] ?? null) {
            $query->where(function (Builder $query) use ($queryData) {
                $query->where("waId", "like", "%" . $queryData["filters"]["search"] . "%")
                    ->orWhereHas("messageable", function (Builder $query) use ($queryData) {
                        $queryData->search($queryData["filters"]["search"]);
                    });
            });
        }
        $query->orderBy("latest_created_at", "desc");
        return $query->paginate($queryData["pageSize"] ?? 10);

    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        foreach ($filters as $field => $value) {
            switch ($field) {
                case 'id':
                    $query->whereIn('id', $value);
                    break;
                case "messageable_type":
                    $query->where("messageable_type", $value);
                    break;
                case "messageable_id":
                    $query->where("messageable_id", $value);
                    break;
                case "type":
                    $query->where("type", $value);
                    break;
                case "search":
                    $query->search($value);
            }
        }
        return $query;
    }

}
