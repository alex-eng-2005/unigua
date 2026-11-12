import "../../assets/Home/Home.css"
import subtitleImg from "../../assets/imgs/sub.png";
import soundImg from "../../assets/imgs/Sound-icon.jpg";
import { useNavigate } from "react-router-dom"
import docAndDocxEditor from "../docAndDocxEditor/docAndDocxEditor";
import PDFTranslator from "../PDFTranslator/PDFTranslator";

export default function Home()
{
    const navigate = useNavigate();
    //Navigate button to subtitles
    const navigateToSubtitles = () =>
    {
        window.api.showSubTextScreen();
        navigate("/subtitles");
    }
    const navigateToLanguageConverter = () =>
    {
        navigate("/languageConverter")
    }
    const docAndDocxEditor = () => {
        navigate("/docAndDocxEditor")
    }
    const PDFTranslator = () => {
        navigate("/pdfTranslator")
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
                        <img className="imgButton" src={subtitleImg} alt="Scanner"/>
                    </button>
                    <p>Automatic Scanner</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>navigateToLanguageConverter()}>
                        <img className="imgButton" src={subtitleImg} alt="Translator"/>
                    </button>
                    <p>Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>docAndDocxEditor()}>
                        <img className="imgButton" src={subtitleImg} alt="DOCX Translator"/>
                    </button>
                    <p>DOCX Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>PDFTranslator()}>
                        <img className="imgButton" src={subtitleImg} alt="PDF Translator"/>
                    </button>
                    <p>PDF Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>PDFTranslator()}>
                        <img className="imgButton" src={subtitleImg} alt="Image Translator"/>
                    </button>
                    <p>Image Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>PDFTranslator()}>
                        <img className="imgButton" src={soundImg} alt="Audio Translator"/>
                    </button>
                    <p>Audio Translator</p>
                </div>
            </div>
        </div>
        
    </>)
}