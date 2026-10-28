"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { destinationFromHash } from "@/data/islands";
import { initialJourney, journeyReducer, canNavigate, type JourneyAction } from "@/lib/journey-machine";
import { planLaunchRoute,planRoute } from "@/lib/navigation-graph";
import {worldSettings} from "@/data/world-settings";
import type { IslandId } from "@/types";

export function useJourney(reducedMotion = false) {
  const [state,dispatch] = useReducer(journeyReducer,initialJourney);
  const [plan,setPlan] = useState(() => planRoute("campus","campus"));
  const latest = useRef(initialJourney);
  const send = useCallback((action:JourneyAction) => { latest.current = journeyReducer(latest.current,action); dispatch(action); },[]);
  useEffect(() => {
    const restore = () => {
      if (location.hash === "#main-content") return;
      const island = destinationFromHash(location.hash) ?? "campus";
      send({type:"RESTORE",island,openContent:island !== "campus" && history.state?.view !== "world",atLaunch:island === "campus" && location.hash !== "#campus" && (history.state?.atLaunch ?? !history.state?.youthverse)});
      setPlan(planRoute(island,island));
    };
    if (location.hash || history.state?.youthverse) restore();
    window.addEventListener("popstate",restore); window.addEventListener("hashchange",restore);
    return () => { window.removeEventListener("popstate",restore); window.removeEventListener("hashchange",restore); };
  },[send]);
  useEffect(() => {
    if (state.phase !== "ROUTE_PLANNING" || !state.destination) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      if (latest.current.trip !== state.trip || latest.current.phase !== "ROUTE_PLANNING") return;
      try {
        const route = state.atLaunch ? planLaunchRoute(state.destination!) : planRoute(state.origin,state.destination!);
        setPlan(route); timer = window.setTimeout(() => send({type:"PLAN_READY",trip:state.trip}),reducedMotion ? 0 : worldSettings.departureTurnMs);
      } catch {
        const hash = state.atLaunch ? "" : "#" + state.currentIsland;
        history.replaceState({youthverse:true,view:"world",atLaunch:state.atLaunch},"",location.pathname + location.search + hash);
        send({type:"PLAN_FAILED",trip:state.trip,message:"Chưa tìm được hải trình phù hợp. Hãy chọn lại một đảo trên Hải đồ."});
      }
    });
    return () => {cancelAnimationFrame(frame);clearTimeout(timer);};
  },[state.phase,state.trip,state.origin,state.destination,state.currentIsland,state.atLaunch,reducedMotion,send]);
  const select = useCallback((destination:IslandId) => {
    if (!canNavigate(latest.current)) return;
    const hash = "#" + destination;
    history.pushState({youthverse:true,view:destination === "campus" ? "world" : "content",atLaunch:false},"",location.pathname + location.search + hash);
    send({type:"SAIL",destination});
  },[send]);
  const closeContent = useCallback(() => { history.replaceState({youthverse:true,view:"world"},"",location.href); send({type:"CLOSE_CONTENT"}); },[send]);
  useEffect(() => {
    if (state.phase !== "ARRIVED") return;
    const timer = window.setTimeout(() => send({type:"OPEN_CONTENT",trip:state.trip}),280);
    return () => clearTimeout(timer);
  },[state.phase,state.trip,send]);
  return {state,plan,select,closeContent,returnHome:() => select("campus"),
    start:useCallback(() => send({type:"START"}),[send]),
    complete:useCallback((trip:number) => send({type:"ARRIVE",trip}),[send]),
    stage:useCallback((phase:"APPROACHING"|"DOCKING",trip:number) => send({type:"PROGRESS",phase,trip}),[send]),
  };
}
