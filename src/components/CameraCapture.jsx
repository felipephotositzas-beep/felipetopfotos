import React, { useRef, useState, useEffect } from 'react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        
        if (mounted) {
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          // If unmounted while fetching, stop tracks
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        if (mounted) {
          setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Defina as dimensões do canvas para corresponderem ao vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      // Aplica espelhamento horizontal para parecer um espelho (como a câmera frontal no celular)
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onCapture(dataUrl);
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="camera-overlay">
      <div className="camera-header">
        <button onClick={handleClose} className="camera-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="camera-view-container">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <button onClick={handleClose} className="btn-action btn-primary" style={{ marginTop: '16px', maxWidth: '200px', margin: '16px auto' }}>
              Voltar
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="camera-video"
          />
        )}
      </div>

      {!error && (
        <div className="camera-controls">
          <button onClick={handleCapture} className="shutter-btn" aria-label="Tirar foto">
            <div className="shutter-btn-inner"></div>
          </button>
        </div>
      )}

      {/* Hidden canvas for image extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;
