"use client";

import React, { useState, ChangeEvent } from 'react';
import './page.css';

interface ApiResponse {
    dilatedBase64: string;
}

const ImageProcessingApp: React.FC = () => {
    const [fileName, setFileName] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string); // base64エンコードされた画像
            };
            reader.readAsDataURL(file); // base64に変換
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage || !fileName) return;

        setLoading(true);
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: fileName,
                    imageBase64: selectedImage.split(',')[1], // base64のプレフィックスを削除
                }),
            });

            if (response.ok) {
                const data: ApiResponse = await response.json();
                setProcessedImage(`data:image/png;base64,${data.dilatedBase64}`);
            } else {
                console.error('APIエラー:', response.statusText);
            }
        } catch (error) {
            console.error('エラーが発生しました:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="window-container">
            <h1 className="window-title">Image Processing App</h1>
            <div className="input-section">
                <input
                    className="input-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button className="submit-button" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </div>
            {loading && <p className="loading-text">Processing...</p>}
            {selectedImage && (
                <div className="image-section">
                    <h2 className="section-title">Selected Image:</h2>
                    <img className="image-display" src={selectedImage} alt="Selected" />
                </div>
            )}
            {processedImage && (
                <div className="image-section">
                    <h2 className="section-title">Processed Image:</h2>
                    <img className="image-display" src={processedImage} alt="Processed" />
                </div>
            )}
        </div>
    );
};

export default ImageProcessingApp;
