import { useNavigate } from "react-router-dom";
import "../../assets/docAndDocxEditor/docAndDocxEditor.css"
import { useEffect, useState } from "react";

export default function AudioTranslator()
{
    //Navigation
    const navigate = useNavigate();
    //Doc or Docx File
    const [audio, setAudio] = useState<File | null>(null);
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
    const getAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAudio(e.target.files?.[0] ?? null)   
    }

    //Download file
    const getTranslatedFile = async () =>
    {
        if(audio != null)
        {
             const pdfArrayBuffer = await audio.arrayBuffer();
            const translatedPdf  = await window.api.getWavForTranslation(pdfArrayBuffer, l1, l2);
            const translatedFile = new File([translatedPdf], 
                "translated.wav", 
                {
                    type: "audio/wav"
                }
            )
            const url = URL.createObjectURL(translatedFile)
            const a = document.createElement("a");
            
            a.href = url;
            a.download = "translated.wav";

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
            <div id="menu">
                <button id="settingButton" onClick={() => navigate("/settings")}>Settings</button>
                <button id="homeButton" onClick={() => navigate("/")}>Home</button>
            </div>
            <div id="fileSubmitSection">
                <input
                type="file"
                accept=".wav"
                id="inputFile"
                onChange={e=>{getAudio(e)}}
                />
            </div>
            
            <br></br>

            <div id="submitSection">
                <button id="submit" onClick={getTranslatedFile}>Submit</button>
            </div>
            
        </div>
        </>)
}