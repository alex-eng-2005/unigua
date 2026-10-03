import { useNavigate } from "react-router-dom";
import "../../assets/Subtitles/Subtitles.css";
import { useEffect, useState, type ChangeEvent } from "react";

export default function SeperateText() {
    const [text, setText] = useState("");
    const [quality, setQuality] = useState("fast");
    const navigate = useNavigate();

    function sendQuality(e: ChangeEvent<HTMLSelectElement>) {
        setQuality(e.target.value);
        window.api.qualitySettings(e.target.value);
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
                    <option value="fast">fast</option>
                    <option value="concise">concise</option>
                    <option value="deep">deep</option>
                </select>
                <p>{text}</p>
            </div>
        </>
    );
}