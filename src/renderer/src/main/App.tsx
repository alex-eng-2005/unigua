import { HashRouter, Routes, Route} from "react-router-dom";
import Home from "../components/Home/Home";
import Settings from "../components/Settings/Settings";
import Subtitles from "@renderer/components/Subtitles/Subtitles";
import SeperateText from "@renderer/components/Subtitles/SeperateText";
import LanguageConverter from "@renderer/components/Language_Converter/LanguageConverter";
import DocAndDocxEditor from "@renderer/components/docAndDocxEditor/docAndDocxEditor";
import PDFTranslator from "@renderer/components/PDFTranslator/PDFTranslator";
import ImageTranslator from "@renderer/components/ImageTranslator/ImageTranslator";
import AudioTranslator from "@renderer/components/audioTranslator/audioTranslator";
function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/settings" element={<Settings/>}></Route>
        <Route path="/subtitles" element={<Subtitles/>}></Route>
        <Route path="/SeperateText" element={<SeperateText/>}></Route>
        <Route path="/languageConverter" element={<LanguageConverter/>}></Route>
        <Route path="/docAndDocxEditor" element={<DocAndDocxEditor/>}></Route>
        <Route path="/pdfTranslator" element={<PDFTranslator/>}></Route>
        <Route path="/imageTranslator" element={<ImageTranslator/>}></Route>
        <Route path="/audioTranslator" element={<AudioTranslator/>}></Route>
      </Routes>
    </HashRouter>
  )
}

export default App
