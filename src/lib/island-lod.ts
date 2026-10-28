export interface IslandLodInput { distance:number; screenRadius:number; inViewport:boolean; detailed:boolean; selected:boolean; detailDistance:number }

/** Hysteresis is spatial; navigation phases never enable/disable an island root. */
export function shouldUseIslandDetail(input:IslandLodInput) {
  const radius = Math.max(12,input.detailDistance - 15);
  return input.selected || input.distance < radius + (input.detailed ? 3 : 0)
    || input.inViewport && input.screenRadius > (input.detailed ? 35 : 45);
}
