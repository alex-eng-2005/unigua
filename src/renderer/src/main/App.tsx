import { HashRouter, Routes, Route} from "react-router-dom";
import Home from "../components/Home/Home";
import Settings from "../components/Settings/Settings";
import Subtitles from "@renderer/components/Subtitles/Subtitles";
import SeperateText from "@renderer/components/Subtitles/SeperateText";
function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/settings" element={<Settings/>}></Route>
        <Route path="/subtitles" element={<Subtitles/>}></Route>
        <Route path="/SeperateText" element={<SeperateText/>}></Route>
      </Routes>
    </HashRouter>
  )
}

export default App
