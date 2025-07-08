import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export function VoiceRecorder({ onTranscription, isRecording, setIsRecording }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        
        // Simulate transcription (in a real app, you'd send this to a transcription service)
        simulateTranscription(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Processing your audio...",
      });
    }
  };

  const simulateTranscription = (blob: Blob) => {
    // Simulate transcription delay
    setTimeout(() => {
      const sampleTranscriptions = [
        "Today I made significant progress on my goals. I learned about React hooks and how they can improve my development workflow.",
        "I completed my morning exercise routine and feel energized for the day ahead. Planning to tackle the next chapter of my book.",
        "Had an interesting conversation about project management techniques. Taking notes on the key insights I gained.",
        "Reflecting on my learning journey so far. The concepts are starting to click and I can see real improvement.",
        "Working on building better habits. Small consistent actions are leading to meaningful progress over time."
      ];
      
      const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
      onTranscription(randomTranscription);
      
      toast({
        title: "Transcription complete",
        description: "Your speech has been converted to text",
      });
    }, 2000);
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
          size="lg"
        >
          <Mic className="h-5 w-5 mr-2" />
          Start Recording
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <Button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg animate-pulse"
            size="lg"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </Button>
          
          <div className="flex items-center gap-2 text-red-600 font-mono">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>{formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {audioBlob && !isRecording && (
        <Button
          onClick={isPlaying ? pauseRecording : playRecording}
          variant="outline"
          className="px-4 py-2"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play Recording
            </>
          )}
        </Button>
      )}
    </div>
  );
}