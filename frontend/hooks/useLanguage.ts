"use client";


import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";


export function useLanguage(){

  const {
    t
  }=useTranslation();



  function changeLanguage(
      lang:string
  ){

    i18n.changeLanguage(lang);

    localStorage.setItem(
        "language",
        lang
    );

  }



  return {

    t,

    language:i18n.language,

    changeLanguage

  };


}