import { useContext } from "react";
import { NetworkContext } from "./NetworkProvider";

export const useNetwork = () => useContext(NetworkContext);
