<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'token' => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
        'whatsapp_ssid' => env('TWILIO_WHATSAPP_SERVICE_SID'),
        'templates' => [
            'welcome_message' => env('TWILIO_WELCOME_MESSAGE_TEMPLATE'),
            'acceptance_report_published' => env('REPORT_PUBLISHED_TEMPLATE'),
            'send_report_file' => env('REPORT_PUBLISHED_FILE_TEMPLATE'),
        ]
    ],
    'omantel' => [
        'api_url' => env('OMANTEL_API_URL', 'https://ismart.omantel.om/smsgw/sms/api'),
        'username' => env('OMANTEL_USERNAME'),
        'password' => env('OMANTEL_PASSWORD'),
        'sender_id' => env('OMANTEL_SENDER_ID'),
    ],
    'provider_app' => [
        'webhook_domain' => env('PROVIDER_APP_WEBHOOK_DOMAIN',"http://localhost:8003"),
        'webhook_secret' => env('PROVIDER_APP_WEBHOOK_SECRET'),
        'order_material_webhook_url' => env('PROVIDER_APP_ORDER_MATERIAL_WEBHOOK_URL', '/order-materials/'),
        'request_form_webhook_url' => env('PROVIDER_APP_REQUEST_FORM_WEBHOOK_URL', '/request-forms/'),
        'consent_form_webhook_url' => env('PROVIDER_APP_CONSENT_FORM_WEBHOOK_URL', '/consent-forms/'),
        'instruction_webhook_url' => env('PROVIDER_APP_INSTRUCTION_WEBHOOK_URL', '/instructions/'),
        'sample_type_webhook_url' => env('PROVIDER_APP_SAMPLE_TYPE_WEBHOOK_URL', '/sample-types/'),
    ],
    'whatsapp'=>[
        'callback-server'=>env('WHATSAPP_CALLBACK_SERVER'),
        'callback-url'=>env('WHATSAPP_CALLBACK_URL','/api/whatsapp-messages/callback'),
    ]

];
