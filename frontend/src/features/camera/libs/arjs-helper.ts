import type { ArUcoMarkerConfig } from '../types';

export class ARJSHelper {
  private arToolkitContext: any = null;
  private initialized = false;

  async initialize(canvas: HTMLCanvasElement, video: HTMLVideoElement, config: ArUcoMarkerConfig) {
    try {
      // AR.jsの動的インポート（ブラウザでのみ実行）
      if (typeof window === 'undefined') {
        throw new Error('AR.js can only be used in browser environment');
      }

      // AR.jsライブラリの読み込み
      if (!(window as any).ARjs) {
        await this.loadARJSLibrary();
      }
      console.log("AR.js library loaded successfully");

      // ArToolkitContextの初期化
      this.arToolkitContext = new (window as any).ARjs.Context({
        cameraParametersUrl: '/camera_para.dat', // カメラパラメータファイル
        detectionMode: 'mono_and_matrix',
        matrixCodeType: config.dictionaryName, // '4x4_1000'
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        renderer: {
          context: canvas.getContext('2d'),
          canvas: canvas,
        },
      });

      await new Promise((resolve, reject) => {
        this.arToolkitContext.init(() => {
          this.initialized = true;
          resolve(true);
        }, reject);
      });

      return true;
    } catch (error) {
      console.error('AR.js initialization failed:', error);
      throw error;
    }
  }

  private async loadARJSLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      // AR.jsライブラリをCDNから動的読み込み
      const script = document.createElement('script');
      script.src = 'https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar.js';
      script.onload = () => resolve();
      script.onerror = () => reject;
      document.head.appendChild(script);
    });
  }

  detectMarkers(videoElement: HTMLVideoElement): any[] {
    if (!this.initialized || !this.arToolkitContext) {
      return [];
    }

    try {
      // フレーム解析
      this.arToolkitContext.process(videoElement);

      // 検出されたマーカーを取得
      const detectedMarkers = [];
      const markerNum = this.arToolkitContext.getMarkerNum();

      for (let i = 0; i < markerNum; i++) {
        const markerMatrix = this.arToolkitContext.getMarkerMatrix(i);
        const markerId = this.arToolkitContext.getMarkerId(i);
        const confidence = this.arToolkitContext.getMarkerConfidence(i);

        detectedMarkers.push({
          id: markerId,
          matrix: markerMatrix,
          confidence: confidence,
          timestamp: Date.now(),
        });
      }

      return detectedMarkers;
    } catch (error) {
      console.error('Marker detection failed:', error);
      return [];
    }
  }

  extractPoseFromMatrix(matrix: number[]): { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } } {
    // マーカーマトリックスから位置と回転を抽出
    // これは簡略化された実装です
    const safeGet = (index: number): number => matrix[index] ?? 0;

    return {
      position: {
        x: safeGet(12),
        y: safeGet(13),
        z: safeGet(14),
      },
      rotation: {
        x: Math.atan2(safeGet(6), safeGet(10)),
        y: Math.atan2(-safeGet(2), Math.sqrt(safeGet(6) * safeGet(6) + safeGet(10) * safeGet(10))),
        z: Math.atan2(safeGet(1), safeGet(0)),
      },
    };
  }

  cleanup() {
    if (this.arToolkitContext) {
      // AR.jsコンテキストのクリーンアップ
      this.arToolkitContext = null;
    }
    this.initialized = false;
  }
}

export const createARJSHelper = () => new ARJSHelper();
