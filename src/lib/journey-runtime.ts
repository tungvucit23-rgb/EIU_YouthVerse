import type { Vector3Tuple } from "@/types";

/** Mutable animation data shared with the HUD/map; never drives React frames. */
export interface JourneyMotion {
  trip: number;
  elapsed: number;
  progress: number;
  position: Vector3Tuple;
  tangent: Vector3Tuple;
  speed: number;
  completed: boolean;
}
