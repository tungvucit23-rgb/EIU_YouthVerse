import {expect,type Page} from "@playwright/test";
import {writeFile} from "node:fs/promises";
type RecordingWindow = Window & {worldRecorder?:MediaRecorder;worldChunks?:Blob[];worldRecording?:boolean};
/** QA-only framebuffer retention; production renderer settings are unchanged. */
export async function installRecordingContext(page:Page) {
 await page.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(this:HTMLCanvasElement,type:string,...args:unknown[]) {
   if(type === "webgl" || type === "webgl2" || type === "experimental-webgl") args[0] = {...args[0] as object,preserveDrawingBuffer:true};
   return Reflect.apply(original,this,[type,...args]);
  } as typeof original;
 });
}
export async function startWorldRecording(page:Page) {
 await page.locator("canvas").evaluate(async element => {
  const source = element as HTMLCanvasElement,w = window as RecordingWindow,output = document.createElement("canvas"),sky = new Image();
  output.width = 960;output.height = 600;sky.src = "/images/sky-clouds-v2.webp";await sky.decode();const context = output.getContext("2d")!;
  w.worldRecording = true;w.worldChunks = [];
  const draw = () => {const scale = Math.max(output.width / sky.naturalWidth,output.height / sky.naturalHeight),width = sky.naturalWidth * scale,height = sky.naturalHeight * scale;context.drawImage(sky,(output.width - width) / 2,(output.height - height) / 2,width,height);context.drawImage(source,0,0,output.width,output.height);if(w.worldRecording) requestAnimationFrame(draw);};draw();
  w.worldRecorder = new MediaRecorder(output.captureStream(10),{mimeType:"video/webm",videoBitsPerSecond:1400000});w.worldRecorder.ondataavailable = e => {if(e.data.size) w.worldChunks!.push(e.data);};w.worldRecorder.start();
 });
}
export async function stopWorldRecording(page:Page,path:string) {
 const bytes = await page.evaluate(() => new Promise<number[]>(resolve => {const w = window as RecordingWindow;w.worldRecorder!.onstop = async () => {w.worldRecording = false;const blob = new Blob(w.worldChunks,{type:"video/webm"});resolve(Array.from(new Uint8Array(await blob.arrayBuffer())));w.worldRecorder!.stream.getTracks().forEach(t => t.stop());};w.worldRecorder!.stop();}));
 expect(bytes.length).toBeGreaterThan(10000);await writeFile(path,Buffer.from(bytes));
}
