/**
 * OpenCV API サーバーとの通信クライアント
 */

export interface OpenCVMarkerDetectionResult {
  detected_markers: Array<{
    id: number;
    corners: number[][];
    confidence: number;
  }>;
  total_markers: number;
  image_size: {
    width: number;
    height: number;
  };
  rejected_candidates: number;
}

export interface OpenCVApiResponse {
  detected_markers: OpenCVMarkerDetectionResult['detected_markers'];
  total_markers: number;
  image_size: {
    width: number;
    height: number;
  };
  rejected_candidates: number;
  filename: string;
  file_size: number;
  content_type: string;
}

export class OpenCVClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8000', timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * ヘルスチェック
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('OpenCV API health check failed:', error);
      return false;
    }
  }

  /**
   * 画像からマーカーを検出
   */
  async detectMarkers(imageFile: File): Promise<OpenCVApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${this.baseUrl}/detect-markers`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenCV API request timeout');
      }
      throw new Error(`OpenCV API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Canvas から画像を取得してマーカー検出
   */
  async detectMarkersFromCanvas(canvas: HTMLCanvasElement): Promise<OpenCVApiResponse> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }

        try {
          const file = new File([blob], 'capture.png', { type: 'image/png' });
          const result = await this.detectMarkers(file);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  }

  /**
   * Video 要素から画像キャプチャしてマーカー検出
   */
  async detectMarkersFromVideo(videoElement: HTMLVideoElement): Promise<OpenCVApiResponse> {
    // Canvas を作成して video フレームをキャプチャ
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Video フレームを canvas に描画
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Canvas からマーカー検出
    return this.detectMarkersFromCanvas(canvas);
  }
}

// デフォルトクライアントインスタンス
export const openCVClient = new OpenCVClient();
