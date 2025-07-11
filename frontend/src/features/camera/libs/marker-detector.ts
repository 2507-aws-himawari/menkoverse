import type { DetectedMarker, MarkerDetectionOptions } from '../types';
import { createARJSHelper } from './arjs-helper';

export class MarkerDetector {
  private arjsHelper = createARJSHelper();
  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;

  async initialize(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    options: MarkerDetectionOptions = { enabled: true, sensitivity: 0.5, frameRate: 30 }
  ) {
    try {
      this.canvas = canvas;
      
      // Canvasサイズをビデオに合わせる
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // AR.js初期化
      await this.arjsHelper.initialize(canvas, video, {
        dictionaryName: '4x4_1000',
        markerSize: 100, // 100mm
      });

      return true;
    } catch (error) {
      console.error('MarkerDetector initialization failed:', error);
      throw error;
    }
  }

  startDetection(
    video: HTMLVideoElement,
    onDetection: (markers: DetectedMarker[]) => void,
    options: MarkerDetectionOptions = { enabled: true, sensitivity: 0.5, frameRate: 30 }
  ) {
    if (this.isRunning) {
      console.log('Detection already running, stopping previous detection');
      this.stopDetection();
    }

    console.log('Starting marker detection with options:', options);
    this.isRunning = true;
    const frameInterval = 1000 / Math.min(options.frameRate, 30); // 最大30fps
    let lastFrameTime = 0;

    const detectFrame = (currentTime: number) => {
      if (!this.isRunning) {
        console.log('Detection stopped, exiting frame loop');
        return;
      }

      // フレームレート制御（より寛容な条件）
      const shouldProcess = currentTime - lastFrameTime >= frameInterval || lastFrameTime === 0;
      
      if (shouldProcess) {
        console.log('Processing detection frame:', {
          currentTime,
          lastFrameTime,
          frameInterval,
          timeSinceLastFrame: currentTime - lastFrameTime
        });
        
        try {
          const rawMarkers = this.arjsHelper.detectMarkers(video);
          const processedMarkers = this.processDetectedMarkers(rawMarkers, options.sensitivity);
          
          console.log('Detection result:', {
            rawMarkersCount: rawMarkers.length,
            processedMarkersCount: processedMarkers.length,
            rawMarkers: rawMarkers.map(m => ({ id: m.id, confidence: m.confidence }))
          });
          
          if (processedMarkers.length > 0) {
            console.log('Calling onDetection with markers:', processedMarkers);
            onDetection(processedMarkers);
          }
        } catch (error) {
          console.error('Frame detection error:', error);
          // エラーが発生してもループを継続
        }
        
        lastFrameTime = currentTime;
      } else {
        // フレームレート制御によりスキップ
        console.log('Skipping frame due to rate limit');
      }

      // 次のフレームをスケジュール
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(detectFrame);
      } else {
        console.log('Detection loop stopped, not scheduling next frame');
      }
    };

    this.animationFrameId = requestAnimationFrame(detectFrame);
  }

  stopDetection() {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private processDetectedMarkers(rawMarkers: any[], sensitivity: number): DetectedMarker[] {
    return rawMarkers
      .filter(marker => marker.confidence >= sensitivity) // 信頼度フィルター
      .map(marker => {
        const pose = this.arjsHelper.extractPoseFromMatrix(marker.matrix);
        
        return {
          id: marker.id,
          position: pose.position,
          rotation: pose.rotation,
          confidence: marker.confidence,
          timestamp: marker.timestamp,
        };
      })
      .filter(marker => this.isValidMarker(marker)); // 有効性チェック
  }

  private isValidMarker(marker: DetectedMarker): boolean {
    // 対象マーカーID（0, 1）のチェック（AR.js Barcodeマーカー用）
    if (![0, 1].includes(marker.id)) {
      return false;
    }

    // 位置の妥当性チェック（極端な値を除外）
    const { position } = marker;
    if (
      Math.abs(position.x) > 1000 ||
      Math.abs(position.y) > 1000 ||
      Math.abs(position.z) > 1000
    ) {
      return false;
    }

    // 信頼度の最小しきい値
    return marker.confidence > 0.1;
  }

  cleanup() {
    this.stopDetection();
    this.arjsHelper.cleanup();
    this.canvas = null;
  }
}

export const createMarkerDetector = () => new MarkerDetector();
