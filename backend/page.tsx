"use client";

import { useEffect, useState } from "react";
import type { TranslationData } from "./types";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
    Plus,
    Languages,
    Trash2,
    Save,
    RefreshCcw,
} from "lucide-react";



export default function TranslationPage() {


    const [translations, setTranslations] =
        useState<TranslationData>({});


    const [languages, setLanguages] =
        useState<string[]>([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState<string | null>(null);



    const [newKey, setNewKey] =
        useState("");


    const [newValues, setNewValues] =
        useState<Record<string,string>>({});



    const [saving, setSaving] =
        useState(false);


    const [message, setMessage] =
        useState("");





    /*
    ============================
    LOAD TRANSLATIONS
    ============================
    */


    async function loadTranslations(){


        try{


            setLoading(true);


            const response =
                await fetch(
                    "/translations"
                );



            const result =
                await response.json();




            if(!response.ok){

                throw new Error(
                    result.message ||
                    "Failed loading translations"
                );

            }




            setTranslations(result);



            setLanguages(
                Object.keys(result)
            );



        }
        catch(error:any){


            setError(
                error.message
            );


        }
        finally{


            setLoading(false);


        }


    }





    useEffect(()=>{


        loadTranslations();


    },[]);







    /*
    ============================
    FLATTEN JSON
    ============================
    */


    function flattenObject(
        obj:any,
        prefix=""
    ):Record<string,string>{


        let result:Record<string,string>={};



        Object.keys(obj || {})
            .forEach(key=>{


                const value =
                    obj[key];


                const newKey =
                    prefix
                        ? `${prefix}.${key}`
                        : key;



                if(
                    typeof value === "object" &&
                    value !== null
                ){


                    Object.assign(

                        result,

                        flattenObject(
                            value,
                            newKey
                        )

                    );


                }
                else{


                    result[newKey]=value;


                }


            });



        return result;


    }








    /*
    ============================
    GET KEYS
    ============================
    */


    function getKeys(){


        const keys =
            new Set<string>();



        Object.values(translations)
            .forEach(language=>{


                Object.keys(
                    flattenObject(language)
                )
                    .forEach(key=>{

                        keys.add(key);

                    });


            });



        return Array.from(keys);


    }







    /*
    ============================
    GET NESTED VALUE
    ============================
    */


    function getValue(
        obj:any,
        path:string
    ){


        return path
            .split(".")
            .reduce(

                (current,key)=>
                    current?.[key],

                obj

            ) || "";


    }







    /*
    ============================
    UPDATE VALUE
    ============================
    */


    function updateValue(
        language:string,
        key:string,
        value:string
    ){


        setTranslations(prev=>({

            ...prev,


            [language]:{

                ...prev[language],

                [key]:value

            }


        }));


    }






    /*
    ============================
    NEW LANGUAGE VALUE
    ============================
    */


    function updateNewValue(
        language:string,
        value:string
    ){


        setNewValues(prev=>({

            ...prev,

            [language]:value


        }));


    }






    /*
    ============================
    ADD KEY
    ============================
    */


    function addTranslationKey(){


        const key =
            newKey.trim();




        if(!key){

            alert(
                "Translation key required"
            );

            return;

        }



        if(
            getKeys()
                .includes(key)
        ){

            alert(
                "Key already exists"
            );

            return;

        }



        setTranslations(prev=>{


            const updated:any =
                {
                    ...prev
                };



            languages.forEach(lang=>{


                updated[lang]={

                    ...updated[lang],


                    [key]:

                    newValues[lang] || ""


                };


            });



            return updated;


        });




        setNewKey("");

        setNewValues({});


        setMessage(
            "Added. Click Save Changes"
        );


    }
    /*
============================
DELETE KEY
============================
*/


    function deleteTranslationKey(
        key:string
    ){


        if(
            !confirm(
                `Delete "${key}"?`
            )
        )
            return;



        setTranslations(prev=>{


            const updated:any =
                {
                    ...prev
                };



            Object.keys(updated)
                .forEach(lang=>{


                    const flat =
                        flattenObject(
                            updated[lang]
                        );


                    delete flat[key];


                    updated[lang] = flat;


                });



            return updated;


        });



        setMessage(
            "Deleted. Click Save Changes"
        );


    }







    /*
    ============================
    SAVE TRANSLATIONS
    ============================
    */


    async function saveTranslations(){


        try{


            setSaving(true);

            setMessage("");



            const response =
                await fetch(
                    "/api/translations",
                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                                "application/json"

                        },


                        body:JSON.stringify({

                            translations

                        })

                    }

                );



            const result =
                await response.json();




            if(!response.ok){

                throw new Error(
                    result.message ||
                    "Save failed"
                );

            }



            setMessage(
                "Translations saved successfully"
            );



        }
        catch(error:any){


            setMessage(
                error.message
            );


        }
        finally{


            setSaving(false);


        }


    }






    if(loading){


        return (

            <div className="p-6">

                Loading translations...

            </div>

        );


    }





    if(error){


        return (

            <div className="
      p-6
      text-red-600
      ">

                {error}

            </div>

        );


    }






    return (

        <div className="
    p-6
    space-y-8
    ">



            {/* =========================
          HEADER
      ========================= */}


            <div>


                <h1 className="
        text-3xl
        font-bold
        ">

                    Translation Management

                </h1>


                <p className="
        text-muted-foreground
        mt-2
        ">

                    Manage English, Amharic and Afaan Oromo translations.

                </p>


            </div>






            {/* =========================
          ADD TRANSLATION CARD
      ========================= */}



            <Card>


                <CardHeader>


                    <div className="
          flex
          items-center
          justify-between
          ">



                        <div>


                            <CardTitle className="
              flex
              items-center
              gap-2
              ">


                                <Languages
                                    className="
                  h-5
                  w-5
                  "
                                />


                                Add Translation


                            </CardTitle>



                            <CardDescription>

                                Add a new key for all languages.

                            </CardDescription>


                        </div>




                        <span className="
            rounded-full
            bg-primary/10
            text-primary
            px-3
            py-1
            text-sm
            ">

              {languages.length} Languages

            </span>



                    </div>


                </CardHeader>





                <CardContent>


                    <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-5
          ">



                        <div className="
            md:col-span-2
            space-y-2
            ">


                            <Label>

                                Translation Key

                            </Label>


                            <Input

                                value={newKey}

                                onChange={(e)=>
                                    setNewKey(
                                        e.target.value
                                    )
                                }


                                placeholder="home.title"

                            />


                        </div>






                        {
                            languages.map(lang=>(


                                <div
                                    key={lang}
                                    className="
                  space-y-2
                  "
                                >


                                    <Label className="
                  uppercase
                  ">

                                        {lang}

                                    </Label>



                                    <Input


                                        value={
                                            newValues[lang] || ""
                                        }


                                        onChange={(e)=>

                                            updateNewValue(
                                                lang,
                                                e.target.value
                                            )

                                        }


                                        placeholder={
                                            `Enter ${lang} translation`
                                        }


                                    />


                                </div>



                            ))
                        }




                    </div>





                    <div className="
          flex
          justify-end
          mt-6
          ">


                        <Button

                            onClick={
                                addTranslationKey
                            }

                            className="
              gap-2
              "

                        >

                            <Plus
                                className="h-4 w-4"
                            />


                            Add Translation


                        </Button>


                    </div>



                </CardContent>


            </Card>
            {/* =========================
          TRANSLATION TABLE
      ========================= */}


            <Card>


                <CardHeader>


                    <CardTitle>

                        Translation Keys

                    </CardTitle>


                    <CardDescription>

                        Edit your translations dynamically.

                    </CardDescription>


                </CardHeader>





                <CardContent>


                    <div className="
          overflow-x-auto
          border
          rounded-lg
          ">


                        <table className="
            w-full
            ">


                            <thead>


                            <tr className="
              bg-muted
              ">


                                <th className="
                border
                p-3
                text-left
                ">

                                    Key

                                </th>




                                {
                                    languages.map(lang=>(


                                        <th

                                            key={lang}

                                            className="
                      border
                      p-3
                      text-left
                      uppercase
                      "

                                        >

                                            {lang}


                                        </th>


                                    ))
                                }





                                <th className="
                border
                p-3
                ">

                                    Action

                                </th>


                            </tr>


                            </thead>






                            <tbody>


                            {
                                getKeys()
                                    .map(key=>(


                                        <tr
                                            key={key}
                                        >



                                            <td className="
                    border
                    p-3
                    font-medium
                    ">


                                                {key}


                                            </td>






                                            {
                                                languages.map(lang=>(


                                                    <td

                                                        key={
                                                            lang + key
                                                        }

                                                        className="
                          border
                          p-2
                          "

                                                    >


                                                        <Input


                                                            value={

                                                                getValue(
                                                                    translations[lang],
                                                                    key
                                                                )

                                                            }



                                                            onChange={(e)=>

                                                                updateValue(

                                                                    lang,

                                                                    key,

                                                                    e.target.value

                                                                )

                                                            }


                                                        />



                                                    </td>



                                                ))
                                            }





                                            <td className="
                    border
                    p-3
                    text-center
                    ">


                                                <Button

                                                    variant="destructive"

                                                    size="sm"


                                                    onClick={()=>


                                                        deleteTranslationKey(
                                                            key
                                                        )


                                                    }


                                                >

                                                    <Trash2
                                                        className="
                          h-4
                          w-4
                          "
                                                    />

                                                </Button>


                                            </td>




                                        </tr>



                                    ))
                            }


                            </tbody>


                        </table>



                    </div>


                </CardContent>


            </Card>






            {/* =========================
          ACTION BUTTONS
      ========================= */}



            <div className="
      flex
      gap-3
      ">



                <Button


                    onClick={
                        saveTranslations
                    }


                    disabled={saving}


                    className="
          gap-2
          "

                >


                    <Save
                        className="
            h-4
            w-4
            "
                    />



                    {
                        saving
                            ?
                            "Saving..."
                            :
                            "Save Changes"
                    }



                </Button>






                <Button


                    variant="outline"


                    onClick={
                        loadTranslations
                    }


                    className="
          gap-2
          "

                >


                    <RefreshCcw
                        className="
            h-4
            w-4
            "
                    />


                    Reload


                </Button>



            </div>







            {
                message && (


                    <Card>


                        <CardContent className="
            pt-6
            ">


                            {message}


                        </CardContent>


                    </Card>


                )
            }




        </div>

    );

}
