import { PanelRight } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Mic, MicOff, Loader2, Download, Save, ImageIcon, Link as LinkIcon, Youtube, FileText, X, Moon, Sun,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Search, ArrowRight, ArrowLeft, Smile,
  Copy, Check
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { jsPDF } from "jspdf";
import { Goal } from "@shared/schema";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GoalsDropdown } from "@/components/GoalsDropdown";
import { format } from "date-fns";
import DOMPurify from 'dompurify'; // Added DOMPurify import
import { useToast } from "@/hooks/use-toast";

// Define SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceRecorderProps {
  onTranscription: (text: string, goalId?: number) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>();
  const [currentText, setCurrentText] = useState("");
  const [hasUnsavedRecording, setHasUnsavedRecording] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'document' | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Add click handler for existing preview elements and load saved content
  useEffect(() => {
    if (!editorRef.current) return;

    try {
      // Load saved content from localStorage
      const savedContent = localStorage.getItem('editorContent');
      const savedGoalId = localStorage.getItem('selectedGoalId');
      const savedEntryDate = localStorage.getItem('entryDate');

      if (savedContent) {
        editorRef.current.innerHTML = savedContent;
        if (savedGoalId) {
          setSelectedGoalId(savedGoalId);
        }
        if (savedEntryDate) {
          setEntryDate(new Date(savedEntryDate));
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Continue without setting content if localStorage fails
    }

    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const previewElement = target.closest('[data-preview]');
      if (previewElement instanceof HTMLElement) {
        e.preventDefault();
        e.stopPropagation();
        setPreviewUrl(previewElement.dataset.url || null);
        setPreviewType((previewElement.dataset.type as 'image' | 'document') || null);
        setPreviewTitle(previewElement.dataset.title || '');
      }
    };

    editorRef.current.addEventListener('click', handleEditorClick);
    return () => {
      editorRef.current?.removeEventListener('click', handleEditorClick);
    };
  }, []);

  // Save editor content to localStorage whenever it changes
  useEffect(() => {
    if (!editorRef.current) return;

    const saveEditorContent = () => {
      try {
        const content = editorRef.current?.innerHTML || '';
        localStorage.setItem('editorContent', content);
        if (selectedGoalId) {
          localStorage.setItem('selectedGoalId', selectedGoalId);
        }
        
        // Check if content is over 50 characters
        const plainText = editorRef.current?.textContent || '';
        if (plainText.length > 50) {
          const currentDate = new Date();
          // Always update the date when content changes and is over 50 chars
          setEntryDate(currentDate);
          
          // Save the entry date to localStorage
          localStorage.setItem('entryDate', currentDate.toISOString());
          
          // Add this entry to the journal entries for date-based filtering
          try {
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            
            // Define journal entry interface
            interface JournalEntry {
              goalId: string | undefined;
              text: string;
              date: string;
            }
            
            // Get the sanitized HTML content 
            const sanitizedContent = editorRef.current ? DOMPurify.sanitize(editorRef.current.innerHTML) : '';
            
            // Check if we need to update an existing entry or add a new one
            // Compare goals and dates, not content since we're now storing HTML
            const existingEntryIndex = journalEntries.findIndex(
              (entry: JournalEntry) => entry.goalId === selectedGoalId && 
                new Date(entry.date).toDateString() === currentDate.toDateString()
            );
            
            if (existingEntryIndex >= 0) {
              // Update existing entry with new date and content (HTML)
              journalEntries[existingEntryIndex].date = currentDate.toISOString();
              journalEntries[existingEntryIndex].text = sanitizedContent;
            } else {
              // Add new entry with HTML content
              journalEntries.push({
                goalId: selectedGoalId,
                text: sanitizedContent,
                date: currentDate.toISOString()
              });
            }
            
            localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
            console.log('Journal entry saved for date filtering');
          } catch (error) {
            console.error('Error saving journal entry:', error);
          }
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        // Continue without saving if localStorage fails
      }
    };

    // Add event listeners to detect content changes
    const handleEditorInput = () => {
      saveEditorContent();
      saveEditorState();
    };
    editorRef.current.addEventListener('input', handleEditorInput);
    editorRef.current.addEventListener('paste', saveEditorContent);

    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('input', saveEditorContent);
        editorRef.current.removeEventListener('paste', saveEditorContent);
      }
    };
  }, [selectedGoalId, entryDate]);

  // State for goal selection
  const [selectedMainGoal, setSelectedMainGoal] = useState<Goal | null>(null);
  const [selectedSubGoal, setSelectedSubGoal] = useState<Goal | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Handle undo operation
  const handleUndo = () => {
    if (editorRef.current && undoStack.length > 0) {
      const currentContent = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      setUndoStack(newUndoStack);
      setRedoStack([...redoStack, editorRef.current.innerHTML]);
      editorRef.current.innerHTML = currentContent;
      setHasUnsavedRecording(true);
    }
  };

  // Handle redo operation
  const handleRedo = () => {
    if (editorRef.current && redoStack.length > 0) {
      const currentContent = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      setRedoStack(newRedoStack);
      setUndoStack([...undoStack, editorRef.current.innerHTML]);
      editorRef.current.innerHTML = currentContent;
      setHasUnsavedRecording(true);
    }
  };

  // Save editor state for undo
  const saveEditorState = () => {
    if (editorRef.current) {
      setUndoStack([...undoStack, editorRef.current.innerHTML]);
      setRedoStack([]); // Clear redo stack on new changes
    }
  };

  const { data: goals } = useQuery<Goal[]>({
  });

  // Select a goal from the dropdown
  const handleGoalSelect = (goal: Goal) => {
    if (selectedGoalId === goal.id.toString()) return;

    if (hasUnsavedRecording && !confirm('You have unsaved changes. Switch goal anyway?')) return;

    setSelectedMainGoal(goal);
    setSelectedSubGoal(null);
    setSelectedGoalId(goal.id.toString());

    if (editorRef.current) {
      editorRef.current.innerHTML = goal.description || '';
      // Save the content to localStorage for persistence
      try {
        localStorage.setItem('editorContent', goal.description || '');
        localStorage.setItem('selectedGoalId', goal.id.toString());
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      setHasUnsavedRecording(false);
    }
  };

  // Select a sub-goal from the side panel
  const handleSubGoalSelect = (goal: Goal) => {
    if (selectedGoalId === goal.id.toString()) return;

    if (hasUnsavedRecording && !confirm('You have unsaved changes. Switch to this sub-goal anyway?')) return;

    setSelectedSubGoal(goal);
    setSelectedGoalId(goal.id.toString());

    // Set sub-goal content in the editor
    if (editorRef.current) {
      editorRef.current.innerHTML = goal.description || '';
      // Save to localStorage for persistence
      try {
        localStorage.setItem('editorContent', goal.description || '');
        localStorage.setItem('selectedGoalId', goal.id.toString());
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      setHasUnsavedRecording(false);
    }
  };

  // Handle description click from dropdown side panel
  const handleDescriptionClick = (content: string) => {
    if (hasUnsavedRecording && !confirm('You have unsaved changes. Load this content anyway?')) return;

    if (editorRef.current) {
      editorRef.current.innerHTML = content;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('editorContent', content);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      setHasUnsavedRecording(false);
    }
  };

  // Format text in editor
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHasUnsavedRecording(true);
    }
  }, []);
  
  // Copy transcription text to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "You can now paste the transcription anywhere",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually",
        variant: "destructive"
      });
    });
  }, [toast]);
  
  // Insert emoji at cursor position
  const insertEmoji = useCallback((emoji: string) => {
    // Save current selection if available
    if (window.getSelection && window.getSelection()?.rangeCount) {
      savedSelection.current = window.getSelection()?.getRangeAt(0) || null;
    }
    
    // Restore selection and insert emoji
    if (savedSelection.current && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
        document.execCommand('insertText', false, emoji);
        setHasUnsavedRecording(true);
        setShowEmojiPicker(false);
      }
    } else if (editorRef.current) {
      // If no selection exists, insert at the end
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      setHasUnsavedRecording(true);
      setShowEmojiPicker(false);
    }
  }, []);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (!editorRef.current || !searchQuery) return;

    // Remove existing highlights
    const text = editorRef.current.innerHTML;
    editorRef.current.innerHTML = text.replace(/<mark class="search-highlight">/g, '')
      .replace(/<mark class="search-highlight current">/g, '')
      .replace(/<\/mark>/g, '');

    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const content = editorRef.current.textContent || '';
    const matches: number[] = [];
    let pos = content.toLowerCase().indexOf(searchQuery.toLowerCase());

    while (pos !== -1) {
      matches.push(pos);
      pos = content.toLowerCase().indexOf(searchQuery.toLowerCase(), pos + 1);
    }

    if (matches.length > 0) {
      let newHtml = content;
      for (let i = matches.length - 1; i >= 0; i--) {
        const start = matches[i];
        const end = start + searchQuery.length;
        const before = newHtml.substring(0, start);
        const match = newHtml.substring(start, end);
        const after = newHtml.substring(end);
        newHtml = `${before}<mark class="search-highlight">${match}</mark>${after}`;
      }
      editorRef.current.innerHTML = newHtml;
      setSearchMatches(matches);
      setCurrentMatchIndex(0);
    }
  }, [searchQuery]);

  // Navigate between search matches
  const navigateSearch = useCallback((direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;

    const marks = editorRef.current?.getElementsByClassName('search-highlight');
    if (!marks) return;

    // Remove current highlight
    const currentMark = editorRef.current?.querySelector('.search-highlight.current');
    if (currentMark) {
      currentMark.classList.remove('current');
    }

    // Update current match index
    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % searchMatches.length;
    } else {
      newIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    }

    // Add highlight to new current match
    marks[newIndex].classList.add('current');
    marks[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setCurrentMatchIndex(newIndex);
  }, [searchMatches, currentMatchIndex]);

  useEffect(() => {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search in text..."]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

  }, []);

  // Download PDF
  const downloadPDF = useCallback(() => {
    if (!editorRef.current) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Create a temporary div to parse content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current.innerHTML;

    // Find images and documents
    const imageElements = tempDiv.querySelectorAll('span[data-preview][data-type="image"]');
    const documentElements = tempDiv.querySelectorAll('span[data-preview][data-type="document"]');
    
    // Process text content first (without images and documents)
    let plainText = tempDiv.textContent || '';
    
    // Remove image captions from the plain text
    imageElements.forEach(imgSpan => {
      const fileNameDiv = imgSpan.querySelector('.file-name');
      const dateDiv = imgSpan.querySelector('.text-xs.text-gray-400');
      if (fileNameDiv && dateDiv) {
        // Remove the image captions from plain text
        plainText = plainText.replace(`${fileNameDiv.textContent} ${dateDiv.textContent}`, '');
      }
    });
    
    // Remove document captions from the plain text
    documentElements.forEach(docSpan => {
      const fileNameDiv = docSpan.querySelector('.file-name');
      const dateDiv = docSpan.querySelector('.text-xs.text-gray-400');
      if (fileNameDiv && dateDiv) {
        plainText = plainText.replace(`${fileNameDiv.textContent} ${dateDiv.textContent}`, '');
      }
    });

    // Set title
    if (selectedGoalId && goals) {
      const goal = goals.find(g => g.id.toString() === selectedGoalId);
      if (goal) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(goal.title, margin, yPosition);
        yPosition += 10;
      }
    }

    // Add the clean text to PDF
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(plainText.trim(), 170);
    textLines.forEach((line: string) => {
      if (line.trim() === '') return; // Skip empty lines
      
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7; // Line height
    });

    // Now process and add images with higher quality
    if (imageElements.length > 0) {
      yPosition += 15; // Space before images section
      
      // Add images header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Images:", margin, yPosition);
      yPosition += 10;
      
      imageElements.forEach((imgElement, index) => {
        const img = imgElement.querySelector('img');
        if (img && img.src) {
          try {
            // Check if we need a new page for the image
            if (yPosition > pageHeight - 100) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Enhanced image display - larger dimensions for better quality
            const imgWidth = 100; // Larger image size
            const imgHeight = 90; // Larger image size
            
            // Add image title with better formatting
            const imgTitle = imgElement.getAttribute('data-title') || 'Image';
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(imgTitle, margin, yPosition);
            yPosition += 5;
            
            // Add timestamp if available
            const dateDiv = imgElement.querySelector('.text-xs.text-gray-400');
            if (dateDiv) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.text(dateDiv.textContent || '', margin, yPosition);
              yPosition += 5;
            }
            
            // Add the image with better quality
            doc.addImage(
              img.src, 
              'JPEG', 
              margin, 
              yPosition, 
              imgWidth, 
              imgHeight,
              imgTitle, // Use title as alias for referencing
              'MEDIUM' // Better quality setting
            );
            
            // Make image clickable - opens in browser when clicked
            const imgUrl = img.src;
            doc.link(
              margin, 
              yPosition, 
              imgWidth, 
              imgHeight, 
              { url: imgUrl }
            );
            
            // Add caption below image
            yPosition += imgHeight + 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 255); // Blue for clickable text
            doc.text("(Click image to view in browser)", margin, yPosition);
            doc.setTextColor(0, 0, 0); // Reset text color
            
            // Move position for next item
            yPosition += 15;
          } catch (error) {
            console.error("Error adding image to PDF:", error);
          }
        }
      });
    }
    
    // Process and add document links with better formatting
    if (documentElements.length > 0) {
      yPosition += 15; // Space before documents section
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Documents:", margin, yPosition);
      yPosition += 10;
      
      documentElements.forEach((docElement, index) => {
        // Get document URL and title
        const docUrl = docElement.getAttribute('data-url');
        const docTitle = docElement.getAttribute('data-title') || 'Document';
        
        if (docUrl) {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Add document icon
          const docIcon = '📄';
          doc.setFontSize(14);
          doc.text(docIcon, margin, yPosition);
          
          // Add document title with better formatting
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255); // Blue color for links
          doc.text(docTitle, margin + 10, yPosition);
          
          // Make document title clickable
          doc.link(
            margin + 10, 
            yPosition - 5, 
            doc.getTextWidth(docTitle), 
            10, 
            { url: docUrl.startsWith('http') ? docUrl : window.location.origin + docUrl }
          );
          
          // Make document icon clickable too
          doc.link(
            margin, 
            yPosition - 5, 
            10, 
            10, 
            { url: docUrl.startsWith('http') ? docUrl : window.location.origin + docUrl }
          );
          
          // Add file size if available
          const sizeText = docElement.querySelector('.text-xs.text-gray-500');
          if (sizeText) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0); // Reset text color
            doc.text(sizeText.textContent || '', margin + 10, yPosition + 5);
          }
          
          // Add date if available
          const dateDiv = docElement.querySelector('.text-xs.text-gray-400');
          if (dateDiv) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(dateDiv.textContent || '', margin + 10, yPosition + 10);
          }
          
          // Add text indicating clickability
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(0, 0, 255); // Blue for clickable text
          doc.text("(Click to open document)", margin + 10, yPosition + 15);
          
          // Reset text color and move position
          doc.setTextColor(0, 0, 0);
          yPosition += 25; // More space between documents
        }
      });
    }

    doc.save(`transcript-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
  }, [selectedGoalId, goals]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    console.log("Uploading file:", file.name, file.type, file.size);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("Sending upload request to /api/upload");
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload response not OK:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload successful:", data);
      const timestamp = format(new Date(), 'PPP');

      // Create an inline wrapper for the media (using span for inline display)
      const wrapper = document.createElement('span');
      wrapper.className = 'media-wrapper';
      wrapper.contentEditable = 'false';
      
      if (file.type.startsWith('image/')) {
        wrapper.innerHTML = `
          <span 
            class="group cursor-pointer transition-all hover:opacity-95 relative glow-effect" 
            data-preview 
            data-url="${data.url}" 
            data-type="image" 
            data-title="${file.name}"
            data-size="${file.size}"
          >
            <button 
              class="absolute -right-2 -top-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onclick="(function(e) {
                e.stopPropagation();
                e.currentTarget.closest('.media-wrapper').remove();
                document.dispatchEvent(new CustomEvent('contentChanged'));
              })(event)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src="${data.url}"
              alt="${file.name}"
              class="max-w-[200px] max-h-[200px] rounded-lg object-contain border border-purple-300/20 shadow-lg transition-transform hover:scale-105"
            />
            <div class="text-xs text-center mt-2 text-gray-400 pointer-events-none">
              <div class="file-name font-medium text-primary/90">${file.name}</div>
              <div class="text-xs text-gray-400">${timestamp}</div>
              <div class="text-xs text-primary/80 italic mt-1 font-medium">(Click to preview)</div>
            </div>
          </span>
        `.trim();
      } else {
        const icon = file.type === 'application/pdf' ? '📄' : 
                    file.type.includes('word') ? '📝' : '📰';

        wrapper.innerHTML = `
          <span 
            class="group cursor-pointer relative glow-effect" 
            data-preview 
            data-url="${data.url}" 
            data-type="document" 
            data-title="${file.name}"
            data-size="${file.size}"
          >
            <button 
              class="absolute -right-2 -top-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onclick="(function(e) {
                e.stopPropagation();
                e.currentTarget.closest('.media-wrapper').remove();
                document.dispatchEvent(new CustomEvent('contentChanged'));
              })(event)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="flex items-center gap-3 p-3 border border-purple-300/20 rounded-lg bg-purple-900/10 hover:bg-purple-900/20 transition-all shadow-md hover:shadow-lg">
              <span class="text-2xl">${icon}</span>
              <div>
                <div class="text-sm font-medium group-hover:text-primary transition-colors file-name text-primary/90">
                  ${file.name}
                </div>
                <div class="text-xs text-gray-400">
                  ${Math.round(file.size / 1024)} KB
                  <div class="text-xs text-gray-400">${timestamp}</div>
                </div>
                <div class="text-xs text-primary/80 italic mt-1 font-medium">(Click to preview)</div>
              </div>
            </div>
          </span>
        `.trim();
      }

      // Get the saved or current selection
      let range: Range | null = null;
      if (savedSelection.current) {
        range = savedSelection.current;
        savedSelection.current = null;
      } else {
        const selection = window.getSelection();
        if (selection?.rangeCount) {
          range = selection.getRangeAt(0);
        }
      }

      // Focus editor before any manipulation
      editorRef.current.focus();
      
      if (range && editorRef.current.contains(range.commonAncestorContainer)) {
        // Save scroll position
        const scrollTop = editorRef.current.scrollTop;
        
        // Collapse range to cursor position if there's a selection
        if (!range.collapsed) {
          range.collapse(true);
        }
        
        // Insert media at saved cursor position
        range.insertNode(wrapper);
        const space = document.createTextNode('\u00A0');
        wrapper.after(space);
        
        // Update cursor position
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.setEndAfter(space);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        
        // Restore scroll position
        editorRef.current.scrollTop = scrollTop;
      } else {
        // Fallback: append to end
        editorRef.current.appendChild(wrapper);
        const space = document.createTextNode('\u00A0');
        editorRef.current.appendChild(space);
        
        // Position cursor after inserted content
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.setEndAfter(space);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      }

      // Add click handler to the preview element
      const previewElement = wrapper.querySelector('[data-preview]');
      if (previewElement) {
        previewElement.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;
          setPreviewUrl(target.dataset.url || null);
          setPreviewType((target.dataset.type as 'image' | 'document') || null);
          setPreviewTitle(target.dataset.title || '');
        });
      }

      setHasUnsavedRecording(true);
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload file: ${errorMessage}. Please try again.`);
    }

    // Reset file input
    e.target.value = '';
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release the stream immediately
      setMicrophoneStatus('ready');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Browser not supported",
          description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }
    } catch (err: any) {
      setMicrophoneStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      toast({
        title: "Microphone access denied",
        description: "Microphone access is required. Please check your browser settings.",
        variant: "destructive"
      });
      return;
    }
    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interimTranscript += transcript;
        }
        
        setCurrentText(prev => {
          const cleanPrev = prev.replace(/\[Speaking\.\.\.\] .*$/, '');
          const space = cleanPrev && !cleanPrev.endsWith(' ') ? ' ' : '';
          let newText = cleanPrev;
          
          if (finalTranscript) {
            newText += space + finalTranscript;
            setHasUnsavedRecording(true);
            
            // Update the separate transcription text state for the copy feature
            setTranscriptionText(prev => {
              const space = prev && !prev.endsWith(' ') ? ' ' : '';
              return prev + space + finalTranscript;
            });
            
            // Add the final transcript to the editor with improved handling
            if (editorRef.current) {
              // Save current selection if any
              const selection = window.getSelection();
              const hasSelection = selection && selection.rangeCount > 0;
              const range = hasSelection ? selection.getRangeAt(0).cloneRange() : null;
              
              // Focus on the editor to ensure it's active
              editorRef.current.focus();
              
              // Determine if we need to add punctuation
              let textToInsert = finalTranscript;
              
              // Get the text before the cursor
              const textBeforeCursor = range ? 
                editorRef.current.textContent?.substring(0, range.startOffset) || '' : 
                editorRef.current.textContent || '';
              
              // Check if we need to capitalize the first letter (start of sentence)
              if (textBeforeCursor.trim().length === 0 || 
                  /[.!?]\s*$/.test(textBeforeCursor)) {
                textToInsert = textToInsert.charAt(0).toUpperCase() + textToInsert.slice(1);
              }
              
              // Check if we need to add a period at the end of previous text
              const lastChar = textBeforeCursor.trim().slice(-1);
              if (lastChar && 
                  !/[.!?,;:"]$/.test(textBeforeCursor) && 
                  /^[A-Z]/.test(textToInsert)) {
                // Insert a period before new sentence
                document.execCommand('insertText', false, '. ');
              }
              
              // Add formatting to recognized commands
              if (textToInsert.toLowerCase().includes("new paragraph")) {
                // Replace command with actual paragraph break
                textToInsert = textToInsert.replace(/new paragraph/i, '\n\n');
              }
              
              // Add a space after the text if it doesn't end with punctuation
              if (!/[.!?,;:")\]]$/.test(textToInsert)) {
                textToInsert += ' ';
              }
              
              // Insert the final text
              document.execCommand('insertText', false, textToInsert);
              
              // Save editor state for undo functionality
              if (saveEditorState) saveEditorState();
            }
          }
          
          if (interimTranscript) {
            // Show interim text with visual indicator
            newText += space + '[Speaking...] ' + interimTranscript;
            
            // Display interim results in editor if desired
            if (editorRef.current) {
              // Add a temporary element for the interim text
              const tempElement = document.getElementById('interim-text');
              if (!tempElement) {
                const interimEl = document.createElement('span');
                interimEl.id = 'interim-text';
                interimEl.style.color = 'gray';
                interimEl.style.fontStyle = 'italic';
                interimEl.textContent = ' [' + interimTranscript + ']';
                editorRef.current.appendChild(interimEl);
              } else {
                tempElement.textContent = ' [' + interimTranscript + ']';
              }
            }
          } else {
            // Remove interim element when there's no interim text
            const tempElement = document.getElementById('interim-text');
            if (tempElement) tempElement.remove();
          }
          
          return newText;
        });
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
        
        // Get clean text (remove the interim part)
        const cleanText = currentText.replace(/\[Speaking\.\.\.\] .*$/, '').trim();
        
        if (cleanText && cleanText.length > 0) {
          // Show a toast notification if transcription was successful
          toast({
            title: "Recording complete",
            description: "Your speech has been transcribed and can be copied",
          });
          
          // Call onTranscription to inform parent components
          onTranscription(cleanText, selectedGoalId ? parseInt(selectedGoalId) : undefined);
          
          // Save the transcription to the database
          fetch('/api/transcriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: cleanText,
              goalId: selectedGoalId ? parseInt(selectedGoalId) : null
            })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to save transcription');
            }
            return response.json();
          })
          .then(() => {
            console.log('Transcription saved successfully');
            // Refresh transcriptions list
            
            // Log user activity
            return fetch('/api/user/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityType: 'speech_transcription',
                details: {
                  goalId: selectedGoalId ? parseInt(selectedGoalId) : null,
                  duration: 0
                }
              })
            });
          })
          .catch(error => {
            console.error('Error saving transcription:', error);
            toast({
              title: "Error saving transcription",
              description: "There was a problem saving your transcription",
              variant: "destructive"
            });
          });
        }
      };
      
      recognition.start();
      setRecognition(recognition);
    } catch (error: unknown) {
      console.error("Error starting speech recognition:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Failed to start speech recognition",
        description: `${errorMessage}. Please try again.`,
        variant: "destructive"
      });
      setIsRecording(false);
    }
  }, [currentText, onTranscription, queryClient, selectedGoalId, toast]);

  const stopRecording = useCallback(() => {
    if (recognition) {
      console.log("Stopping speech recognition manually");
      recognition.stop();
      setRecognition(null);
      
      // Clean up any interim text elements in the editor
      if (editorRef.current) {
        const interimElement = document.getElementById('interim-text');
        if (interimElement) {
          interimElement.remove();
        }
      }
      
      // Clean up the interim text from currentText state
      const cleanText = currentText.replace(/\[Speaking\.\.\.\] .*$/, '').trim();
      setCurrentText(cleanText);
      
      // Don't add a timestamp to the recording, keep the actual transcribed text
      if (editorRef.current && currentText.trim().length > 0) {
        // Save current selection and cursor position
        const selection = window.getSelection();
        const hasSelection = selection && selection.rangeCount > 0;
        const currentRange = hasSelection ? selection.getRangeAt(0).cloneRange() : null;
        
        // Focus on editor
        editorRef.current.focus();
        
        // Insert a small indicator that we're done recording
        const timestamp = document.createElement('span');
        timestamp.className = 'text-xs text-muted-foreground ml-1 mr-1';
        timestamp.innerHTML = `(recorded) `;
        
        // Add the indicator in a non-intrusive way
        if (currentRange && currentRange.endContainer) {
          // Adds the indicator without interfering with the text
          const originalText = editorRef.current.innerHTML;
          if (!originalText.includes('(recorded)')) {
            // Only add the indicator if it doesn't already exist
            document.execCommand('insertHTML', false, timestamp.outerHTML);
          }
        }
        
        // Restore selection if needed
        if (currentRange) {
          selection?.removeAllRanges();
          selection?.addRange(currentRange);
        }
        
        // Show toast notification that recording has stopped and can be copied if there is text
        if (transcriptionText) {
          toast({
            title: "Recording stopped",
            description: "Your transcription is ready to be copied",
          });
        }
      }
    }
    setIsRecording(false);
  }, [recognition, currentText, transcriptionText, toast]);

  const updateGoalMutation = useMutation({
    mutationFn: (updatedGoal: Partial<Goal>) => 
      fetch(`/api/goals/${updatedGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGoal)
      }).then(res => res.json()),
    onSuccess: () => {
      setHasUnsavedRecording(false);
    }
  });

  const saveRecording = useCallback(() => {
    if (editorRef.current && hasUnsavedRecording && selectedGoalId) {
      const sanitizeHTML = (html: string) => {
        return html.replace(/<script.*?>.*?<\/script>/gi, '');
      };
      const cleanHTML = editorRef.current ? DOMPurify.sanitize(editorRef.current.innerHTML) : '';
      const plainText = editorRef.current.textContent || '';

      // Save to localStorage to persist across page navigations
      try {
        localStorage.setItem('editorContent', cleanHTML);
        
        // If text length is >= 50 characters, ensure we have a journal entry
        if (plainText.length >= 50) {
          // Add or update journal entry with the current date
          const currentDate = entryDate || new Date();
          
          // Update journal entries
          const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
          
          // Check if an entry with this goalId and date exists already
          const existingEntryIndex = journalEntries.findIndex((entry: any) => 
            entry.goalId === selectedGoalId && 
            new Date(entry.date).toDateString() === currentDate.toDateString());
          
          if (existingEntryIndex >= 0) {
            // Update existing entry - store HTML content instead of plain text
            journalEntries[existingEntryIndex].text = cleanHTML;
          } else {
            // Add new entry - store HTML content instead of plain text
            journalEntries.push({
              goalId: selectedGoalId,
              text: cleanHTML,
              date: currentDate.toISOString()
            });
          }
          
          localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
          console.log('Journal entry saved for date filtering');
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      updateGoalMutation.mutate({
        id: parseInt(selectedGoalId),
        description: cleanHTML
      });
    }
  }, [selectedGoalId, hasUnsavedRecording, entryDate]);

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<'youtube' | 'website'>('website');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const handleAddLink = useCallback((type: 'youtube' | 'website') => {
    setLinkType(type);
    setLinkUrl('');
    setLinkTitle('');
    setShowLinkDialog(true);
  }, []);

  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    
    if (editorRef.current) {
      // Create wrapper for the link/video element
      const wrapper = document.createElement('span');
      wrapper.className = 'media-wrapper';
      wrapper.contentEditable = 'false';
      
      if (linkType === 'youtube') {
        // Extract video ID from YouTube URL
        const videoId = linkUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/) || [null, ''];
        
        wrapper.innerHTML = `
          <div class="my-4 rounded-lg overflow-hidden border border-purple-300/30 shadow-lg glow-effect">
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/${videoId[1]}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="w-full aspect-video"
              data-url="${linkUrl}"
            ></iframe>
            <div class="bg-purple-900/20 text-xs text-center p-2 text-gray-200">
              <div class="font-medium text-primary/90">${linkTitle || 'YouTube Video'}</div>
              <div class="text-xs text-primary/80 italic mt-1 font-medium">(Click to play)</div>
            </div>
          </div>
        `;
      } else {
        wrapper.innerHTML = `
          <a 
            href="${linkUrl}" 
            class="text-primary hover:underline inline-block py-2 px-3 border border-purple-300/30 rounded-lg bg-purple-900/10 my-2 shadow-md hover:bg-purple-900/20 hover:shadow-lg transition-all glow-effect"
            target="_blank" 
            rel="noopener noreferrer"
            data-url="${linkUrl}"
          >
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <span class="font-medium text-primary/90">${linkTitle || linkUrl}</span>
            </div>
            <div class="text-xs text-primary/80 italic mt-1 ml-5 font-medium">(Click to open)</div>
          </a>
        `;
      }
      
      // Get the saved or current selection
      let range: Range | null = null;
      
      if (savedSelection.current) {
        range = savedSelection.current;
        savedSelection.current = null;
      } else {
        const selection = window.getSelection();
        if (selection?.rangeCount) {
          range = selection.getRangeAt(0);
        }
      }
      
      // Focus editor before manipulation
      editorRef.current.focus();
      
      if (range && editorRef.current.contains(range.commonAncestorContainer)) {
        // Collapse range to cursor position if there's a selection
        if (!range.collapsed) {
          range.collapse(true);
        }
        
        // Insert link/video at cursor position
        range.insertNode(wrapper);
        
        // Add a non-breaking space after the inserted element
        const space = document.createTextNode('\u00A0');
        wrapper.after(space);
        
        // Create a new range to position cursor after the inserted element
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        
        // Update selection
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      } else {
        // Fallback: append to end
        editorRef.current.appendChild(wrapper);
        
        // Add a non-breaking space
        const space = document.createTextNode('\u00A0');
        editorRef.current.appendChild(space);
        
        // Position cursor after inserted content
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        
        // Update selection
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      }
      
      // Focus back on the editor
      editorRef.current.focus();
      
      // Update state
      setHasUnsavedRecording(true);
      document.dispatchEvent(new CustomEvent('contentChanged'));
    }
    
    setShowLinkDialog(false);
  }, [linkType, linkUrl, linkTitle]);

  const [microphoneStatus, setMicrophoneStatus] = useState<'ready' | 'error' | 'denied' | 'unknown'>('ready');

  useEffect(() => {
    if (!editorRef.current) return;

    const handleContentChanged = () => {
      setHasUnsavedRecording(true);
    };

    document.addEventListener('contentChanged', handleContentChanged);

    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const previewElement = target.closest('[data-preview]');
      if (previewElement instanceof HTMLElement) {
        e.preventDefault();
        e.stopPropagation();
        setPreviewUrl(previewElement.dataset.url || null);
        setPreviewType((previewElement.dataset.type as 'image' | 'document') || null);
        setPreviewTitle(previewElement.dataset.title || '');
      }
    };

    // Track first entry date
    const checkAndStoreFirstEntry = () => {
      if (!editorRef.current) return;
      const content = editorRef.current.textContent || '';
      if (content.length > 50) {
        const existingDates = JSON.parse(localStorage.getItem('firstEntryDates') || '[]');
        const today = format(new Date(), 'yyyy-MM-dd');
        if (!existingDates.includes(today)) {
          existingDates.push(today);
          localStorage.setItem('firstEntryDates', JSON.stringify(existingDates));
        }
      }
    };

    editorRef.current.addEventListener('input', checkAndStoreFirstEntry); // Add event listener for input
    editorRef.current.addEventListener('click', handleEditorClick);
    return () => {
      editorRef.current?.removeEventListener('click', handleEditorClick);
      editorRef.current?.removeEventListener('input', checkAndStoreFirstEntry); //remove event listener
      document.removeEventListener('contentChanged', handleContentChanged);
    };
  }, []);


  return (
    <div className={`space-y-3 p-3 rounded-lg shadow-sm border border-border ${theme === "dark" ? "bg-card/80 text-white" : "bg-card/80 text-black"} relative bg-pattern w-full h-[80vh] flex flex-col overflow-hidden`}>
      {/* Fixed main toolbar at the top */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border pb-3 -mx-3 px-3 pt-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 justify-between relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <GoalsDropdown 
            onSelectGoal={handleGoalSelect} 
            goals={goals} 
            onDescriptionClick={handleDescriptionClick} 
            onSubGoalClick={handleSubGoalSelect} 
          />
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 relative overflow-hidden ${isRecording ? 'mic-recording' : ''}`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
          {transcriptionText && (
            <Button
              variant="outline"
              onClick={() => copyToClipboard(transcriptionText)}
              className="flex items-center gap-2"
              disabled={isCopied}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {isCopied ? "Copied!" : "Copy Transcription"}
            </Button>
          )}
          <Button variant="outline" asChild>
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer flex items-center gap-2"
              onClick={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedSelection.current = sel.getRangeAt(0).cloneRange();
                }
              }}
            >
              <ImageIcon className="h-4 w-4" />
              Add Image
            </label>
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" asChild>
            <label 
              htmlFor="document-upload" 
              className="cursor-pointer flex items-center gap-2"
              onClick={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedSelection.current = sel.getRangeAt(0).cloneRange();
                }
              }}
            >
              <FileText className="h-4 w-4" />
              Add Document
            </label>
          </Button>
          <input
            id="document-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" onClick={() => handleAddLink('youtube')}>
            <Youtube className="h-4 w-4 mr-2" />
            Add YouTube
          </Button>
          <Button variant="outline" onClick={() => handleAddLink('website')}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Add Website
          </Button>
        </div>
        </div>
        {isRecording && (
          <div className="flex items-center text-red-500 mt-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Recording...
          </div>
        )}
      </div>
      <Dialog open={!!previewUrl} onOpenChange={() => {
        setPreviewUrl(null);
        setPreviewType(null);
        setPreviewTitle('');
      }}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-4 sm:p-6">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              {previewType === 'document' && <FileText className="h-5 w-5" />}
              {previewType === 'image' && <ImageIcon className="h-5 w-5" />}
              {previewTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setPreviewUrl(null);
                setPreviewType(null);
                setPreviewTitle('');
              }}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="mt-4 relative overflow-auto">
            {previewType === 'image' && (
              <div className="relative group">
                <img
                  src={previewUrl || ''}
                  alt={previewTitle}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const mediaWrapper = editorRef.current?.querySelector(`[data-url="${previewUrl}"]`)?.closest('.media-wrapper');
                      if (mediaWrapper) {
                        mediaWrapper.remove();
                        document.dispatchEvent(new CustomEvent('contentChanged'));
                        setPreviewUrl(null);
                        setPreviewType(null);
                        setPreviewTitle('');
                      }
                    }}
                    className="rounded-full h-9"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                    className="rounded-full h-9"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
            {previewType === 'document' && (
              <div className="relative h-[70vh]">
                {previewUrl?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="w-full h-full rounded-lg border border-border"
                    title={previewTitle}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const mediaWrapper = editorRef.current?.querySelector(`[data-url="${previewUrl}"]`)?.closest('.media-wrapper');
                          if (mediaWrapper) {
                            mediaWrapper.remove();
                            document.dispatchEvent(new CustomEvent('contentChanged'));
                            setPreviewUrl(null);
                            setPreviewType(null);
                            setPreviewTitle('');
                          }
                        }}
                        className="rounded-full h-9"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                        className="rounded-full h-9"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {linkType === 'youtube' ? 'Add YouTube Video' : 'Add Website Link'}
            </DialogTitle>
            <DialogDescription>
              {linkType === 'youtube' 
                ? 'Enter a YouTube URL to embed a video' 
                : 'Enter website URL and title to add a link'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input 
                id="url" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                placeholder={linkType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com'} 
                className="col-span-3" 
              />
            </div>
            {linkType === 'website' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input 
                  id="title" 
                  value={linkTitle} 
                  onChange={(e) => setLinkTitle(e.target.value)} 
                  placeholder="Link title" 
                  className="col-span-3" 
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} className="rounded-full h-9">Cancel</Button>
            <Button onClick={insertLink} className="rounded-full h-9">Add {linkType === 'youtube' ? 'Video' : 'Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Secondary toolbar - formatting options */}
      <div className="sticky top-[60px] z-40 bg-card/95 backdrop-blur-md border-b border-border pb-2 -mx-3 px-3 pt-2 mt-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 pb-2 pt-1">
          <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" onClick={() => formatText('bold')} title="Bold" className="h-8 w-8 rounded-md hover:bg-background">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => formatText('italic')} title="Italic" className="h-8 w-8 rounded-md hover:bg-background">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => formatText('underline')} title="Underline" className="h-8 w-8 rounded-md hover:bg-background">
              <Underline className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                // Save current selection
                if (window.getSelection && window.getSelection()?.rangeCount) {
                  savedSelection.current = window.getSelection()?.getRangeAt(0) || null;
                }
                setShowEmojiPicker(!showEmojiPicker);
              }}
              title="Add Emoji" 
              className="h-8 w-8 rounded-md hover:bg-background"
            >
              <Smile className="h-4 w-4" />
            </Button>
            {/* Text Color button */}
            <Button 
              variant="ghost" 
              size="icon"
              title="Text Color"
              className="h-8 w-8 rounded-md hover:bg-background flex items-center justify-center relative"
              onClick={() => {
                // Save current selection
                if (window.getSelection && window.getSelection()?.rangeCount) {
                  savedSelection.current = window.getSelection()?.getRangeAt(0) || null;
                }
                
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = textColor;
                colorPicker.onchange = (e) => {
                  const color = (e.target as HTMLInputElement).value;
                  setTextColor(color);
                  
                  // Restore selection and apply color
                  if (savedSelection.current && window.getSelection) {
                    const selection = window.getSelection();
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(savedSelection.current);
                      formatText('foreColor', color);
                    }
                  }
                };
                colorPicker.click();
              }}
            >
              <span className="text-lg font-semibold" style={{ color: textColor }}>A</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: textColor }}></div>
            </Button>
            {/* Highlight Color button */}
            <Button 
              variant="ghost" 
              size="icon"
              title="Highlight Color"
              className="h-8 w-8 rounded-md hover:bg-background flex items-center justify-center"
              onClick={() => {
                // Save current selection
                if (window.getSelection && window.getSelection()?.rangeCount) {
                  savedSelection.current = window.getSelection()?.getRangeAt(0) || null;
                }
                
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = highlightColor;
                colorPicker.onchange = (e) => {
                  const color = (e.target as HTMLInputElement).value;
                  setHighlightColor(color);
                  
                  // Restore selection and apply highlight
                  if (savedSelection.current && window.getSelection) {
                    const selection = window.getSelection();
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(savedSelection.current);
                      formatText('hiliteColor', color);
                    }
                  }
                };
                colorPicker.click();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: highlightColor }}>
                <path d="M2.5 9.5L9.08579 2.91421C9.47131 2.52869 10.0875 2.52869 10.473 2.91421L12.0858 4.52698C12.4713 4.9125 12.4713 5.52869 12.0858 5.91421L5.5 12.5L2 13.5L2.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" onClick={() => formatText('justifyLeft')} title="Align Left" className="h-8 w-8 rounded-md hover:bg-background">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => formatText('justifyCenter')} title="Align Center" className="h-8 w-8 rounded-md hover:bg-background">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => formatText('justifyRight')} title="Align Right" className="h-8 w-8 rounded-md hover:bg-background">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 bg-muted/20 rounded-lg p-1 pl-2 flex-grow">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              }}
              className="w-48 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-7 text-sm"
            />
            {searchMatches.length > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-muted/40 text-foreground">
                {currentMatchIndex + 1} of {searchMatches.length}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSearch}
              className="h-7 px-2 ml-auto mr-0"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto px-1 pt-3">
        <div className="relative">
          <div
            ref={editorRef}
            className={`editor-content w-full min-h-[250px] p-5 border border-border rounded-lg ${theme === "dark" ? "bg-muted/30 text-foreground" : "bg-card text-foreground"} transition-colors duration-300 focus:outline-none shadow-sm prose max-w-none`}
            contentEditable
            onInput={() => setHasUnsavedRecording(true)}
            data-placeholder="Start typing or recording your content here..."
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute right-4 top-4 z-50 emoji-picker-panel">
              {/* Common emojis */}
              {"😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 🥰 😘 😗 😙 😚 ☺️ 🙂 🤗 🤩 🤔 🤨 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 🤯 😬 😰 😱 🥵 🥶 😳 🤪 😵 😡 😠 🤬 😷 🤒 🤕 🤢 🤮 🤧 😇 🤠 🤡 🥳 🥴 🥺 🤥 🤫 🤭 🧐 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾"
                .split(" ")
                .map((emoji, idx) => (
                  <button
                    className="emoji-item"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              
              {/* Close button */}
              <button 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                onClick={() => setShowEmojiPicker(false)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom toolbar */}
      <div className="sticky bottom-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pt-3 -mx-3 px-3 pb-1 mt-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="relative overflow-hidden"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M3 13c0-4.97 4.03-9 9-9 4.97 0 9 4.03 9 9s-4.03 9-9 9c-2.49 0-4.74-1.01-6.36-2.64" />
              </svg>
              Undo
            </Button>
            <Button
              variant="outline"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="relative overflow-hidden"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M21 13c0-4.97-4.03-9-9-9-4.97 0-9 4.03-9 9s4.03 9 9 9c2.49 0 4.74-1.01 6.36-2.64" />
              </svg>
              Redo
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadPDF}
              className="relative overflow-hidden"
            >
              <Download className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
          </div>
          <Button 
            onClick={saveRecording} 
            variant="default"
            className="relative overflow-hidden flex items-center"
            disabled={!hasUnsavedRecording}
          >
            <Save className="h-4 w-4 mr-2" />
            {hasUnsavedRecording ? 'Save Changes' : 'No Changes to Save'}
          </Button>
        </div>
      </div>
      
      <style>{`
        .search-highlight {
          background-color: #ffd700;
        }
        .search-highlight.current {
          background-color: #ff8c00;
        }
        .media-wrapper {
          display: inline-block;
          margin: 8px 0;
          position: relative;
        }
        
        [contenteditable=true]:empty:not(:focus):before {
          content: attr(data-placeholder);
          color: gray;
          font-style: italic;
          pointer-events: none;
        }
        
        .editor-content p {
          margin: 0.75em 0;
        }
      `}</style>
    </div>
  );
}