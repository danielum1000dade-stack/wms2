
import React, { useEffect, useRef, useState } from 'react';
import { XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        // Limpeza preventiva caso o componente tenha desmontado incorretamente antes
        const cleanup = async () => {
            if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                } catch (e) {
                    console.error("Erro ao limpar scanner anterior:", e);
                }
                scannerRef.current = null;
            }
        };

        const startScanner = async () => {
            await cleanup();

            // Verifica se a lib carregou
            if (typeof Html5QrcodeScanner === 'undefined') {
                setError("Biblioteca de scanner não carregada. Verifique a conexão.");
                return;
            }

            try {
                // Configuração do Scanner
                const config = { 
                    fps: fps, 
                    qrbox: { width: qrbox, height: qrbox },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 2
                };

                const scanner = new Html5QrcodeScanner(scannerRegionId, config, false);
                scannerRef.current = scanner;

                // Success Callback Wrapper para evitar leituras múltiplas rápidas
                let lastScan = 0;
                const successWrapper = (decodedText: string, decodedResult: any) => {
                    const now = Date.now();
                    if (now - lastScan > 1500) { // Debounce de 1.5s
                        lastScan = now;
                        onScanSuccess(decodedText);
                    }
                };

                scanner.render(successWrapper, (errorMessage: string) => {
                    // Ignora erros comuns de "code not found" para não poluir logs/UI
                    if (!errorMessage.includes("No MultiFormat Readers")) {
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                });

                setHasPermission(true);

            } catch (e: any) {
                console.error("Erro ao iniciar scanner:", e);
                setError("Erro ao acessar a câmera. Verifique as permissões.");
                setHasPermission(false);
            }
        };

        // Pequeno delay para garantir que o DOM renderizou a div
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            cleanup();
        };
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center bg-black/5 rounded-lg p-2">
            {error ? (
                <div className="flex flex-col items-center text-red-600 p-4">
                    <ExclamationTriangleIcon className="h-12 w-12 mb-2" />
                    <p className="text-center font-bold">{error}</p>
                    <p className="text-xs text-center mt-1">Verifique se o navegador tem permissão para usar a câmera.</p>
                </div>
            ) : (
                <div id={scannerRegionId} className="w-full max-w-sm overflow-hidden rounded-lg shadow-inner bg-white"></div>
            )}
            <p className="text-xs text-gray-500 mt-2">Aponte a câmera para o código</p>
        </div>
    );
};

export default BarcodeScanner;
