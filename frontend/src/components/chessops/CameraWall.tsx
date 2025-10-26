"use client";
import { CameraFeed } from "./CameraFeed";

export function CameraWall() {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex-1 min-h-0">
        <CameraFeed title="Robot Arm" />
      </div>
      <div className="flex-1 min-h-0">
        <CameraFeed title="Top-Down Board" />
      </div>
    </div>
  );
}
