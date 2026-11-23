import { useNavigate } from "react-router-dom";
import "../../assets/docAndDocxEditor/docAndDocxEditor.css"
import { useEffect, useState } from "react";

export default function PDFTranslator()
{
    //Navigation
    const navigate = useNavigate();
    //Doc or Docx File
    const [pdf, setPDF] = useState<File | null>(null);
    //First Language
    const [l1, setL1] = useState("")
    //Second language
    const [l2, setL2] = useState("")
    useEffect(()=>{
        //Suppose to match what the user set their desired language
        async function loadLanguages() : Promise<void>
        {
            //Reads the languages the user set up in their settings
            const mainLan = await window.api.readLanguages();
            const l1 = mainLan["lan1"];
            const l2 = mainLan["lan2"];
            setL1(l1);
            setL2(l2);
        }
        loadLanguages();
    })

    //Submit information
    const getPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPDF(e.target.files?.[0] ?? null)   
    }

    //Download file
    const getTranslatedFile = async () =>
    {
        if(pdf != null)
        {
            //Sends in the pdf translation
            const pdfArrayBuffer = await pdf.arrayBuffer();
            
            //Gets the translated pdf back
            const translatedPdf  = await window.api.getPdfForTranslation(pdfArrayBuffer, l1, l2);
            const translatedFile = new File([translatedPdf], 
                "translated-document.pdf", 
                {
                    type: "application/pdf"
                }
            )
            //Creates the downloaded file of the pdf
            const url = URL.createObjectURL(translatedFile)
            const a = document.createElement("a");
            
            a.href = url;
            a.download = "translated.pdf";

            // Download file
            document.body.appendChild(a);
            a.click();

            // Clean up
            a.remove();
            URL.revokeObjectURL(url);
        }
    }

    //PDF Screen
    return (<>
        {/* Setting button and home button */}
        <div id="languageBody">
            <div id="menu">
                <button id="settingButton" onClick={() => navigate("/settings")}>Settings</button>
                <button id="homeButton" onClick={() => navigate("/")}>Home</button>
            </div>

            {/* Button to store the pdf file in */}
            <div id="fileSubmitSection">
                <input
                type="file"
                accept=".pdf"
                id="inputFile"
                onChange={e=>{getPdf(e)}}
                />
            </div>
            
            <br></br>
            {/* Confirms the file */}
            <div id="submitSection">
                <button id="submit" onClick={getTranslatedFile}>Submit</button>
            </div>
            
        </div>
        </>)
}