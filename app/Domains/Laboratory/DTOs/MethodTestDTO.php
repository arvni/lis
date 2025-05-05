<?php

namespace App\Domains\Laboratory\DTOs;

class MethodTestDTO
{
    public function __construct(
        public int  $method_id,
        public int  $test_id,
        public bool $is_default = true,
        public bool $status = true
    )
    {
    }

    public function toArray()
    {
        return [
            "method_id" => $this->method_id,
            "test_id" => $this->test_id,
            "is_default" => $this->is_default,
            "status" => $this->status
        ];
    }
}
