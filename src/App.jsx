import { Route, BrowserRouter, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Games from "./pages/Games.jsx";


function App() {
  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jogos" element={<Games />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
