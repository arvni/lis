<?php

namespace App\Domains\Document\Enums;
use Kongulov\Traits\InteractWithEnum;

enum DocumentTag: string
{
    use InteractWithEnum;
    case ACCEPTANCE_ITEM_STATES = 'ACCEPTANCE_ITEM_STATES';
    case TEMP = "TEMP";
    case PRESCRIPTION = "PRESCRIPTION";
    case REPORTED = "REPORTED";
    case PUBLISHED = "PUBLISHED";
    case REFERRER_ORDER = "REFERRER_ORDER";
    case AVATAR = "AVATAR";
    case CLINICAL_COMMENT = "CLINICAL_COMMENT";
    case LATEST = "LATEST";
    case APPROVED = "APPROVED";
    case IMAGE = "IMAGE";
    case DOCUMENT = "DOCUMENT";
    case SIGNATURE = "SIGNATURE";
    case STAMP = "STAMP";
    case SETTING = "SETTING";
    case ADDITIONAL = "ADDITIONAL";
    case MEDICAL_HISTORY = "MEDICAL_HISTORY";
    case ID_CARD = "ID_CARD";
    case CONSENT_FORM = "CONSENT_FORM";
    case ACCEPTANCE_FORM = "ACCEPTANCE_FORM";
    case REQUEST_FORM = "REQUEST_FORM";


    public function label(): string
    {
        return match ($this) {
            self::AVATAR => 'Avatar',
            self::PRESCRIPTION => 'Prescription',
            self::REPORTED => 'Reported',
            self::CLINICAL_COMMENT => 'Clinical Comment',
            self::PUBLISHED => 'Published',
            self::TEMP => 'Temporary',
            self::ACCEPTANCE_ITEM_STATES => 'Acceptance Item States',
            self::REFERRER_ORDER => 'Referrer Order',
            self::LATEST => 'Latest',
            self::IMAGE => 'Image',
            self::DOCUMENT => 'Document',
            self::SIGNATURE => 'Signature',
            self::STAMP => 'Stamp',
            self::MEDICAL_HISTORY => 'Medical History',
            self::ID_CARD => 'ID Card',
            self::CONSENT_FORM => 'Consent Form',
            self::ACCEPTANCE_FORM => 'Acceptance Form',
            self::REQUEST_FORM => 'Request Form',
            self::SETTING => 'Setting',
            self::ADDITIONAL => 'Additional',
            self::APPROVED => 'Approved',

            default => 'Unknown',
        };
    }

}
