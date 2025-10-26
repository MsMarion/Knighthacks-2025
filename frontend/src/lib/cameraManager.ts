"use client";

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo['kind'];
}

class CameraManager {
  private devices: CameraDevice[] = [];
  private streams: Map<string, MediaStream> = new Map();
  private listeners: Set<() => void> = new Set();

  async initialize() {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Get all devices
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      this.devices = deviceInfos
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize camera manager:', error);
    }
  }

  getDevices(): CameraDevice[] {
    return [...this.devices];
  }

  async getStream(deviceId: string): Promise<MediaStream | null> {
    try {
      console.log('Getting stream for device:', deviceId);
      
      // Return existing stream if available
      if (this.streams.has(deviceId)) {
        console.log('Returning existing stream');
        return this.streams.get(deviceId)!;
      }

      console.log('Creating new stream...');
      // Create new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false
      });

      console.log('Stream created:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      
      this.streams.set(deviceId, stream);
      return stream;
    } catch (error) {
      console.error('Failed to get camera stream:', error);
      return null;
    }
  }

  stopStream(deviceId: string) {
    const stream = this.streams.get(deviceId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.streams.delete(deviceId);
    }
  }

  stopAllStreams() {
    this.streams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.streams.clear();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const cameraManager = new CameraManager();
