import { useNavigate } from "react-router-dom";
import "../../assets/Settings/settings.css"
import { ListOfLanguages } from "./listOfLanguages";
import { useState, useEffect } from "react";

export default function Settings()
{
    //Navigation
    const navigate = useNavigate();
    //First language
    const [firstLan, setFirstLan] = useState("");
    //Second language
    const [secondLan, setSecondLan] = useState("");

    //Reads the languages
    useEffect(()=>{
        async function loadLanguages() : Promise<void>
        {
            const mainLan = await window.api.readLanguages();
            const l1 = mainLan["lan1"];
            const l2 = mainLan["lan2"];
            setFirstLan(l1);
            setSecondLan(l2);
        }
        loadLanguages();
    }, []);

    //For confirming options
    function confirmOptions(firstLan : string, secondLan : string)
    {
        window.api.changeLanguages(firstLan, secondLan);
        navigate(-1);
    }
    
    //Background
    return (
    <div className="body">
        <div className="topScreen">
            <button className="exit" onClick={()=>window.api.closeWindow()}>Exit</button>
        </div>

        <label htmlFor="option" id="presentLanguage">Put in your untranslated language</label>
        <select id="option" value={firstLan} onChange={(e)=>setFirstLan(e.target.value)}>
            {ListOfLanguages.map(value=>(
                <option  key={value.name} value={value.name}>{value.name}</option>
            ))}
        </select>
        <br/>

         <label htmlFor="option" id="postLanguage">Put in your translated language</label>
        <select  id="option" value={secondLan} onChange={(e)=>setSecondLan(e.target.value)}>
            {ListOfLanguages.map(value=>(
                <option className="option" key={value.name} value={value.name}>{value.name}</option>
            ))}
        </select>
            <br/>
        <button className="confirm" onClick={()=>confirmOptions(firstLan, secondLan)}>Confirm</button>
    </div>
    );
}