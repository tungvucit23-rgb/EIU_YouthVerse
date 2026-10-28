"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowUpRight, Compass, Mouse } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { destinations, getDestination, getIsland, HOME_BOAT_POSITION } from "@/data/islands";
import { worldSettings } from "@/data/world-settings";
import { useJourney } from "@/hooks/use-journey";
import { useGraphicsQuality } from "@/hooks/use-graphics-quality";
import { useMediaQuery } from "@/hooks/use-media-query";
import {useNavigationComfort} from "@/hooks/use-navigation-comfort";
import { isTransitioning } from "@/lib/journey-machine";
import { easeSailing, samplePlanInto } from "@/lib/navigation-graph";
import type { JourneyMotion } from "@/lib/journey-runtime";
import type { RouteSample } from "@/types/navigation";
import type { WorldPreviews } from "@/types";
import { DestinationHint } from "./DestinationHint";
import { DestinationPicker, DestinationPickerTrigger } from "./DestinationPicker";
import { DestinationIcon } from "./DestinationIcon";
import { HelpDialog } from "./HelpDialog";
import { HeroIntroduction } from "./HeroIntroduction";
import { IslandInfoPanel } from "./IslandInfoPanel";
import { JourneyStatus } from "./JourneyStatus";
import { LightweightWorld } from "./LightweightWorld";
import { MobileDestinationSheet } from "./MobileDestinationSheet";
import { SceneErrorBoundary, SceneLoadingScreen } from "./SceneStatus";

const WorldCanvas = dynamic(() => import("@/components/world/WorldCanvas"), { ssr:false,loading:() => null });

