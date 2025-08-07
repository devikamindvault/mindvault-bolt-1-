import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Smile, Palette, Undo, Redo
} from 'lucide-react';
import {
  Bold, Italic, Underline, List, ListOrdered, Link, Image, Upload, FileText, Download, Save, Lightbulb, ChevronDown, X, Eye, EyeOff, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import VoiceRecorder from './VoiceRecorder';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isPinned: boolean;
  createdAt: string;
}

interface RichTextEditorProps {
  selectedIdea?: Idea | null;
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ selectedIdea, ideas, onSelectIdea }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#f9fafb');
  const [showIdeaDropdown, setShowIdeaDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<Range | null>(null);

  // Emojis and stickers arrays
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];
  const stickers = ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍭', '🍬', '🍫', '🍩', '🍪', '☕', '🍵', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🎵', '🎶', '🎤', '🎧', '🎼', '🎹', '🥁', '🎸', '🎺', '🎷', '🎻', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💢', '💨', '💦', '💧', '☀️', '🌙', '⭐', '🌈', '☁️', '⛅', '🌤️', '⛈️', '🌩️', '❄️', '☃️', '⛄'];

  // Daily quotes function
  const getTodaysQuote = () => {
    const quotes = [
      "The best way to predict the future is to create it.",
      "Innovation distinguishes between a leader and a follower.",
      "Your ideas are the seeds of tomorrow's reality.",
      "Creativity is intelligence having fun.",
      "Every great idea starts with a single thought.",
      "The mind that opens to a new idea never returns to its original size.",
      "Ideas are the currency of the future."
    ];
    const today = new Date().getDate();
    return quotes[today % quotes.length];
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emoji-picker') && !target.closest('[data-emoji-trigger]')) {
        setShowEmojiPicker(false);
      }
      if (!target.closest('.color-picker') && !target.closest('[data-color-trigger]')) {
        setShowColorPicker(false);
      }
      if (!target.closest('.idea-dropdown') && !target.closest('[data-idea-trigger]')) {
        setShowIdeaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIdeaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter ideas based on search term
  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (idea.category && idea.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (selectedIdea && editorRef.current) {
      // Load saved background and text color for this idea
      const savedBg = localStorage.getItem(`idea-bg-${selectedIdea.id}`) || backgroundColor;
      const savedTextColor = localStorage.getItem(`idea-text-${selectedIdea.id}`) || textColor;
      setBackgroundColor(savedBg);
      setTextColor(savedTextColor);
      
      // Set the editor content to just the idea data
      editorRef.current.style.backgroundColor = savedBg;
      editorRef.current.style.color = savedTextColor;
      editorRef.current.innerHTML = `
        <h1 style="color: ${savedTextColor}; font-size: 32px; font-weight: bold; margin-bottom: 20px;">
          💡 ${selectedIdea.title}
        </h1>
        <p style="color: ${savedTextColor}; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
          ${selectedIdea.description}
        </p>
      `;
      setHasUnsavedChanges(false);
    }
  }, [selectedIdea, backgroundColor, textColor]);

  // Track changes in editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInput = () => {
      setHasUnsavedChanges(true);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setCurrentSelection(selection.getRangeAt(0).cloneRange());
      }
    };
    editor.addEventListener('input', handleInput);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      editor.removeEventListener('input', handleInput);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selectedIdea]);
  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    // Create a simple toast notification
    const toastEl = document.createElement('div');
    toastEl.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toastEl), 300);
    }, 3000);
  };

  const saveContent = () => {
    if (!selectedIdea || !editorRef.current) {
      toast('No idea selected to save', 'error');
      return;
    }

    try {
      // Get current content from editor
      const content = editorRef.current.innerHTML;
      
      // Extract title and description from content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      const titleElement = tempDiv.querySelector('h1');
      const descElement = tempDiv.querySelector('p');
      
      const newTitle = titleElement?.textContent || selectedIdea.title;
      const newDescription = descElement?.textContent || selectedIdea.description;
      
      // Save to edit history
      const historyKey = `idea-history-${selectedIdea.id}`;
      const existingHistory = localStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const newEntry = {
        id: Date.now().toString(),
        content: content,
        timestamp: new Date().toISOString(),
        title: newTitle,
        description: newDescription
      };
      
      history.push(newEntry);
      localStorage.setItem(historyKey, JSON.stringify(history));
      
      // Update the idea in localStorage
      const savedIdeas = localStorage.getItem('mindvault-ideas');
      if (savedIdeas) {
        const ideas = JSON.parse(savedIdeas);
        const updatedIdeas = ideas.map((idea: any) =>
          idea.id === selectedIdea.id
            ? { ...idea, title: newTitle, description: newDescription }
            : idea
        );
        
        localStorage.setItem('mindvault-ideas', JSON.stringify(updatedIdeas));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('ideasUpdated', { detail: updatedIdeas }));
        
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        toast('Content saved successfully!');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast('Failed to save content', 'error');
    }
  };

  const handleIdeaSelect = (idea: Idea) => {
    onSelectIdea(idea);
    setShowIdeaDropdown(false);
    setSearchTerm('');
  };

  const clearIdeaSelection = () => {
    onSelectIdea(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleVoiceTranscription = (transcription: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    
    // Use the stored selection or create a new one at the end
    let range = currentSelection;
    if (!range) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        // Create range at the end of editor content
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }
    }

    // Insert the transcription at the cursor position
    const textNode = document.createTextNode(' ' + transcription + ' ');
    range.insertNode(textNode);
    
    // Move cursor after the inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    
    // Update the selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    setHasUnsavedChanges(true);
    toast('Voice transcription added successfully!');
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast('Image size should be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'media-preview-container';
        imgContainer.style.cssText = `
          position: relative;
          display: block;
          margin: 16px 0;
          clear: both;
          max-width: 100%;
          border: 2px solid #374151;
          border-radius: 12px;
          background: #1f2937;
          padding: 8px;
          transition: all 0.2s ease;
        `;
        
        imgContainer.innerHTML = `
          <img src="${event.target?.result}" style="
            width: 300px; 
            height: auto; 
            max-width: 100%;
            min-width: 150px;
            max-height: 400px; 
            object-fit: contain; 
            border-radius: 8px; 
            cursor: pointer;
            display: block;
            resize: both;
            overflow: hidden;
          " onclick="this.parentElement.parentElement.querySelector('.image-modal').style.display='flex'" />
          <button class="delete-btn" onclick="this.parentElement.remove()" title="Remove image" style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          ">×</button>
          <div class="resize-handle" style="
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: linear-gradient(-45deg, transparent 30%, #60a5fa 30%, #60a5fa 70%, transparent 70%);
            cursor: nw-resize;
            border-radius: 0 0 8px 0;
          "></div>
          <div class="image-modal" style="
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.9); 
            z-index: 10000; 
            align-items: center; 
            justify-content: center;
          " onclick="this.style.display='none'">
            <img src="${event.target?.result}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;" />
          </div>
        `;
        
        // Add resize functionality
        const img = imgContainer.querySelector('img');
        const resizeHandle = imgContainer.querySelector('.resize-handle');
        let isResizing = false;
        
        resizeHandle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = parseInt(window.getComputedStyle(img).width, 10);
          
          const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const width = startWidth + (e.clientX - startX);
            const minWidth = 150;
            const maxWidth = 800;
            
            if (width >= minWidth && width <= maxWidth) {
              img.style.width = width + 'px';
            }
          };
          
          const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(imgContainer);
          
          // Add line breaks before and after for proper text flow
          const beforeBr = document.createElement('br');
          const afterBr = document.createElement('br');
          range.insertNode(beforeBr);
          range.setStartAfter(beforeBr);
          range.insertNode(imgContainer);
          range.setStartAfter(imgContainer);
          range.insertNode(afterBr);
          range.setStartAfter(afterBr);
        } else if (editorRef.current) {
          const beforeBr = document.createElement('br');
          const afterBr = document.createElement('br');
          editorRef.current.appendChild(beforeBr);
          editorRef.current.appendChild(imgContainer);
          editorRef.current.appendChild(afterBr);
        }
        
        toast('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast('Document size should be less than 10MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const docPreview = document.createElement('div');
        docPreview.className = 'document-preview-container';
        docPreview.style.cssText = `
          display: inline-flex;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #374151, #4b5563);
          border: 2px solid #6b7280;
          border-radius: 12px;
          margin: 8px 4px;
          color: #e5e7eb;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          max-width: 300px;
        `;
        
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const fileIcon = getFileIcon(fileExtension);
        
        docPreview.innerHTML = `
          <div style="width: 32px; height: 32px; margin-right: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;">
            ${fileIcon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px; color: white; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${file.name}
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
              ${formatFileSize(file.size)} • ${fileExtension.toUpperCase()}
            </div>
          </div>
          <button class="delete-btn" onclick="this.parentElement.remove()" title="Remove document" style="position: absolute; top: -8px; right: -8px;">×</button>
        `;
        
        // Add click handler for preview/download
        docPreview.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).classList.contains('delete-btn')) return;
          
          // Check if it's a previewable file type
          const previewableTypes = ['pdf', 'txt', 'doc', 'docx'];
          if (previewableTypes.includes(fileExtension)) {
            showDocumentPreview(file, event.target?.result as string, fileExtension);
          } else {
            // Download for non-previewable files
            const link = document.createElement('a');
            link.href = event.target?.result as string;
            link.download = file.name;
            link.click();
          }
        });
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(docPreview);
          range.setStartAfter(docPreview);
          range.setEndAfter(docPreview);
        } else if (editorRef.current) {
          editorRef.current.appendChild(docPreview);
        }
        
        toast('Document uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileIcon = (extension: string): string => {
    const iconMap: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📄',
      rtf: '📄',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      zip: '📦',
      rar: '📦',
      mp3: '🎵',
      mp4: '🎬',
      avi: '🎬',
      mov: '🎬',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      svg: '🖼️'
    };
    return iconMap[extension] || '📎';
  };

  const showDocumentPreview = (file: File, dataUrl: string, extension: string) => {
    // Create modal for document preview
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #1f2937;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      height: 80%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 2px solid #374151;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      background: #374151;
      border-bottom: 1px solid #4b5563;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;">
          ${getFileIcon(extension)}
        </div>
        <div>
          <h3 style="color: white; font-size: 18px; font-weight: bold; margin: 0;">${file.name}</h3>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">${formatFileSize(file.size)} • ${extension.toUpperCase()}</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="download-btn" style="
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Download</button>
        <button id="close-btn" style="
          padding: 8px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">×</button>
      </div>
    `;
    
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow: auto;
      background: #111827;
    `;
    
    // Handle different file types
    if (extension === 'pdf') {
      body.innerHTML = `
        <iframe src="${dataUrl}" style="
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
        "></iframe>
      `;
    } else if (extension === 'txt') {
      // For text files, read the content
      const reader = new FileReader();
      reader.onload = (e) => {
        body.innerHTML = `
          <pre style="
            color: #e5e7eb;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
          ">${e.target?.result}</pre>
        `;
      };
      reader.readAsText(file);
    } else {
      body.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">${getFileIcon(extension)}</div>
          <h3 style="color: white; margin-bottom: 8px;">Preview not available</h3>
          <p>This file type cannot be previewed in the browser.</p>
          <p>Click the download button to save the file.</p>
        </div>
      `;
    }
    
    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = header.querySelector('#close-btn');
    const downloadBtn = header.querySelector('#download-btn');
    
    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    downloadBtn?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = file.name;
      link.click();
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:', url);
      if (text) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text;
        link.style.cssText = `
          color: #60a5fa;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s ease;
        `;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Add hover effect
        link.addEventListener('mouseenter', () => {
          link.style.color = '#93c5fd';
        });
        link.addEventListener('mouseleave', () => {
          link.style.color = '#60a5fa';
        });
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(link);
          range.setStartAfter(link);
          range.setEndAfter(link);
        }
        
        toast('Link inserted successfully!');
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
    } else {
      const textNode = document.createTextNode(emoji);
      editor.appendChild(textNode);
    }
    
    setShowEmojiPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = document.createElement('div');
            img.className = 'media-preview-container';
            img.style.cssText = `
              position: relative;
              display: block;
              margin: 16px 0;
              clear: both;
              max-width: 100%;
              border: 2px solid #374151;
              border-radius: 12px;
              background: #1f2937;
              padding: 8px;
            `;
            img.innerHTML = `
              <img src="${event.target?.result}" style="
                width: 100%; 
                height: auto; 
                max-height: 400px; 
                object-fit: contain; 
                border-radius: 8px; 
                cursor: pointer;
                display: block;
              " onclick="this.parentElement.parentElement.querySelector('.image-modal').style.display='flex'" />
              <button class="delete-btn" onclick="this.parentElement.remove()" title="Remove image" style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #ef4444;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
              ">×</button>
              <div class="image-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; align-items: center; justify-content: center;" onclick="this.style.display='none'">
                <img src="${event.target?.result}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;" />
              </div>
            `;
            
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const beforeBr = document.createElement('br');
              const afterBr = document.createElement('br');
              range.insertNode(beforeBr);
              range.setStartAfter(beforeBr);
              range.insertNode(img);
              range.setStartAfter(img);
              range.insertNode(afterBr);
              range.setStartAfter(afterBr);
            } else if (editorRef.current) {
              const beforeBr = document.createElement('br');
              const afterBr = document.createElement('br');
              editorRef.current.appendChild(beforeBr);
              editorRef.current.appendChild(img);
              editorRef.current.appendChild(afterBr);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
          }
        });
      }
    }
  };

  const downloadAsPDF = async () => {
    if (isDownloading || !editorRef.current) return;
    
    try {
      setIsDownloading(true);
      const content = editorRef.current;
      
      // Create a temporary container with better styling for PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        padding: 40px;
        background: ${backgroundColor};
        color: ${textColor};
        font-family: 'Georgia', serif;
        line-height: 1.6;
      `;
      tempContainer.innerHTML = content.innerHTML;
      document.body.appendChild(tempContainer);
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      
      const canvas = await htmlToImage.toCanvas(tempContainer, {
        pixelRatio: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: backgroundColor,
        width: 800,
        height: tempContainer.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }
      
      const fileName = selectedIdea 
        ? `${selectedIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_idea.pdf`
        : 'mind-vault-document.pdf';
      
      doc.save(fileName);
      toast('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rich-text-editor max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 min-h-screen">
      <style>{`
        .toolbar-button {
          padding: 10px 12px;
          background: transparent;
          color: #e2e8f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toolbar-button:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .toolbar-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .toolbar-select {
          padding: 8px 12px;
          background: #475569;
          color: white;
          border: 1px solid #64748b;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          min-width: 120px;
        }
        .rich-editor {
          font-family: 'Georgia', serif;
          font-size: 16px;
          line-height: 1.8;
          padding: 32px;
          min-height: 600px;
          background: ${backgroundColor};
          color: ${textColor};
          border: none;
          outline: none;
          resize: none;
          overflow-y: auto;
        }
        .rich-editor:focus {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(168, 85, 247, 0.4);
        }
        .rich-editor h1, .rich-editor h2, .rich-editor h3 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: bold;
        }
        .rich-editor h1 { font-size: 32px; }
        .rich-editor h2 { font-size: 24px; }
        .rich-editor h3 { font-size: 20px; }
        .rich-editor p {
          margin-bottom: 16px;
        }
        .rich-editor ul, .rich-editor ol {
          margin: 16px 0;
          padding-left: 32px;
        }
        .rich-editor li {
          margin-bottom: 8px;
        }
        .rich-editor a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .rich-editor a:hover {
          color: #93c5fd;
        }
        .rich-editor blockquote {
          border-left: 4px solid #a855f7;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #cbd5e1;
        }
        .rich-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .rich-editor code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
        .rich-editor pre {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
        .rich-editor pre code {
          background: none;
          padding: 0;
        }
        .media-preview-container:hover {
          border-color: #60a5fa;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .document-preview-container:hover {
          background: linear-gradient(135deg, #4b5563, #6b7280);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .delete-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s ease;
        }
        .delete-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }
        .rich-text-editor {
          padding-right: 20px;
        }
        @media (max-width: 768px) {
          .rich-text-editor {
            padding-right: 20px;
          }
        }
      `}</style>
      
      {/* Daily Quote */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-pink-900/60 rounded-2xl border border-indigo-400/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
        <div className="flex items-center gap-3">
          <div className="text-4xl animate-bounce">💭</div>
          <div className="relative z-10">
            <p className="text-white font-medium italic text-xl leading-relaxed drop-shadow-lg">
              "{getTodaysQuote()}"
            </p>
            <p className="text-indigo-300 text-sm mt-3 font-semibold">✨ Daily Inspiration</p>
          </div>
        </div>
      </div>

      {/* Idea Selection Dropdown */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <label className="block text-lg font-semibold text-white mb-3">
          Select an Idea to Work On
        </label>
        <div className="relative">
          <button
            onClick={() => setShowIdeaDropdown(!showIdeaDropdown)}
            className={\`w-full p-4 bg-slate-800 border-2 rounded-xl text-left flex items-center justify-between transition-all duration-300 ${
              selectedIdea 
                ? 'border-purple-500 bg-gradient-to-r from-slate-800 to-purple-900/30' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              {selectedIdea ? (
                <>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <div>
                    <span className="text-white font-semibold text-lg">{selectedIdea.title}</span>
                    <p className="text-gray-400 text-sm mt-1">{selectedIdea.category || 'Uncategorized'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-400 text-lg">Choose an idea to start writing...</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedIdea && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearIdeaSelection();
                  }}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronDown className={\`w-5 h-5 text-gray-400 transition-transform ${showIdeaDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showIdeaDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
              {/* Search Input */}
              <div className="p-4 border-b border-slate-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all"
                  />
                </div>
              </div>

              {/* Ideas List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredIdeas.length > 0 ? (
                  filteredIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => handleIdeaSelect(idea)}
                      className={\`w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                        selectedIdea?.id === idea.id ? 'bg-purple-900/30 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={\`w-2 h-2 rounded-full ${idea.isPinned ? 'bg-yellow-500' : 'bg-purple-500'}`}></div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{idea.title}</h4>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{idea.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {idea.category && (
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                {idea.category}
                              </span>
                            )}
                            {idea.isPinned && (
                              <span className="text-yellow-500 text-xs">📌 Pinned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    {searchTerm ? 'No ideas found matching your search' : 'No ideas available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={\`editor-toolbar bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-2 border-slate-600 rounded-t-2xl p-5 flex flex-wrap gap-4 items-center shadow-2xl backdrop-blur-md ${!selectedIdea ? 'opacity-50' : ''}`}>
        {/* Text Formatting */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button onClick={() => execCommand('bold')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" disabled={!selectedIdea} title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" disabled={!selectedIdea} title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" disabled={!selectedIdea} title="Underline">
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button onClick={() => execCommand('justifyLeft')} className="toolbar-button hover:bg-indigo-600 transition-all duration-200" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="toolbar-button hover:bg-indigo-600 transition-all duration-200" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="toolbar-button hover:bg-indigo-600 transition-all duration-200" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-button hover:bg-green-600 transition-all duration-200" disabled={!selectedIdea} title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="toolbar-button hover:bg-green-600 transition-all duration-200" disabled={!selectedIdea} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="toolbar-group bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <select 
            onChange={(e) => execCommand('fontSize', e.target.value)}
            defaultValue="3"
            className="toolbar-select bg-slate-600 text-white border-0 rounded-lg px-4 py-2 text-sm font-bold shadow-inner"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Extra Large</option>
          </select>
        </div>

        {/* Media */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="toolbar-button hover:bg-blue-600 transition-all duration-200" 
            disabled={!selectedIdea}
            title="Upload Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button 
            onClick={() => documentInputRef.current?.click()} 
            className="toolbar-button hover:bg-blue-600 transition-all duration-200" 
            disabled={!selectedIdea}
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={insertLink} className="toolbar-button hover:bg-blue-600 transition-all duration-200" disabled={!selectedIdea} title="Insert Link">
            <Link className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji & Stickers */}
        <div className="toolbar-group flex gap-1 relative bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button 
            data-emoji-trigger
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="toolbar-button hover:bg-yellow-600 transition-all duration-200" 
            disabled={!selectedIdea}
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {showEmojiPicker && (
            <div className="emoji-picker absolute top-full left-0 mt-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-6 z-50 w-96 shadow-2xl backdrop-blur-md">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Emojis
                </h4>
                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="p-3 hover:bg-purple-600 rounded-xl text-xl transition-all duration-200 transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  ⭐ Stickers
                </h4>
                <div className="grid grid-cols-8 gap-1">
                  {stickers.map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(sticker)}
                      className="p-3 hover:bg-pink-600 rounded-xl text-xl transition-all duration-200 transform hover:scale-110"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="toolbar-group flex gap-1 relative bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button 
            data-color-trigger
            onClick={() => setShowColorPicker(!showColorPicker)} 
            className="toolbar-button hover:bg-pink-600 transition-all duration-200" 
            title="Colors & Themes"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {showColorPicker && (
            <div className="color-picker absolute top-full left-0 mt-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-6 z-50 w-72 shadow-2xl backdrop-blur-md">
              <div className="mb-4">
                <label className="block text-lg font-bold text-white mb-4">🎨 Background Color</label>
                <div className="flex gap-2 mb-2">
                  {['#1f2937', '#0f172a', '#374151', '#1e293b', '#312e81', '#581c87'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setBackgroundColor(color);
                        localStorage.setItem('editor-bg-color', color);
                        if (selectedIdea) {
                          localStorage.setItem(\`idea-bg-${selectedIdea.id}`, color);
                        }
                        if (editorRef.current) {
                          editorRef.current.style.backgroundColor = color;
                          const contentDiv = editorRef.current.querySelector('div[style*="min-height: 100vh"]');
                          if (contentDiv) {
                            (contentDiv as HTMLElement).style.background = color;
                          }
                        }
                      }}
                      className="w-10 h-10 rounded-xl border-3 border-slate-500 hover:border-white transition-all duration-200 transform hover:scale-110 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    localStorage.setItem('editor-bg-color', e.target.value);
                    if (selectedIdea) {
                      localStorage.setItem(\`idea-bg-${selectedIdea.id}`, e.target.value);
                    }
                    if (editorRef.current) {
                      editorRef.current.style.backgroundColor = e.target.value;
                      // Update the entire content background
                      const contentDiv = editorRef.current.querySelector('div[style*="min-height: 100vh"]');
                      if (contentDiv) {
                        (contentDiv as HTMLElement).style.background = e.target.value;
                        // Update text content background if it exists
                        const titleElement = editorRef.current.querySelector('h1');
                        const descElement = editorRef.current.querySelector('p');
                        if (titleElement) titleElement.style.color = textColor;
                        if (descElement) descElement.style.color = textColor;
                      }
                    }
                  }}
                  className="w-full h-12 rounded-xl border-2 border-slate-500 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-white mb-4">✍️ Text Color</label>
                <div className="flex gap-2 mb-2">
                  {['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8', '#60a5fa', '#a855f7'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setTextColor(color);
                        execCommand('foreColor', color);
                        if (selectedIdea) {
                          localStorage.setItem(\`idea-text-${selectedIdea.id}`, color);
                        }
                        // Update existing content
                        if (editorRef.current) {
                          const titleElement = editorRef.current.querySelector('h1');
                          const descElement = editorRef.current.querySelector('p');
                          if (titleElement) titleElement.style.color = color;
                          if (descElement) descElement.style.color = color;
                        }
                      }}
                      className="w-10 h-10 rounded-xl border-3 border-slate-500 hover:border-white transition-all duration-200 transform hover:scale-110 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    execCommand('foreColor', e.target.value);
                    if (selectedIdea) {
                      localStorage.setItem(\`idea-text-${selectedIdea.id}`, e.target.value);
                    }

                    // Update existing content
                    if (editorRef.current) {
                      const titleElement = editorRef.current.querySelector('h1');
                      const descElement = editorRef.current.querySelector('p');
                      if (titleElement) titleElement.style.color = e.target.value;
                      if (descElement) descElement.style.color = e.target.value;
                    }
                  }}
                  className="w-full h-12 rounded-xl border-2 border-slate-500 shadow-inner"
                />
              </div>
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button onClick={() => execCommand('undo')} className="toolbar-button hover:bg-orange-600 transition-all duration-200" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('redo')} className="toolbar-button hover:bg-orange-600 transition-all duration-200" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Recording */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <VoiceRecorder 
            onTranscription={handleVoiceTranscription} 
            disabled={!selectedIdea}
          />
        </div>
      </div>
      
      {/* Editor */}
      {selectedIdea ? (
        <div 
          ref={editorRef}
          className="rich-editor min-h-[600px] border-2 border-slate-600 border-t-0 rounded-b-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all overflow-auto shadow-2xl backdrop-blur-sm"
          contentEditable
          suppressContentEditableWarning={true}
          onPaste={handlePaste}
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            padding: selectedIdea ? '0' : '32px'
          }}
        >
          {!selectedIdea && (
            <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '16px', lineHeight: '1.8', fontFamily: 'Georgia, serif' }}>
              <h3 style={{ color: '#a855f7', fontSize: '28px', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>✨ Welcome to Mind Vault</h3>
              <p>Select an idea from the Ideas page to start developing it, or begin writing your thoughts here...</p>
              <br />
              <p style={{ fontSize: '18px' }}>💡 <strong style={{ color: '#60a5fa' }}>Tip:</strong> Use the toolbar above to format text, add images, upload documents, and customize your workspace!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rich-editor bg-slate-900 border-2 border-dashed border-slate-600 flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Select an Idea to Start Writing</h3>
            <p className="text-gray-500 mb-4">
              Choose an idea from the dropdown above to begin developing your thoughts and content.
            </p>
            <p className="text-sm text-gray-600">
              💡 You can search through your ideas or create new ones from the Ideas page.
            </p>
          </div>
        </div>
      )}

      {/* Save Button - Bottom Right Corner */}
      {selectedIdea && (
        <button
          onClick={saveContent}
          disabled={!selectedIdea || !hasUnsavedChanges}
          className={\`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl transition-all duration-300 z-40 flex items-center gap-2 ${
            selectedIdea && hasUnsavedChanges
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white animate-pulse hover:scale-110'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          }`}
          title={
            !selectedIdea 
              ? 'Select an idea first' 
              : !hasUnsavedChanges 
              ? 'No changes to save' 
              : 'Save changes'
          }
        >
          <span className="text-2xl">💾</span>
          <span className="text-sm font-bold">Save</span>
          {hasUnsavedChanges && selectedIdea && (
            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
      )}

      {/* Last Saved Indicator */}
      {lastSaved && selectedIdea && (
        <div 
          className="fixed bottom-20 right-6 text-sm text-green-300 bg-gradient-to-r from-green-900/80 to-emerald-900/80 px-4 py-2 rounded-xl border border-green-500/30 shadow-lg backdrop-blur-md z-30"
        >
          ✅ Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* PDF Download Button - Bottom Center */}
      <button
        onClick={downloadAsPDF}
        disabled={isDownloading}
        className={\`fixed bottom-6 left-1/2 transform -translate-x-1/2 p-5 rounded-2xl shadow-2xl transition-all duration-300 z-50 ${
          isDownloading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-110 animate-bounce'
        } text-white`}
        title={isDownloading ? 'Generating PDF...' : 'Download as PDF'}
      >
        {isDownloading ? (
          <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-7 h-7" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        disabled={!selectedIdea}
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        onChange={handleDocumentUpload}
        className="hidden"
        disabled={!selectedIdea}
      />
    </div>
  );
};

export default RichTextEditor;