"use client";
import {useEffect,useMemo} from "react";
import type {Group} from "three";
import {disposeModel} from "@/lib/art/model-kit";
export function ProceduralModel({build}:{build:() => Group}) {
  const model = useMemo(() => build(),[build]);
  useEffect(() => () => disposeModel(model),[model]);
  return <primitive object={model} dispose={null}/>;
}
