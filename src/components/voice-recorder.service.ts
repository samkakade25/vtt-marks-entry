import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder!: MediaRecorder;
  private chunks: Blob[] = [];
  private stream?: MediaStream;

  startRecording(onStop: (blob: Blob) => void): void {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.stream = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        onStop(blob);
      };

      this.mediaRecorder.start();
    });
  }

  stopRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
  }
}
