import { useNavigate } from "react-router-dom";
import "../../assets/Subtitles/Subtitles.css";
import { useEffect, useState, type ChangeEvent } from "react";

export default function SeperateText() {
    const [text, setText] = useState("");
    const [quality, setQuality] = useState("Fast");
    const navigate = useNavigate();

     //Sends in the setting of translation the user wants
    function sendQuality(e: ChangeEvent<HTMLSelectElement>) {
        setQuality(e.target.value);
        window.api.qualitySettings(e.target.value);
    }

    //Confirms the user wants to grammar check the sentence
    function sendGrammar(e: ChangeEvent<HTMLInputElement>) {
        window.api.grammarSettings(e.target.checked);
    }

    useEffect(() => {
        //Sends the new text back
        window.api.onRetrieveText((newText) => {
            setText(newText);
        });
    }, []);

    return (
        <>
            <div className="subtitlesText">
                {/* Settings button */}
                <button id="settings" onClick={() => navigate("/settings")}>Settings</button>
                {/* Home button */}
                <button id="home" onClick={() => window.api.backToHome()}>Home</button>
                {/* Quality Features */}
                <select id="qualityFeatures" value={quality} onChange={sendQuality}>
                    <option value="Fast">Fast</option>
                    <option value="Concise">Concise</option>
                    <option value="Deep">Deep</option>
                </select>
                {/* Grammar Mode */}
                <label htmlFor="grammar-mode">Grammar Mode</label>
                <input type="checkbox" id="grammar-mode" name="grammar" role="switch" onChange={sendGrammar}/>
                <p>{text}</p>
            </div>
        </>
    );
}