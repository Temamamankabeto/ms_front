<?php

return [

    // Client credentials
    'client_id' => env('FAYDA_CLIENT_ID'),

    // OAuth redirect URL
    'redirect_uri' => env('FAYDA_REDIRECT_URI'),

    // Endpoints
    'authorization_endpoint' => env('FAYDA_AUTHORIZATION_ENDPOINT'),
    'token_endpoint' => env('FAYDA_TOKEN_ENDPOINT'),
    'userinfo_endpoint' => env('FAYDA_USERINFO_ENDPOINT'),

    // OAuth / OIDC settings
    'assertion_type' => env('FAYDA_CLIENT_ASSERTION_TYPE', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
    'algorithm' => env('FAYDA_ALGORITHM', 'RS256'),

    // 🔥 IMPORTANT: add this (you are using it in service)
    'private_key' => env('FAYDA_PRIVATE_KEY'),

    'expiration_time' => env('FAYDA_EXPIRATION_TIME', 900),
];