export async function getAudioStream(): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  const olderGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

  if (olderGetUserMedia) {
    return new Promise<MediaStream>((resolve, reject) => {
      olderGetUserMedia.call(
        navigator,
        { audio: true },
        (stream: MediaStream) => resolve(stream),
        (err: any) => reject(err)
      );
    });
  }

  return Promise.reject(new Error('getUserMedia is not supported in this browser'));
}
