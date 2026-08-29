<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dagu SMS Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('SMS_ENABLED', true),

    'base_url' => env('DAGU_SMS_BASE_URL', 'https://sms.adamacity.gov.et:4000'),

    'send_path' => env('DAGU_SMS_SEND_PATH', '/by-phone'),

    'token' => env('DAGU_SMS_TOKEN'),

    'method' => 'post',

    'phone_field' => 'phone',

    'message_field' => 'message',

    'sender_field' => 'senderID',

    'sender' => env('DAGU_SMS_SENDER_ID', '9141'),

    'flash_field' => 'flash',

    'flash' => false,

    'token_type' => 'Bearer',

    'token_location' => 'header',

];