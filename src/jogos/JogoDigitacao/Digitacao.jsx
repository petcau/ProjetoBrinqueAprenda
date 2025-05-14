import { redirect, Router } from "react-router-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./Paginas/Home";
function App(){
  return(
    
      <Routes>
        <Route path="/" element ={<Home/>}/>
        </Routes>    
  )
}export default App;
  