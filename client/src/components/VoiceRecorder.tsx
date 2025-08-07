import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square, Loader } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      // Check if Speech Recognition is supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

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
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else {
          alert('Speech recognition error: ' + event.error);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start speech recognition. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`fixed bottom-6 left-6 p-5 rounded-2xl shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 font-bold text-lg ${
        isRecording
          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-110'
      } text-white`}
      title={isRecording ? 'Stop Voice Recording' : 'Start Voice Recording'}
    >
      {isRecording ? (
        <>
          <Square className="w-7 h-7" />
          <span>Stop</span>
          {isListening && <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>}
        </>
      ) : (
        <>
          <Mic className="w-7 h-7" />
          <span>Voice</span>
        </>
      )}
    </button>
  );
};

export default VoiceRecorder;