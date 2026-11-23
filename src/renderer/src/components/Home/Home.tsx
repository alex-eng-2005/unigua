import "../../assets/Home/Home.css"
import subtitleImg from "../../assets/imgs/sub.png";
import docx_icon from "../../assets/imgs/docx_icon.png";
import pdf_icon from "../../assets/imgs/pdf-icon.png";
import wav_icon from "../../assets/imgs/wav-icon.png";
import image_icon from "../../assets/imgs/image-icon.jpg";
import translator_icon from "../../assets/imgs/translator-icon.png";
import { useNavigate } from "react-router-dom"

export default function Home()
{
    const navigate = useNavigate();
    //Navigate button to scanner screen
    const navigateToSubtitles = () =>
    {
        window.api.showSubTextScreen();
        navigate("/subtitles");
    }
    //Navigate button to languageConverter screen
    const navigateToLanguageConverter = () =>
    {
        navigate("/languageConverter")
    }
    //Navigate button to docx screen
    const docAndDocxEditor = () => {
        navigate("/docAndDocxEditor")
    }
    //Navigate button to pdf screen
    const PDFTranslator = () => {
        navigate("/pdfTranslator")
    }
    //Navigate button to image translator screen
    const ImageTranslator = () => {
        navigate("/imageTranslator")
    }
    //Navigate button to audio translator screen
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
            {/* Title */}
            <h1 className="title">Unigua</h1>
            <div className="allOptions">

                {/* Automatic Scanner Button */}
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>navigateToSubtitles()}>
                        <img className="imgButton" src={subtitleImg} alt="Scanner"/>
                    </button>
                    <p>Automatic Scanner</p>
                </div>

                {/* Translator Button */}
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>navigateToLanguageConverter()}>
                        <img className="imgButton" src={translator_icon} alt="Translator"/>
                    </button>
                    <p>Translator</p>
                </div>

                {/* DOCX Translator Button */}
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>docAndDocxEditor()}>
                        <img className="imgButton" src={docx_icon} alt="DOCX Translator"/>
                    </button>
                    <p>DOCX Translator</p>
                </div>

                {/* PDF Translator Button */}
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>PDFTranslator()}>
                        <img className="imgButton" src={pdf_icon} alt="PDF Translator"/>
                    </button>
                    <p>PDF Translator</p>
                </div>

                {/* Image Translator Button */}
                <div id="optionBox">
                    <button className="optionButton" onClick={()=>ImageTranslator()}>
                        <img className="imgButton" src={image_icon} alt="Image Translator"/>
                    </button>
                    <p>Image Translator</p>
                </div>

                {/* Audio Translator Button */}
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