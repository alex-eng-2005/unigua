import "../../assets/Home/Home.css"
import subtitleImg from "../../assets/imgs/sub.png";
import { useNavigate } from "react-router-dom"

export default function Home()
{
    const navigate = useNavigate();
    //Navigate button to subtitles
    const navigateToSubtitles = () =>
    {
        window.api.showSubTextScreen();
        navigate("/subtitles");
    }
    return (
    <>

        <div className="body">
            <div className="topScreen">
                <button className="exit" onClick={()=>window.api.closeWindow()}>Exit</button>
                <button className="settings" onClick={()=> navigate("/settings")}>Settings</button>
            </div>
            <h1 className="title">Unigua</h1>
            <div className="allOptions">
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>navigateToSubtitles()}>
                        <img className="imgButton" src={subtitleImg} alt="Subtitles"/>
                    </button>
                    <p>Subtitle</p>
                </div>
            </div>
        </div>
        
    </>)
}