export function YouthVerseExperience({ previews }: { previews:WorldPreviews }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const {directTransition,setDirectTransition} = useNavigationComfort(reducedMotion);
  const { state,plan,start,select,returnHome,closeContent,complete,stage } = useJourney(reducedMotion,directTransition);
  const { quality,setQuality } = useGraphicsQuality();
  const [ready,setReady] = useState(false), [unavailable,setUnavailable] = useState(false), [simplified,setSimplified] = useState(false);
  const [pickerOpen,setPickerOpen] = useState(false), [helpOpen,setHelpOpen] = useState(false);
  const mobile = useMediaQuery("(max-width: 767px), (max-width: 1023px) and (orientation: portrait)");
  const pickerButton = useRef<HTMLButtonElement>(null), previousPhase = useRef(state.phase);
  const mobilePicker = useRef<HTMLButtonElement>(null);
  const moving = isTransitioning(state), traveling = ["SAILING","APPROACHING","DOCKING"].includes(state.phase);
  const fallback = unavailable || simplified;
  const destination = getDestination(state.currentIsland);
  const motion = useRef<JourneyMotion>({trip:-1,elapsed:0,progress:0,position:[...HOME_BOAT_POSITION],tangent:[0,0,-1],speed:0,completed:false});
  const sceneReady = useCallback(() => setReady(true), []), sceneUnavailable = useCallback(() => setUnavailable(true), []);
  const handleDocked = useCallback((trip:number) => { setPickerOpen(false); setHelpOpen(false); complete(trip); }, [complete]);
  const openMap = () => { if (state.phase === "IDLE") start(); if (state.phase === "EXPLORING_CONTENT") closeContent(); setPickerOpen(true); };

  useEffect(() => {
    if (state.phase !== "IDLE" || mobile || pickerOpen || helpOpen) return;
    const explore = (event:WheelEvent) => { if (event.deltaY > 25) start(); };
    window.addEventListener("wheel",explore,{passive:true}); return () => window.removeEventListener("wheel",explore);
  }, [state.phase,mobile,pickerOpen,helpOpen,start]);

  useEffect(() => {
    if ((previousPhase.current === "IDLE" || previousPhase.current === "ARRIVED" || previousPhase.current === "EXPLORING_CONTENT") && state.phase === "SELECTING_DESTINATION" && !pickerOpen) (mobile ? mobilePicker.current : pickerButton.current)?.focus({preventScroll:true});
    previousPhase.current = state.phase;
  }, [state.phase,pickerOpen,mobile]);

  useEffect(() => { if (ready || fallback) return; const timer = window.setTimeout(() => setUnavailable(true),worldSettings.assetTimeoutMs); return () => clearTimeout(timer); }, [ready,fallback]);

  useEffect(() => {
    if (!fallback) return;
    if (!traveling) { const current = state.atLaunch ? HOME_BOAT_POSITION : getIsland(state.currentIsland).dockingPoint; motion.current.position = [...current]; return; }
    const sample:RouteSample = {position:[0,0,0],tangent:[0,0,-1],edgeIndex:0};
    if (motion.current.trip !== state.trip) { motion.current.trip = state.trip; motion.current.elapsed = 0; motion.current.progress = 0; motion.current.completed = false; }
    const duration = reducedMotion ? worldSettings.reducedMotionSeconds : Math.min(2.4,plan.duration * 0.4);
    const started = performance.now() - motion.current.elapsed * 1000;
    let frame = 0, sent = 0;
    const animate = (now:number) => {
      const current = motion.current; current.elapsed = (now - started) / 1000;
      const raw = Math.min(1,current.elapsed / duration); current.progress = easeSailing(raw);
      samplePlanInto(plan,current.progress,sample); current.position = [...sample.position]; current.tangent = [...sample.tangent];
      if (current.progress >= worldSettings.approachAt && sent < 1) { sent = 1; stage("APPROACHING",state.trip); }
      if (current.progress >= worldSettings.dockingAt && sent < 2) { sent = 2; stage("DOCKING",state.trip); }
      if (raw === 1) { current.completed = true; handleDocked(state.trip); return; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [fallback,traveling,state.trip,state.currentIsland,state.atLaunch,plan,reducedMotion,handleDocked,stage]);

  return <main className={"world-page archipelago-world boat-centric phase-" + state.phase.toLowerCase() + (fallback ? " is-fallback" : "")} id="main-content" tabIndex={-1} data-phase={state.phase} data-current-island={state.currentIsland} data-at-launch={state.atLaunch}>
    <div className="sky-backdrop" aria-hidden="true"><div className="sky-photograph" /><div className="sun-glow" /><div className="sky-haze" /></div>
    <div className="world-canvas" data-testid="world-canvas">{fallback ? <LightweightWorld state={state} motion={motion} onSelect={select} /> : <SceneErrorBoundary onError={sceneUnavailable}><WorldCanvas state={state} plan={plan} motion={motion} quality={quality} mobile={mobile} reducedMotion={reducedMotion || directTransition} onSelect={select} onComplete={handleDocked} onStage={stage} onReady={sceneReady} onUnavailable={sceneUnavailable} /></SceneErrorBoundary>}</div>
    <div className="world-vignette" aria-hidden="true" /><SiteHeader onSearch={openMap} />
    <AnimatePresence>{state.phase === "IDLE" && <HeroIntroduction key="hero" onStart={start} />}</AnimatePresence>
    {state.phase === "SELECTING_DESTINATION" && <DestinationHint />}
    {state.phase === "IDLE" && <div className="sky-note" aria-hidden="true"><em>Hơn cả một hành trình,<br /><span>đó là thanh xuân.</span></em><svg viewBox="0 0 280 25"><path d="M4 21C90 20 176-5 257 5C276 8 265 14 250 13" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></div>}
    {!fallback && ready && <div className="island-labels is-ready" aria-hidden={state.phase === "EXPLORING_CONTENT"}>
      {(state.atLaunch || state.destination === "campus") && <button id="island-label-campus" className="island-label is-campus" disabled={state.phase !== "IDLE" && state.phase !== "SELECTING_DESTINATION"} tabIndex={-1} onClick={() => select("campus")} aria-label="Căng buồm đến EIU Grand Campus"><Compass size={14}/><span>EIU Grand Campus</span><ArrowUpRight size={12}/></button>}
      {destinations.map((island) => <button id={"island-label-" + island.id} key={island.id} className={"island-label" + (state.destination === island.id ? " is-target" : "")} disabled={state.phase !== "IDLE" && state.phase !== "SELECTING_DESTINATION"} tabIndex={-1} onClick={() => select(island.id)} aria-label={"Căng buồm đến " + island.fullTitle}><DestinationIcon id={island.id} size={14} /><span>{island.title}</span><ArrowUpRight size={12} /></button>)}
    </div>}
    {state.routeError && <p className="journey-error" role="alert">{state.routeError}</p>}
    {moving && <JourneyStatus state={state} plan={plan} motion={motion} />}
    {state.phase === "EXPLORING_CONTENT" && destination && <IslandInfoPanel destination={destination} previews={previews[destination.id]} onClose={closeContent} onReturn={returnHome} onMap={() => { closeContent(); setPickerOpen(true); }} />}
    {!ready && !fallback && <SceneLoadingScreen />}
    {state.phase !== "EXPLORING_CONTENT" && <footer className="world-footer">
      <button className="scroll-to-explore" disabled={moving && state.currentIsland !== "campus"} onClick={() => { if (state.phase === "IDLE") start(); else if (state.currentIsland !== "campus") returnHome(); else setHelpOpen(true); }} aria-label={state.phase === "IDLE" ? "Mở bản đồ khám phá" : state.currentIsland === "campus" ? "Hướng dẫn khám phá" : "Trở về EIU"}><span className="scroll-stem" /><span className="scroll-copy">{state.phase === "IDLE" ? <>SCROLL<br />TO EXPLORE</> : state.currentIsland === "campus" ? <>CÀI ĐẶT<br />HƯỚNG DẪN</> : <>TRỞ VỀ<br />EIU</>}</span>{state.phase === "IDLE" ? <Mouse size={24} strokeWidth={1} /> : state.currentIsland === "campus" ? <Compass size={20} strokeWidth={1.3} /> : <ArrowLeft size={20} strokeWidth={1.3} />}</button>
      <DestinationPickerTrigger buttonRef={pickerButton} onClick={openMap} />
      <button className="footer-signature" onClick={() => setHelpOpen(true)} aria-label="Cài đặt đồ họa và hướng dẫn"><Compass size={31} strokeWidth={1} /><span>EXPLORE — CONNECT — CONTRIBUTE</span><span className="signature-line" /></button>
    </footer>}
    {mobile && state.phase === "SELECTING_DESTINATION" && <MobileDestinationSheet atLaunch={state.atLaunch} current={state.currentIsland} onMap={openMap} onSettings={() => setHelpOpen(true)} buttonRef={mobilePicker} />}
    {pickerOpen && <DestinationPicker state={state} plan={plan} motion={motion} onSelect={select} onClose={() => setPickerOpen(false)} />}
    {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} simplified={simplified} onToggleSimplified={() => { setSimplified((value) => !value); setHelpOpen(false); }} quality={quality} onQuality={setQuality} directTransition={directTransition} onDirectTransition={setDirectTransition} />}
    <div className="sr-only" aria-live="polite" aria-atomic="true">{state.phase === "SELECTING_DESTINATION" ? "Bạn đang ở " + (state.atLaunch ? "Bến khởi hành" : getIsland(state.currentIsland).title) + ". Mở Hải đồ hoặc chọn một đảo gần để tiếp tục." : state.phase === "EXPLORING_CONTENT" ? "Đã cập bến " + destination?.fullTitle : ""}</div>
  </main>;
}
