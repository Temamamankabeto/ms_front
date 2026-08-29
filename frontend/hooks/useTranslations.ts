"use client";


import { useTranslation } from "react-i18next";


export function useLanguage(){


    const {
        t,
        i18n
    } = useTranslation();



    function changeLanguage(
        language:string
    ){

        i18n.changeLanguage(language);

    }



    return {

        t,

        language:i18n.language,

        changeLanguage

    };


}