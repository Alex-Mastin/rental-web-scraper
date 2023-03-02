import {HTMLAttributes} from "react";
import './styles.scss'
import Listings from "../../features/Listings/Listings";

interface Props extends HTMLAttributes<HTMLDivElement> {
  // No additional props provided
}

export default function App (props: Props) {
  return (
    <div className="app grid-layout">
      <Listings/>
    </div>
  )
}
