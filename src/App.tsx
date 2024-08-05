import './App.css'
import  {Game} from "./game/Game.tsx";
import {SDKProvider} from "@tma.js/sdk-react";

function App() {


  return (
    <>
        <SDKProvider>
      <Game/>
        </SDKProvider>
    </>
  )
}

export default App
