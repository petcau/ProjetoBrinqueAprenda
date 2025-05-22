import { Route, Router} from "react-router-dom";

function Menu(){
    return(
        <div>
        <link to = "/"><button>Home</button></link>
        <link to = "./Jogo"><button>Jogo</button></link>
        </div>
    )
}export default Menu;