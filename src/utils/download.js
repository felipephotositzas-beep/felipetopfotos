/**
 * src/utils/download.js
 * Download de arquivos com suporte a WKWebView (iOS) via @capacitor/filesystem + @capacitor/share.
 * No browser web usa <a download> convencional.
 */
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Converte Blob para Base64 string.
 * @param {Blob} blob
 * @returns {Promise<string>} Base64 sem prefixo data:
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove o prefixo "data:...;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Faz o download de um arquivo de foto/vídeo.
 * - iOS/Android: salva no cache e abre Share Sheet nativa.
 * - Web: usa <a download> convencional.
 *
 * @param {string} url - URL pública do arquivo
 * @param {string} filename - Nome do arquivo com extensão (ex: "foto-001.jpg")
 */
export async function downloadPhoto(url, filename) {
  if (Capacitor.isNativePlatform()) {
    try {
      // Baixar o arquivo como blob
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);

      // Salvar no diretório de cache do app
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Abrir a Share Sheet nativa do iOS/Android
      await Share.share({
        title: 'Sua foto do FelipePhotos',
        text: 'Baixe sua foto do evento!',
        url: result.uri,
        dialogTitle: 'Salvar ou compartilhar foto',
      });
    } catch {
      // Fallback: abrir URL diretamente no browser
      window.open(url, '_blank');
    }
  } else {
    // Comportamento web padrão
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Faz o download de múltiplas fotos sequencialmente.
 * @param {Array<{url: string, filename: string}>} items
 * @param {function} onProgress - Callback chamado a cada item (index, total)
 */
export async function downloadAllPhotos(items, onProgress) {
  for (let i = 0; i < items.length; i++) {
    const { url, filename } = items[i];
    await downloadPhoto(url, filename);
    if (onProgress) onProgress(i + 1, items.length);
    // Pequeno delay para não sobrecarregar no modo web
    if (!Capacitor.isNativePlatform()) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}
