
import React, { useEffect, useRef, useState } from 'react';
import { XCircleIcon, ExclamationTriangleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

// Declaração global para a lib carregada via CDN
declare const Html5QrcodeScanner: any;
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
    const scannerRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        let scanner: any = null;

        const startScanner = async () => {
            // Verifica se a lib carregou
            if (typeof Html5QrcodeScanner === 'undefined') {
                setError("Biblioteca de scanner não carregada. Verifique a internet.");
                return;
            }

            try {
                // Configuração do Scanner com foco em performance e compatibilidade mobile
                const config = { 
                    fps: fps, 
                    qrbox: { width: qrbox, height: qrbox },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 2,
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [0, 1] // QR Code e Barcode
                };

                // Instancia o scanner
                scanner = new Html5QrcodeScanner(scannerRegionId, config, false);
                scannerRef.current = scanner;

                // Wrapper para evitar leituras duplicadas muito rápidas (Debounce)
                let lastScanTime = 0;
                const successWrapper = (decodedText: string, decodedResult: any) => {
                    const now = Date.now();
                    if (now - lastScanTime > 1500) { // 1.5s de intervalo entre leituras
                        lastScanTime = now;
                        // Feedback sonoro (se possível)
                        try { window.navigator.vibrate(200); } catch(e){}
                        onScanSuccess(decodedText);
                    }
                };

                scanner.render(successWrapper, (errorMessage: string) => {
                    // Filtra erros de "não encontrou código" para não poluir o log
                    if (onScanFailure && !errorMessage.includes("No MultiFormat Readers")) {
                        // onScanFailure(errorMessage);
                    }
                });

            } catch (e: any) {
                console.error("Erro crítico no scanner:", e);
                setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
            }
        };

        // Pequeno delay para garantir que o DOM da div alvo existe
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch((e: any) => console.warn("Erro ao limpar scanner", e));
                } catch (e) {
                    console.warn("Erro ao desmontar scanner", e);
                }
            }
        };
    }, []);

    const handleManualRetry = () => {
        setError(null);
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 100);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200 h-64">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-red-800 font-bold text-center">{error}</p>
                <button 
                    onClick={handleManualRetry}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            {isScanning && <div id={scannerRegionId} className="w-full bg-black"></div>}
            <div className="w-full bg-gray-800 p-2 flex justify-between items-center text-gray-400 text-xs px-4">
                <span className="flex items-center gap-1"><VideoCameraIcon className="h-3 w-3"/> Câmera Ativa</span>
                <span>Posicione o código no quadrado</span>
            </div>
        </div>
    );
};

export default BarcodeScanner;
