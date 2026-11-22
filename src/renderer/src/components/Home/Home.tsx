import "../../assets/Home/Home.css"
import subtitleImg from "../../assets/imgs/sub.png";
import docx_icon from "../../assets/imgs/docx_icon.png";
import pdf_icon from "../../assets/imgs/pdf-icon.png";
import wav_icon from "../../assets/imgs/wav-icon.png";
import image_icon from "../../assets/imgs/image-icon.jpg";
import translator_icon from "../../assets/imgs/translator-icon.png";
import { useNavigate } from "react-router-dom"
//c7f9cc
//80ed99
//57cc99
//38a3a5
//22577a

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
    const ImageTranslator = () => {
        navigate("/imageTranslator")
    }
    const AudioTranslator = () => {
        navigate("/audioTranslator")
    }
    return (
    <>

        <div className="body">
            <div className="topScreen">
                <button className="exiting" onClick={()=>window.api.closeWindow()}>Exit</button>
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
                        <img className="imgButton" src={translator_icon} alt="Translator"/>
                    </button>
                    <p>Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>docAndDocxEditor()}>
                        <img className="imgButton" src={docx_icon} alt="DOCX Translator"/>
                    </button>
                    <p>DOCX Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>PDFTranslator()}>
                        <img className="imgButton" src={pdf_icon} alt="PDF Translator"/>
                    </button>
                    <p>PDF Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>ImageTranslator()}>
                        <img className="imgButton" src={image_icon} alt="Image Translator"/>
                    </button>
                    <p>Image Translator</p>
                </div>
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>AudioTranslator()}>
                        <img className="imgButton" src={wav_icon} alt="Audio Translator"/>
                    </button>
                    <p>Audio Translator</p>
                </div>
            </div>
        </div>
        
    </>)
}