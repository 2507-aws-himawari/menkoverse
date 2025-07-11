import type { ArUcoMarkerConfig } from '../types';

export class ARJSHelper {
  private arToolkitContext: any = null;
  private arToolkitSource: any = null;
  private initialized = false;
  private isInitializing = false; // 初期化中フラグを追加

  async initialize(canvas: HTMLCanvasElement, video: HTMLVideoElement, config: ArUcoMarkerConfig) {
    // 重複初期化を防ぐ
    if (this.initialized) {
      console.warn('AR.js is already initialized');
      return true;
    }

    if (this.isInitializing) {
      console.warn('AR.js is currently initializing');
      return false;
    }

    this.isInitializing = true;

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

      // Canvas要素の状態確認（0除算エラーの原因調査）
      console.log('Canvas element state:', {
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
      });

      // Canvas要素のサイズが0の場合は警告
      if (canvas.width === 0 || canvas.height === 0) {
        console.warn('Canvas size is 0, this may cause divide by zero errors');
      }

      // Canvas要素のCSS設定を確保（offsetWidthとoffsetHeightが0の問題を解決）
      if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
        canvas.style.width = '640px';
        canvas.style.height = '480px';
        canvas.style.display = 'block';
        console.log('Canvas CSS styling applied');
      }

      // ArToolkitContextの初期化
      this.arToolkitContext = new (window as any).THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://raw.githubusercontent.com/AR-js-org/AR.js/3.4.5/data/data/camera_para.dat',
        detectionMode: 'mono_and_matrix', // ArUcoマーカー検出のために必要
        matrixCodeType: '4x4_BCH_13_9_3', // ArUcoマーカー用の正しいタイプ
        canvasWidth: Math.max(canvas.width, 640), // 最小サイズを保証
        canvasHeight: Math.max(canvas.height, 480), // 最小サイズを保証
        maxDetectionRate: 60, // 検出レートの制限
        patternRatio: 0.5, // パターン比率
        labelingMode: 1, // ラベリングモード
      });

      await new Promise((resolve, reject) => {
        this.arToolkitContext.init(() => {
          this.initialized = true;
          this.isInitializing = false;
          
          // ArToolkitSourceの初期化も追加
          this.arToolkitSource = new (window as any).THREEx.ArToolkitSource({
            sourceType: 'webcam',
            sourceWidth: Math.max(canvas.width, 640),
            sourceHeight: Math.max(canvas.height, 480),
            displayWidth: Math.max(canvas.width, 640),
            displayHeight: Math.max(canvas.height, 480),
          });

          console.log('ArToolkitContext and ArToolkitSource initialized successfully');
          
          // ArToolkitContextの詳細状態を確認
          console.log('ArToolkitContext details:', {
            initialized: this.arToolkitContext.initialized,
            arController: !!this.arToolkitContext.arController,
            parameters: this.arToolkitContext.parameters,
            detectionMode: this.arToolkitContext.parameters?.detectionMode
          });
          
          resolve(true);
        }, (error: any) => {
          this.isInitializing = false;
          reject(error);
        });
      });

      return true;
    } catch (error) {
      this.isInitializing = false;
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
      console.log('AR.js not initialized, skipping detection');
      return [];
    }

    try {

      // ビデオが準備できていない場合は早期リターン
      if (videoElement.readyState < 1) { // readyState 1以上で検出を試行
        console.log('Video not ready for marker detection, readyState:', videoElement.readyState);
        return [];
      }

      // ビデオサイズが0の場合は早期リターン（初回のみ）
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        if (Math.random() < 0.1) { // 10%の確率でログ出力
          console.log('Video size is 0, cannot detect markers');
        }
        return [];
      }

      // フレーム解析
      this.arToolkitContext.update(videoElement);


      // 検出されたマーカーを取得
      const detectedMarkers = [];
      
      // THREEx.ArToolkitContext の新しい API を使用
      if (this.arToolkitContext.arController) {
        const markerNum = this.arToolkitContext.arController.getMarkerNum();
        
        if (markerNum > 0) {
          console.log('Detected markers count:', markerNum);
        }
        
        for (let i = 0; i < markerNum; i++) {
          const markerMatrix = this.arToolkitContext.arController.getTransformationMatrix(i);
          const markerId = this.arToolkitContext.arController.getMarkerId ? 
                          this.arToolkitContext.arController.getMarkerId(i) : i;
          const confidence = this.arToolkitContext.arController.getMarkerConfidence ? 
                            this.arToolkitContext.arController.getMarkerConfidence(i) : 1.0;

          // AR.js Barcodeマーカー（4x4_BCH_13_9_3は0-511の範囲）
          // テスト用マーカーID（0, 1）でフィルタリング
          if ([0, 1].includes(markerId)) {
            detectedMarkers.push({
              id: markerId,
              matrix: markerMatrix,
              confidence: confidence,
              timestamp: Date.now(),
            });
          }
        }
      } else {
        console.warn('ArToolkitContext.arController is not available');
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
    if (this.arToolkitSource) {
      this.arToolkitSource = null;
    }
    this.initialized = false;
    this.isInitializing = false;
  }
}

export const createARJSHelper = () => new ARJSHelper();
