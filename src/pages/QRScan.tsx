import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Image as ImageIcon, QrCode, X } from 'lucide-react';
import jsQR from 'jsqr';
import GlassCard from '@/components/ui/GlassCard';

const QRScan: React.FC = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processQRData = (data: string) => {
    // QR 码内容应该是纯 UID 字符串
    const uid = data.trim();
    if (uid && uid.length > 0) {
      stopCamera();
      navigate(`/user/${uid}`);
    } else {
      setError('无效的二维码');
    }
  };

  const startCamera = async () => {
    setScanning(true);
    setError('');
    try {
      // 优先后置摄像头，失败则降级为任意摄像头
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        requestAnimationFrame(scanFrame);
      }
    } catch (e) {
      console.error('Camera error:', e);
      setError('无法访问摄像头。请在浏览器设置中允许摄像头权限，或使用相册选图功能。');
      setScanning(false);
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      processQRData(code.data);
      return;
    }
    requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        processQRData(code.data);
      } else {
        setError('未能识别二维码，请确保图片清晰');
      }
    };
    img.src = URL.createObjectURL(file);
  }, []);

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      <button onClick={() => { stopCamera(); navigate(-1); }} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 mb-4 font-serif text-sm">
        <ArrowLeft size={16} /> 返回
      </button>
      <GlassCard className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-2 dark:text-gray-100">扫描二维码</h2>
        <p className="text-sm text-orange-500 mb-6 dark:text-gray-400">对准好友的二维码扫描</p>

        <div className="w-64 h-64 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden relative dark:bg-gray-800">
          {scanning ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline webkit-playsinline muted autoPlay />
              <div className="absolute inset-4 border-2 border-orange-400 rounded-xl animate-pulse" />
            </>
          ) : (
            <Camera size={48} className="text-orange-300" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error && <p className="mt-3 text-sm text-red-500 font-serif">{error}</p>}

        <div className="flex gap-4 mt-6 w-full">
          <button onClick={scanning ? stopCamera : startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 text-white font-serif shadow-md hover:shadow-lg transition-all">
            {scanning ? <><X size={16} /> 停止</> : <><Camera size={16} /> 开启摄像头</>}
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-200 text-orange-700 font-serif hover:bg-orange-50 transition-colors dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
            <ImageIcon size={16} /> 相册选图
          </button>
        </div>

        <button onClick={() => navigate('/friends/qrcode')}
          className="mt-4 text-sm text-orange-500 hover:text-orange-600 font-serif flex items-center gap-1">
          <QrCode size={14} /> 我的二维码
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </GlassCard>
    </div>
  );
};

export default QRScan;
