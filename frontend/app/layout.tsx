import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/providers/AppProviders";
import I18nProvider from "@/providers/I18nProvider";

import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import { Toaster } from "sonner";


const geist =
    Geist({
        subsets:["latin"],
        variable:"--font-sans"
    });


export const metadata:Metadata={

    title:"Adama MESOB eService",

    description:
        "Digital government service platform"

};



export default function RootLayout({

                                       children

                                   }:{

    children:React.ReactNode

}){


    return (

        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                "font-sans",
                geist.variable
            )}
        >


        <body className="antialiased">


        <Providers>


            <I18nProvider>

                {children}

            </I18nProvider>


        </Providers>



        <Toaster
            richColors
            position="top-right"
        />



        </body>


        </html>

    );


}