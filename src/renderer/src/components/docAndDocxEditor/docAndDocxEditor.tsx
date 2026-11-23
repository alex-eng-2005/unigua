import { useNavigate } from "react-router-dom";
import "../../assets/docAndDocxEditor/docAndDocxEditor.css"
import { useEffect, useState } from "react";

export default function docAndDocxEditor()
{
    //Navigation
    const navigate = useNavigate();
    //Doc or Docx File
    const [docx, setDocx] = useState<File | null>(null);
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
    const getDocx = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDocx(e.target.files?.[0] ?? null)   
    }

    //Download file
    const getTranslatedFile = async () =>
    {
        //Checks if the user has a docx file stored
        if(docx != null)
        {
            
            //Docx to docx array buffer
            const docArrayBuffer = await docx.arrayBuffer();
            const translatedDocOrDocx  = await window.api.getDocxForTranslation(docArrayBuffer, l1, l2);
            //Gets the translated file
            const translatedFile = new File([translatedDocOrDocx], 
                "translated-document.docx", 
                {
                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
            )
            const url = URL.createObjectURL(translatedFile)
            const a = document.createElement("a");
            
            a.href = url;
            a.download = "translated.docx";

            // Download file
            document.body.appendChild(a);
            a.click();

            // Clean up
            a.remove();
            URL.revokeObjectURL(url);
        }
    }

    //Doc or Docx Screen
    return (<>
        <div id="languageBody">
            {/* Menu button */}
            <div id="menu">
                <button id="settingButton" onClick={() => navigate("/settings")}>Settings</button>
                <button id="homeButton" onClick={() => navigate("/")}>Home</button>
            </div>
            {/* Button to store the docx file in */}
            <div id="fileSubmitSection">
                <input
                type="file"
                accept=".docx"
                id="inputFile"
                onChange={e=>{getDocx(e)}}
                />
            </div>
            
            <br/>

            {/* Submit button */}
            <div id="submitSection">
                <button id="submit" onClick={getTranslatedFile}>Submit</button>
            </div>
            
        </div>
        </>)
}