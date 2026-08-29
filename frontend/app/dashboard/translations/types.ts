export interface TranslationData {
    [language: string]: {
        [key: string]: string;
    };
}

export interface TranslationRequest {
    translations: TranslationData;
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: TranslationData;
}