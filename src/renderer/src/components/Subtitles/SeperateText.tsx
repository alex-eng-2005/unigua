import { useNavigate } from "react-router-dom";
import "../../assets/Subtitles/Subtitles.css";
import { useEffect, useState, type ChangeEvent } from "react";

export default function SeperateText() {
    const [text, setText] = useState("");
    const [quality, setQuality] = useState("Fast");
    const [grammar, setGrammar] = useState(false);
    const navigate = useNavigate();

    function sendQuality(e: ChangeEvent<HTMLSelectElement>) {
        setQuality(e.target.value);
        window.api.qualitySettings(e.target.value);
    }

    function sendGrammar(e: ChangeEvent<HTMLInputElement>) {
        setGrammar(e.target.checked);
        window.api.grammarSettings(e.target.checked);
    }

    useEffect(() => {
        window.api.onRetrieveText((newText) => {
            setText(newText);
        });
    }, []);

    return (
        <>
            <div className="subtitlesText">
                <button id="settings" onClick={() => navigate("/settings")}>Settings</button>
                <button id="home" onClick={() => window.api.backToHome()}>Home</button>
                <select id="qualityFeatures" value={quality} onChange={sendQuality}>
                    <option value="Fast">Fast</option>
                    <option value="Concise">Concise</option>
                    <option value="Deep">Deep</option>
                </select>
                <label htmlFor="grammar-mode">Grammar Mode</label>
                <input type="checkbox" id="grammar-mode" name="grammar" role="switch" onChange={sendGrammar}/>
                <p>{text}</p>
            </div>
        </>
    );
}