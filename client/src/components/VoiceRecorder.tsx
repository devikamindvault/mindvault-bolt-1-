import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
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
          
          let errorMessage = '';
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings and try again.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Please check your microphone connection.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your internet connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
          }
          
          alert(errorMessage);
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
    <div className="voice-recorder flex flex-col items-center gap-2">
      {!isRecording && !isProcessing && (
        <button
          onClick={startRecording}
          className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center gap-2"
          title="Start Voice Recording"
        >
          <Mic className="w-6 h-6" />
          <span className="font-bold">Voice</span>
        </button>
      )}
      
      {isRecording && (
        <button
          onClick={stopRecording}
          className="p-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center gap-2 animate-pulse"
          title="Stop Recording"
        >
          <Square className="w-6 h-6" />
          <span className="font-bold">Stop</span>
        </button>
      )}
      
      {isProcessing && (
        <button
          disabled
          className="p-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl shadow-2xl flex items-center gap-2 cursor-not-allowed"
          title="Processing..."
        >
          <MicOff className="w-6 h-6 animate-pulse" />
          <span className="font-bold">Processing...</span>
        </button>
      )}
      
      {isListening && (
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium animate-pulse">
          <Volume2 className="w-4 h-4" />
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;