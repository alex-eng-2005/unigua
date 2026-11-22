import { useNavigate } from "react-router-dom";
import "../../assets/docAndDocxEditor/docAndDocxEditor.css"
import { useEffect, useState } from "react";

export default function ImageTranslator()
{
    //Navigation
    const navigate = useNavigate();
    //Png File
    const [img, setPNG] = useState<File | null>(null);
    //JPG file
    const [jpg, setJPG] = useState<File | null>(null); 
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
    const getImg = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        if(file)
        {
            if(file.type == "image/jpeg")
            {
                setJPG(file)   
            }
            else
            {
                setPNG(file)
            }
        }

    }

    //Download file
    const getTranslatedFile = async () =>
    {
        if(img != null || jpg != null)
        {
            
            let translatedImg;
            if(img != null)
            {
                const imgArrayBuffer = await img.arrayBuffer();
                translatedImg  = await window.api.getImgForTranslation(imgArrayBuffer, l1, l2, "png");
            }
            else if(jpg != null)
            {
                const imgArrayBuffer = await jpg.arrayBuffer();
                translatedImg  = await window.api.getImgForTranslation(imgArrayBuffer, l1, l2, "jpg");
            }

            const translatedFile = new Blob([translatedImg], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(translatedFile)
            const a = document.createElement("a");
            
            a.href = url;
            a.download = "translated.txt";

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
                accept=".png, .jpg"
                id="inputFile"
                onChange={e=>{getImg(e)}}
                />
            </div>
            
            <br></br>

            <div id="submitSection">
                <button id="submit" onClick={getTranslatedFile}>Submit</button>
            </div>
            
        </div>
        </>)
}