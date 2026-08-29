<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Jose\Component\Core\JWK;
use Jose\Component\KeyManagement\JWKFactory;
use Jose\Component\Signature\JWSBuilder;
use Jose\Component\Signature\Algorithm\RS256;
use Jose\Component\Signature\Serializer\CompactSerializer;

class FaydaService
{
    public function generateClientAssertion()
{
    $now = time();

    $jwkArray = json_decode(
        base64_decode(env('FAYDA_PRIVATE_KEY')),
        true
    );

    $jwk = new JWK($jwkArray);

    $payload = [
        'iss' => config('fayda.client_id'),
        'sub' => config('fayda.client_id'),
        'aud' => config('fayda.token_endpoint'),
        'iat' => $now,
        'exp' => $now + 900,
        'jti' => uniqid(),
    ];

    $header = [
        'alg' => 'RS256',
        'typ' => 'JWT',
    ];

    $jwsBuilder = new \Jose\Component\Signature\JWSBuilder(
        new \Jose\Component\Core\AlgorithmManager([
            new \Jose\Component\Signature\Algorithm\RS256(),
        ])
    );

    $jws = $jwsBuilder
        ->create()
        ->withPayload(json_encode($payload))
        ->addSignature($jwk, $header)
        ->build();

    $serializer = new CompactSerializer();

    return $serializer->serialize($jws, 0);
}

    public function getToken($code)
    {
        $assertion = $this->generateClientAssertion();

        return Http::asForm()
            ->post(
                config('fayda.token_endpoint'),
                [
                    'grant_type' => 'authorization_code',
                    'code' => $code,
                    'redirect_uri' =>
                        config('fayda.redirect_uri'),
                    'client_id' =>
                        config('fayda.client_id'),
                    'client_assertion_type' =>
                        config('fayda.assertion_type'),
                    'client_assertion' =>
                        $assertion,
                ]
            )
            ->json();
    }

    public function userInfo($token)
    {
        return Http::withToken($token)
            ->get(config('fayda.userinfo_endpoint'))
            ->json();
    }
}