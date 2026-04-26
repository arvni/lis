<?php

namespace App\Domains\QC\Enums;

enum QCStatus: string
{
    case PASS    = 'pass';
    case WARNING = 'warning';
    case FAIL    = 'fail';
}
