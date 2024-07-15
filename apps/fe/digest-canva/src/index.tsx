import * as ReactDOM from "react-dom";
import App from "./App";
import { AppUiProvider } from "@canva/app-ui-kit";
import "@canva/app-ui-kit/styles.css";


ReactDOM.render(<AppUiProvider><App/></AppUiProvider>, document.getElementById("root"));