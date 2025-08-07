import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Simple mock transcription - replace with actual speech-to-text service
      const mockTranscription = "Voice recording transcribed text would appear here.";
      onTranscription(mockTranscription);
    } catch (error) {
      console.error('Error processing audio:', error);
      onTranscription("Error processing voice recording.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-recorder">
      {!isRecording && !isProcessing && (
        <button
          onClick={startRecording}
          className="toolbar-button"
          title="Start Voice Recording"
        >
          <Mic className="w-4 h-4" />
        </button>
      )}
      
      {isRecording && (
        <button
          onClick={stopRecording}
          className="toolbar-button active"
          title="Stop Recording"
        >
          <Square className="w-4 h-4" />
        </button>
      )}
      
      {isProcessing && (
        <button
          disabled
          className="toolbar-button"
          title="Processing..."
        >
          <MicOff className="w-4 h-4 animate-pulse" />
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;