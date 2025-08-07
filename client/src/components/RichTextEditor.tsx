import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Link, FileText, Smile, Palette, Download, Type, ChevronDown,
  List, ListOrdered, Quote, Code, Undo, Redo, Upload, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

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
  const [showIdeaDropdown, setShowIdeaDropdown] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(() => {
    return localStorage.getItem('editor-bg-color') || '#1f2937';
  });
  const [textColor, setTextColor] = useState('#ffffff');
  const [isDownloading, setIsDownloading] = useState(false);

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];

  const stickers = ['⭐', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '💡', '🔥', '💪', '👍', '✨', '🌟', '💫', '⚡', '🚀', '🎪', '🎭', '🎨', '🎵', '🎶', '❤️', '💖', '💝', '🌈', '🦄', '🌸', '🌺', '🌻', '🌷', '🌹', '💐'];

  const dailyQuotes = [
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It's going to be hard, but hard does not mean impossible.",
    "Don't wait for opportunity. Create it.",
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    "The key to success is to focus on goals, not obstacles."
  ];

  const getTodaysQuote = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return dailyQuotes[dayOfYear % dailyQuotes.length];
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
      // Load saved background for this idea or use default
      const savedBg = localStorage.getItem(`idea-bg-${selectedIdea.id}`) || backgroundColor;
      setBackgroundColor(savedBg);
      
      // Set the entire editor content to the idea template
      editorRef.current.style.backgroundColor = savedBg;
      editorRef.current.innerHTML = `
        <div style="min-height: 100vh; padding: 40px; background: ${savedBg}; color: ${textColor}; font-family: Georgia, serif; line-height: 1.8;">
          <div style="text-align: center; margin-bottom: 40px; position: relative;">
            ${selectedIdea.isPinned ? `<div style="position: absolute; top: -20px; right: 20px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1f2937; padding: 12px; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);">📌</div>` : ''}
            <h1 style="color: #a855f7; font-size: 48px; font-weight: bold; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
              💡 ${selectedIdea.title}
            </h1>
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(219, 39, 119, 0.2)); border: 2px solid #8b5cf6; border-radius: 20px; padding: 30px; margin: 30px 0; backdrop-filter: blur(10px);">
              <p style="font-size: 24px; font-style: italic; color: #e2e8f0; margin: 0; line-height: 1.6;">
                "${selectedIdea.description}"
              </p>
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin: 30px 0;">
              ${selectedIdea.category ? `<span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">📂 ${selectedIdea.category}</span>` : ''}
              ${selectedIdea.deadline ? `<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">📅 ${new Date(selectedIdea.deadline).toLocaleDateString()}</span>` : ''}
              <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">✨ Created ${new Date(selectedIdea.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="border-top: 3px solid #8b5cf6; padding-top: 40px; margin-top: 40px;">
            <h2 style="color: #a855f7; font-size: 32px; margin: 0 0 30px 0; text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
              📝 Development Workspace
            </h2>
            
            <div style="background: rgba(139, 92, 246, 0.1); border-left: 5px solid #8b5cf6; padding: 25px; margin: 25px 0; border-radius: 10px;">
              <h3 style="color: #c084fc; font-size: 24px; margin: 0 0 15px 0;">🎯 Project Goals:</h3>
              <ul style="color: #e2e8f0; font-size: 18px; line-height: 1.8; padding-left: 30px;">
                <li style="margin-bottom: 10px;">What makes this idea unique and valuable?</li>
                <li style="margin-bottom: 10px;">What resources and skills do you need?</li>
                <li style="margin-bottom: 10px;">What are the key milestones and next steps?</li>
              </ul>
            </div>
            
            <div style="margin: 40px 0;">
              <h3 style="color: #c084fc; font-size: 24px; margin: 0 0 20px 0;">💭 Your Thoughts & Progress:</h3>
              <div style="min-height: 200px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border: 1px dashed #8b5cf6;">
                <p style="color: #d1d5db; font-size: 18px; margin: 0;">Start writing your thoughts, plans, research, and progress updates here...</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
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
    <div className="rich-text-editor relative">
      {/* Daily Quote */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💭</div>
          <div>
            <p className="text-indigo-200 font-medium italic text-lg leading-relaxed">
              "{getTodaysQuote()}"
            </p>
            <p className="text-indigo-400 text-sm mt-2">Daily Inspiration</p>
          </div>
        </div>
      </div>

      {/* Idea Selection Dropdown */}
      <div className="mb-6 relative">
        <button
          data-idea-trigger
          onClick={() => setShowIdeaDropdown(!showIdeaDropdown)}
          className="w-full p-4 bg-slate-800 border border-slate-600 rounded-xl text-left flex items-center justify-between hover:border-purple-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-white font-medium">
                {selectedIdea ? selectedIdea.title : 'Select an idea to work on'}
              </p>
              {selectedIdea && (
                <p className="text-gray-400 text-sm">{selectedIdea.category}</p>
              )}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showIdeaDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showIdeaDropdown && (
          <div className="idea-dropdown absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
            {ideas.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>No ideas created yet.</p>
                <p className="text-sm">Go to Ideas page to create your first idea!</p>
              </div>
            ) : (
              ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => {
                    onSelectIdea(idea);
                    localStorage.setItem('editor-bg-color', color);
                    if (selectedIdea) {
                      localStorage.setItem(`idea-bg-${selectedIdea.id}`, color);
                    }
                    setShowIdeaDropdown(false);
                  }}
                  className="w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {idea.isPinned ? '📌' : '💡'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{idea.title}</p>
                      <p className="text-gray-400 text-sm line-clamp-1">{idea.description}</p>
                      {idea.category && (
                        <span className="inline-block mt-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                          {idea.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedIdea?.id === idea.id && (
                    <div className="text-green-400">✓</div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="editor-toolbar bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-t-xl p-4 flex flex-wrap gap-3 items-center shadow-lg">
        {/* Text Formatting */}
        <div className="toolbar-group flex gap-1 bg-slate-700 rounded-lg p-1">
          <button onClick={() => execCommand('bold')} className="toolbar-button" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="toolbar-button" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="toolbar-button" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="toolbar-group flex gap-1 bg-slate-700 rounded-lg p-1">
          <button onClick={() => execCommand('justifyLeft')} className="toolbar-button" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="toolbar-button" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="toolbar-button" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group flex gap-1 bg-slate-700 rounded-lg p-1">
          <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-button" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="toolbar-button" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="toolbar-group bg-slate-700 rounded-lg p-1">
          <select 
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="toolbar-select bg-slate-600 text-white border-0 rounded px-3 py-1 text-sm font-medium"
          >
            <option value="1">Small</option>
            <option value="3" selected>Normal</option>
            <option value="5">Large</option>
            <option value="7">Extra Large</option>
          </select>
        </div>

        {/* Media */}
        <div className="toolbar-group flex gap-1 bg-slate-700 rounded-lg p-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="toolbar-button" 
            title="Upload Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button 
            onClick={() => documentInputRef.current?.click()} 
            className="toolbar-button" 
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={insertLink} className="toolbar-button" title="Insert Link">
            <Link className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji & Stickers */}
        <div className="toolbar-group flex gap-1 relative bg-slate-700 rounded-lg p-1">
          <button 
            data-emoji-trigger
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="toolbar-button" 
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {showEmojiPicker && (
            <div className="emoji-picker absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl p-4 z-50 w-96 shadow-2xl">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Emojis
                </h4>
                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  ⭐ Stickers
                </h4>
                <div className="grid grid-cols-8 gap-1">
                  {stickers.map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(sticker)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-lg transition-colors"
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
        <div className="toolbar-group flex gap-1 relative bg-slate-700 rounded-lg p-1">
          <button 
            data-color-trigger
            onClick={() => setShowColorPicker(!showColorPicker)} 
            className="toolbar-button" 
            title="Colors & Themes"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {showColorPicker && (
            <div className="color-picker absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl p-4 z-50 w-64 shadow-2xl">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Background Color</label>
                <div className="flex gap-2 mb-2">
                  {['#1f2937', '#0f172a', '#374151', '#1e293b', '#312e81', '#581c87'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setBackgroundColor(color);
                        if (editorRef.current) {
                          editorRef.current.style.backgroundColor = color;
                        }
                      }}
                      className="w-8 h-8 rounded-lg border-2 border-slate-600 hover:border-white transition-colors"
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
                      }
                      // Update the entire content background
                      const contentDiv = editorRef.current.querySelector('div[style*="min-height: 100vh"]');
                      if (contentDiv) {
                        (contentDiv as HTMLElement).style.background = color;
                      }
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Text Color</label>
                <div className="flex gap-2 mb-2">
                  {['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8', '#60a5fa', '#a855f7'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setTextColor(color);
                        execCommand('foreColor', color);
                      }}
                      className="w-8 h-8 rounded-lg border-2 border-slate-600 hover:border-white transition-colors"
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
                  }}
                  className="w-full h-10 rounded-lg border border-slate-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="toolbar-group flex gap-1 bg-slate-700 rounded-lg p-1">
          <button onClick={() => execCommand('undo')} className="toolbar-button" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('redo')} className="toolbar-button" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        className="rich-editor min-h-[600px] border border-slate-600 border-t-0 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all overflow-auto"
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
            <h3 style={{ color: '#a855f7', fontSize: '24px', marginBottom: '16px' }}>✨ Welcome to Mind Vault</h3>
            <p>Select an idea from the Ideas page to start developing it, or begin writing your thoughts here...</p>
            <br />
            <p>💡 <strong>Tip:</strong> Use the toolbar above to format text, add images, upload documents, and customize your workspace!</p>
          </div>
        )}
      </div>

      {/* PDF Download Button - Fixed Position */}
      <button
        onClick={downloadAsPDF}
        disabled={isDownloading}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 ${
          isDownloading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-110'
        } text-white`}
        title={isDownloading ? 'Generating PDF...' : 'Download as PDF'}
      >
        {isDownloading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-6 h-6" />
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