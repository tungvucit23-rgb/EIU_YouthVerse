"use client";
import {useSyncExternalStore} from "react";
type Mode = "auto"|"sail"|"direct";
const key = "youthverse.navigation-mode",event = "youthverse:navigation-mode";
let memory:Mode = "auto";
const subscribe = (listener:() => void) => {window.addEventListener("storage",listener);window.addEventListener(event,listener);return () => {window.removeEventListener("storage",listener);window.removeEventListener(event,listener);};};
const snapshot = ():Mode => {try{const saved = localStorage.getItem(key);return saved === "direct" || saved === "sail" ? saved : memory;}catch{return memory;}};
export function useNavigationComfort(reducedMotion:boolean) {
 const mode = useSyncExternalStore(subscribe,snapshot,() => "auto" as Mode);
 return {directTransition:mode === "direct" || mode === "auto" && reducedMotion,setDirectTransition:(direct:boolean) => {memory = direct ? "direct" : "sail";try{localStorage.setItem(key,memory);}catch{/* Keep the in-memory option when storage is unavailable. */}window.dispatchEvent(new Event(event));}};
}
