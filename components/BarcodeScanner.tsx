
import React, { useEffect, useRef, useState } from 'react';
import { XCircleIcon, ExclamationTriangleIcon, VideoCameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Declaração global para a lib carregada via CDN
declare const Html5Qrcode: any;

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
    fps?: number;
    qrbox?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
    onScanSuccess, 
    onScanFailure, 
    fps = 10, 
    qrbox = 250 
}) => {
    const scannerRegionId = "html5qr-code-full-region";
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        // Inicialização: Listar Câmeras
        const initCameras = async () => {
            try {
                if (typeof Html5Qrcode === 'undefined') {
                    setError("Biblioteca de scanner não carregada. Verifique a conexão.");
                    return;
                }

                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setCameras(devices);
                    // Tenta pegar a câmera traseira por padrão (geralmente a última ou com label 'back')
                    const backCamera = devices.find((d: any) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
                    setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
                } else {
                    setError("Nenhuma câmera encontrada.");
                }
            } catch (err) {
                console.error("Erro ao listar câmeras", err);
                setError("Permissão de câmera negada ou erro no dispositivo.");
            }
        };

        initCameras();

        return () => {
            stopScanner();
        };
    }, []);

    useEffect(() => {
        if (selectedCameraId) {
            startScanner(selectedCameraId);
        }
    }, [selectedCameraId]);

    const startScanner = async (cameraId: string) => {
        if (scannerRef.current) {
            await stopScanner();
        }

        const html5QrCode = new Html5Qrcode(scannerRegionId);
        scannerRef.current = html5QrCode;

        try {
            await html5QrCode.start(
                cameraId, 
                {
                    fps: fps,
                    qrbox: { width: qrbox, height: qrbox },
                    aspectRatio: 1.0
                },
                (decodedText: string) => {
                    // Success Callback
                    // Debounce logic handled by caller or UI state change usually, 
                    // but we can add a vibration here
                    if (navigator.vibrate) navigator.vibrate(200);
                    onScanSuccess(decodedText);
                },
                (errorMessage: string) => {
                    // Failure Callback (Scanning...)
                    if (onScanFailure) onScanFailure(errorMessage);
                }
            );
            setIsScanning(true);
            setError(null);
        } catch (err) {
            console.error("Erro ao iniciar scanner", err);
            setError("Falha ao iniciar o vídeo. Tente outra câmera.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Erro ao parar scanner", err);
            }
            scannerRef.current = null;
            setIsScanning(false);
        }
    };

    const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCameraId(e.target.value);
    };

    const handleManualRetry = () => {
        setError(null);
        if (selectedCameraId) {
            startScanner(selectedCameraId);
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="w-full flex flex-col items-center bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 relative">
            
            {/* Viewfinder Area */}
            <div id={scannerRegionId} className="w-full bg-black min-h-[300px] relative">
                {!isScanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <ArrowPathIcon className="h-10 w-10 animate-spin" />
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className="w-full bg-gray-800 p-3 border-t border-gray-700">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center text-green-400 text-xs font-bold">
                        <VideoCameraIcon className="h-4 w-4 mr-1 animate-pulse"/>
                        REC
                    </div>
                    
                    {cameras.length > 1 && (
                        <select 
                            value={selectedCameraId} 
                            onChange={handleCameraChange}
                            className="bg-gray-700 text-white text-xs rounded border-none py-1 px-2 focus:ring-1 focus:ring-indigo-500 max-w-[150px]"
                        >
                            {cameras.map(cam => (
                                <option key={cam.id} value={cam.id}>
                                    {cam.label || `Camera ${cam.id.substr(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10 p-6 text-center">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
                    <p className="text-white font-bold text-lg mb-2">Erro na Câmera</p>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button 
                        onClick={handleManualRetry}
                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors shadow-lg flex items-center"
                    >
                        <ArrowPathIcon className="h-5 w-5 mr-2" /> Tentar Novamente
                    </button>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
