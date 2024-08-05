import './App.css'
import Clicker from "./game/Game.tsx";
import {SDKProvider} from "@tma.js/sdk-react";

function App() {


  return (
    <>
        <SDKProvider>
      <Clicker/>
        </SDKProvider>
    </>
  )
}

export default App
