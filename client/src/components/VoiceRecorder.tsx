import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsRecording(true);
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            onTranscription(finalTranscript);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsListening(false);
          
          switch (event.error) {
            case 'not-allowed':
              alert('Microphone access denied. Please allow microphone permissions in your browser settings and refresh the page.');
              break;
            case 'no-speech':
              alert('No speech detected. Please try speaking again.');
              break;
            case 'audio-capture':
              alert('No microphone found. Please check your microphone connection.');
              break;
            case 'network':
              alert('Network error occurred. Please check your internet connection.');
              break;
            default:
              alert(`Speech recognition error: ${event.error}. Please try again.`);
          }
        };
        
        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };
        
        recognition.start();
      } else {
        // Fallback to media recorder for unsupported browsers
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
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsProcessing(true);
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Fallback mock transcription for browsers without speech recognition
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
    <div className="voice-recorder flex items-center gap-2">
      {!isRecording && !isProcessing && !disabled && (
        <button
          onClick={startRecording}
          className="toolbar-button hover:bg-blue-600 transition-all duration-200 flex items-center gap-1"
          title="Start Voice Recording"
        >
          <Mic className="w-4 h-4" />
        </button>
      )}
      
      {isRecording && !disabled && (
        <button
          onClick={stopRecording}
          className="toolbar-button bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center gap-1 animate-pulse"
          title="Stop Recording"
        >
          <Square className="w-4 h-4" />
        </button>
      )}
      
      {isProcessing && !disabled && (
        <button
          disabled
          className="toolbar-button bg-gray-600 text-white flex items-center gap-1 cursor-not-allowed"
          title="Processing..."
        >
          <MicOff className="w-4 h-4 animate-pulse" />
        </button>
      )}
      
      {disabled && (
        <button
          disabled
          className="toolbar-button bg-gray-700 text-gray-500 cursor-not-allowed"
          title="Select an idea to use voice recording"
        >
          <Mic className="w-4 h-4" />
        </button>
      )}
      
      {isListening && (
        <div className="flex items-center gap-1 text-blue-400 text-xs font-medium animate-pulse">
          <Volume2 className="w-3 h-3" />
          <span>Listening</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;