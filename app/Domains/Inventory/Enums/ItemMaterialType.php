<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ItemMaterialType: string
{
    use InteractWithEnum;

    case CHM = 'CHM';
    case SLD = 'SLD';
    case LQD = 'LQD';
    case ELC = 'ELC';
    case CSM = 'CSM';
    case BIO = 'BIO';
    case GLS = 'GLS';
    case PPE = 'PPE';
    case RGT = 'RGT';
    case OTH = 'OTH';

    public function label(): string
    {
        return match($this) {
            self::CHM => 'Chemical',
            self::SLD => 'Solid',
            self::LQD => 'Liquid',
            self::ELC => 'Electronic',
            self::CSM => 'Consumable',
            self::BIO => 'Biological',
            self::GLS => 'Glassware',
            self::PPE => 'PPE',
            self::RGT => 'Reagent',
            self::OTH => 'Other',
        };
    }
}
