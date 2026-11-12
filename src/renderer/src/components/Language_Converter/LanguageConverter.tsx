import { useNavigate } from "react-router-dom";
import "../../assets/Language_Converter/Language_Converter.css"
import { useEffect, useState } from "react";

//Converts the languages into different
export default function LanguageConverter()
{
    //Navigation
    const navigate = useNavigate();
    //First Language
    const [l1, setL1] = useState("")
    //Second language
    const [l2, setL2] = useState("")
    //Second language
    const [output, setOutput] = useState("")
    
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

    //Sends the text
    function sendText(str : string)
    {
        //Translated Text
        const translatedText = window.api.getTextResults(str, l1, l2);
        //Translated Text
        setOutput(translatedText);
    }

    return (
   
        <>
        <div id="languageBody">
            <div id="menu">
                <button id="settingButton" onClick={() => navigate("/settings")}>Settings</button>
                <button id="homeButton" onClick={() => navigate("/")}>Home</button>
            </div>
            <div>
                <div id="enterHeader">
                    <p id="lan1">{l1}</p>
                    <button id="enterInput" onClick={() => sendText((document.getElementById("inputLanguage") as HTMLTextAreaElement | null)?.value ?? "")}>Enter</button>
                </div>
                <textarea id="inputLanguage"></textarea>
            </div>
            <div>   
                <p id="lan2">{l2}</p>
                <div id="output">{output}</div>
            </div>
        </div>
        </>
    )
}