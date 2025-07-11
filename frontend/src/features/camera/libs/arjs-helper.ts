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
      if (!(window as any).THREEx) {
        await this.loadARJSLibrary();
      }
      
      // デバッグ: 利用可能な名前空間を確認
      console.log('THREE:', (window as any).THREE);
      console.log('THREEx:', (window as any).THREEx);
      console.log('Available AR/THREE namespaces:', Object.keys(window).filter(k => k.includes('AR') || k.includes('THREE')));
      console.log("AR.js libraries loaded successfully");

      // THREEx と THREE の存在確認
      if (!(window as any).THREE) {
        throw new Error('THREE.js not found in global scope');
      }
      if (!(window as any).THREEx) {
        throw new Error('THREEx not found in global scope');
      }
      if (!(window as any).THREEx.ArToolkitContext) {
        throw new Error('THREEx.ArToolkitContext not found');
      }

      console.log('Creating ArToolkitContext with config:', config);

      // ArToolkitContextの初期化
      this.arToolkitContext = new (window as any).THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://raw.githack.com/AR-js-org/AR.js/3.4.7/data/data/camera_para.dat',
        detectionMode: 'mono_and_matrix',
        matrixCodeType: config.dictionaryName, // '4x4_1000'
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
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
    try {
      // 1. Three.js を先に読み込み、window.THREEに明示的に代入
      if (!(window as any).THREE) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        console.log('Three.js loaded successfully');
        
        // Three.jsがグローバルに設定されていることを確認
        if (!(window as any).THREE) {
          throw new Error('THREE.js failed to load into global scope');
        }
      }

      // 2. AR.js（three.js形式）を読み込み（blogパターンに従い、scriptタグを削除）
      if (!(window as any).THREEx) {
        await this.loadScriptAndCleanup('https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar-threex.js');
        console.log('AR.js ar-threex loaded successfully');
        
        // THREExが利用可能になったことを確認
        if (!(window as any).THREEx) {
          throw new Error('THREEx failed to load into global scope');
        }
      }
    } catch (error) {
      console.error('Failed to load AR.js libraries:', error);
      throw error;
    }
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = (error) => {
        console.error(`Failed to load script: ${url}`, error);
        reject(new Error(`Failed to load script: ${url}`));
      };
      document.head.appendChild(script);
    });
  }

  private loadScriptAndCleanup(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // blogパターンに従い、読み込み完了後にscriptタグを削除
        document.body.removeChild(script);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Failed to load script: ${url}`, error);
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error(`Failed to load script: ${url}`));
      };
      document.body.appendChild(script);
    });
  }

  detectMarkers(videoElement: HTMLVideoElement): any[] {
    if (!this.initialized || !this.arToolkitContext) {
      return [];
    }

    try {
      // フレーム解析
      this.arToolkitContext.update(videoElement);

      // 検出されたマーカーを取得
      const detectedMarkers = [];
      
      // THREEx.ArToolkitContext の新しい API を使用
      if (this.arToolkitContext.arController) {
        const markerNum = this.arToolkitContext.arController.getMarkerNum();
        
        for (let i = 0; i < markerNum; i++) {
          const markerMatrix = this.arToolkitContext.arController.getTransformationMatrix(i);
          const markerId = this.arToolkitContext.arController.getMarkerId ? 
                          this.arToolkitContext.arController.getMarkerId(i) : i;
          const confidence = this.arToolkitContext.arController.getMarkerConfidence ? 
                            this.arToolkitContext.arController.getMarkerConfidence(i) : 1.0;

          detectedMarkers.push({
            id: markerId,
            matrix: markerMatrix,
            confidence: confidence,
            timestamp: Date.now(),
          });
        }
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
