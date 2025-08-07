import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Link, FileText, Smile, Palette, Download, Type, ChevronDown,
  List, ListOrdered, Quote, Code, Undo, Redo, Upload, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#f9fafb');
  const [showIdeaDropdown, setShowIdeaDropdown] = useState(false);
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
          ${selectedIdea.title}
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
        const img = document.createElement('div');
        img.className = 'media-preview-container';
        img.innerHTML = `
          <img src="${event.target?.result}" style="width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 8px; cursor: pointer;" onclick="this.parentElement.parentElement.querySelector('.image-modal').style.display='flex'" />
          <button class="delete-btn" onclick="this.parentElement.remove()" title="Remove image">×</button>
          <div class="image-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; align-items: center; justify-content: center;" onclick="this.style.display='none'">
            <img src="${event.target?.result}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;" />
          </div>
        `;
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.setStartAfter(img);
          range.setEndAfter(img);
        } else if (editorRef.current) {
          editorRef.current.appendChild(img);
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
        
        // Add click handler to download
        docPreview.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).classList.contains('delete-btn')) return;
          const link = document.createElement('a');
          link.href = event.target?.result as string;
          link.download = file.name;
          link.click();
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
            img.innerHTML = `
              <img src="${event.target?.result}" style="width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 8px; cursor: pointer;" onclick="this.parentElement.parentElement.querySelector('.image-modal').style.display='flex'" />
              <button class="delete-btn" onclick="this.parentElement.remove()" title="Remove image">×</button>
              <div class="image-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; align-items: center; justify-content: center;" onclick="this.style.display='none'">
                <img src="${event.target?.result}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;" />
              </div>
            `;
            
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.insertNode(img);
              range.setStartAfter(img);
              range.setEndAfter(img);
            } else if (editorRef.current) {
              editorRef.current.appendChild(img);
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
    <div className="rich-text-editor relative min-h-screen">
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
      <div className="mb-8 relative">
        <button
          data-idea-trigger
          onClick={() => setShowIdeaDropdown(!showIdeaDropdown)}
          className="w-full p-6 bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 rounded-2xl text-left flex items-center justify-between hover:border-purple-400 hover:from-slate-700 hover:to-slate-600 transition-all duration-300 shadow-2xl hover:shadow-purple-500/20 transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-pulse">💡</div>
            <div>
              <p className="text-white font-bold text-lg">
                {selectedIdea ? selectedIdea.title : 'Select an idea to work on'}
              </p>
              {selectedIdea && (
                <div className="flex items-center gap-2 mt-1">
                  {selectedIdea.category && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-full font-bold shadow-lg">
                      {selectedIdea.category}
                    </span>
                  )}
                  {selectedIdea.isPinned && (
                    <span className="text-yellow-400 text-sm font-bold animate-pulse">📌 Pinned</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`w-6 h-6 text-purple-400 transition-transform duration-300 ${showIdeaDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showIdeaDropdown && (
          <div className="idea-dropdown absolute top-full left-0 right-0 mt-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-md">
            {ideas.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-5xl mb-4 animate-bounce">💡</div>
                <p className="text-white font-medium mb-2" style={{ color: '#ffffff !important' }}>No ideas created yet.</p>
                <p className="text-gray-400 text-sm" style={{ color: '#9ca3af !important' }}>Go to Ideas page to create your first idea!</p>
              </div>
            ) : (
              ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => {
                    onSelectIdea(idea);
                    setShowIdeaDropdown(false);
                  }}
                  className="w-full p-5 text-left hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 transition-all duration-300 border-b border-slate-700/50 last:border-b-0 flex items-center justify-between group transform hover:scale-[1.02]"
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#ffffff' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {idea.isPinned ? '📌' : '💡'}
                    </div>
                    <div>
                      <p className="font-bold text-lg transition-colors group-hover:text-purple-300" style={{ color: '#ffffff' }}>{idea.title}</p>
                      <p className="text-sm line-clamp-1 transition-colors" style={{ color: '#9ca3af' }}>{idea.description}</p>
                      {idea.category && (
                        <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-bold shadow-lg">
                          {idea.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedIdea?.id === idea.id && (
                    <div className="text-2xl font-bold animate-pulse" style={{ color: '#4ade80' }}>✓</div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="editor-toolbar bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-2 border-slate-600 rounded-t-2xl p-5 flex flex-wrap gap-4 items-center shadow-2xl backdrop-blur-md">
        {/* Text Formatting */}
        <div className="toolbar-group flex gap-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button onClick={() => execCommand('bold')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="toolbar-button hover:bg-purple-600 transition-all duration-200" title="Underline">
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
          <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-button hover:bg-green-600 transition-all duration-200" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="toolbar-button hover:bg-green-600 transition-all duration-200" title="Numbered List">
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
            title="Upload Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button 
            onClick={() => documentInputRef.current?.click()} 
            className="toolbar-button hover:bg-blue-600 transition-all duration-200" 
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={insertLink} className="toolbar-button hover:bg-blue-600 transition-all duration-200" title="Insert Link">
            <Link className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji & Stickers */}
        <div className="toolbar-group flex gap-1 relative bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button 
            data-emoji-trigger
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="toolbar-button hover:bg-yellow-600 transition-all duration-200" 
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
                          localStorage.setItem(`idea-bg-${selectedIdea.id}`, color);
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
                      localStorage.setItem(`idea-bg-${selectedIdea.id}`, e.target.value);
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
                          localStorage.setItem(`idea-text-${selectedIdea.id}`, color);
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
                      localStorage.setItem(`idea-text-${selectedIdea.id}`, e.target.value);
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
        <div className="toolbar-group bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <VoiceRecorder onTranscription={handleVoiceTranscription} />
        </div>

        {/* Save Button */}
        <div className="toolbar-group bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-2 shadow-lg">
          <button
            onClick={saveContent}
            disabled={!selectedIdea || !hasUnsavedChanges}
            className={`toolbar-button flex items-center gap-2 px-4 ${
              selectedIdea && hasUnsavedChanges
                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !selectedIdea 
                ? 'Select an idea first' 
                : !hasUnsavedChanges 
                ? 'No changes to save' 
                : 'Save changes'
            }
          >
            <span className="text-lg">💾</span>
            <span className="text-sm font-medium">Save</span>
            {hasUnsavedChanges && selectedIdea && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div className="text-sm text-green-300 bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-4 py-2 rounded-xl border border-green-500/30 shadow-lg">
            ✅ Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>
      
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

      {/* PDF Download Button - Bottom Center */}
      <button
        onClick={downloadAsPDF}
        disabled={isDownloading}
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 p-5 rounded-2xl shadow-2xl transition-all duration-300 z-50 ${
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
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        onChange={handleDocumentUpload}
        className="hidden"
      />
    </div>
  );
};

export default RichTextEditor;