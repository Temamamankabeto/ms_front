import i18n from "i18next";
import { initReactI18next } from "react-i18next";


import en from "@/locales/en.json";
import am from "@/locales/am.json";
import om from "@/locales/om.json";


export const SUPPORTED_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "am", label: "አማርኛ" },
    { code: "om", label: "Afaan Oromoo" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];


if (!i18n.isInitialized) {


    i18n
        .use(initReactI18next)
        .init({

            resources:{


                en:{
                    translation:en
                },


                am:{
                    translation:am
                },


                om:{
                    translation:om
                }

            },


            lng:"en",

            fallbackLng:"en",


            interpolation:{
                escapeValue:false
            },


            react:{
                useSuspense:false
            }


        });


}


export function changeLanguage(language: SupportedLanguage) {
    return i18n.changeLanguage(language);
}


export default i18n;