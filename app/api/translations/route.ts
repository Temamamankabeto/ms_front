import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";


const localePath =
    path.join(process.cwd(), "locales");



export async function GET() {

    try {


        const languages = [
            "en",
            "am",
            "om"
        ];


        const translations:any = {};



        for(const lang of languages){


            const filePath =
                path.join(
                    localePath,
                    `${lang}.json`
                );



            const file =
                await fs.readFile(
                    filePath,
                    "utf8"
                );



            translations[lang] =
                JSON.parse(file);


        }



        return NextResponse.json(
            translations
        );


    }
    catch(error:any){


        console.error(error);


        return NextResponse.json(

            {
                message:
                error.message
            },

            {
                status:500
            }

        );


    }

}







export async function POST(
    req:NextRequest
){


    try{


        const body =
            await req.json();



        const translations =
            body.translations;



        if(!translations){

            throw new Error(
                "Translations data missing"
            );

        }





        for(
            const lang of Object.keys(translations)
            ){


            const filePath =
                path.join(
                    localePath,
                    `${lang}.json`
                );



            await fs.writeFile(

                filePath,

                JSON.stringify(
                    translations[lang],
                    null,
                    2
                ),

                "utf8"

            );


        }





        return NextResponse.json({

            success:true,

            message:
                "Translations saved successfully"

        });



    }
    catch(error:any){


        console.error(
            "SAVE ERROR:",
            error
        );


        return NextResponse.json(

            {

                success:false,

                message:
                error.message

            },

            {
                status:500
            }

        );


    }


}