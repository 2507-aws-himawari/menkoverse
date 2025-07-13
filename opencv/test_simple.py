#!/usr/bin/env python3
"""
App Runner用の最もシンプルなテストスクリプト
これが動作すれば、基本的なPython実行環境は正常
"""

import sys
import os
import logging
from datetime import datetime

# ログ設定（強制的にstdoutに出力）
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.StreamHandler(sys.stderr)
    ]
)

logger = logging.getLogger(__name__)

def main():
    """メイン処理"""
    try:
        # 基本情報のログ出力
        logger.info("=== APP RUNNER SIMPLE TEST START ===")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Python executable: {sys.executable}")
        logger.info(f"Working directory: {os.getcwd()}")
        logger.info(f"Environment: {os.environ.get('ENVIRONMENT', 'unknown')}")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        
        # 環境変数をログ出力
        logger.info("Environment variables:")
        for key, value in sorted(os.environ.items()):
            if key.startswith(('PYTHON', 'PATH', 'ENVIRONMENT')):
                logger.info(f"  {key}: {value}")
        
        # ファイルシステムの確認
        logger.info("Current directory contents:")
        for item in os.listdir('.'):
            logger.info(f"  {item}")
        
        # 無限ループで動作確認
        logger.info("Starting infinite loop test...")
        import time
        counter = 0
        while True:
            counter += 1
            logger.info(f"Counter: {counter}")
            time.sleep(10)
            
            # 100回まででテスト終了
            if counter >= 100:
                logger.info("Test completed successfully!")
                break
                
    except Exception as e:
        logger.error(f"Error occurred: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    print("STDOUT: Starting test_simple.py")  # print文でも出力テスト
    print(f"STDOUT: Python {sys.version}")
    sys.stderr.write("STDERR: Starting test_simple.py\n")  # stderr経由でも出力テスト
    sys.stderr.flush()
    
    main()
