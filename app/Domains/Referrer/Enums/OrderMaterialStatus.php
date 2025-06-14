<?php
namespace App\Domains\Referrer\Enums;

enum OrderMaterialStatus: string
{
    case ORDERED = "ORDERED";
    case PROCESSED = "PROCESSED";
}
