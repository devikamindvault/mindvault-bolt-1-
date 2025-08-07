import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Link, Image, Upload, 
  FileText, Download, Save, Lightbulb, ChevronDown, X, Eye, EyeOff, Search
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

interface EditEntry {
  id: string;
  content: string;
  timestamp: string;
  title: string;
  description: string;
}

interface RichTextEditorProps {
  selectedIdea: Idea | null;
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'document';
  name: string;
  url: string;
  file?: File;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ selectedIdea, ideas, onSelectIdea }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalDocument, setModalDocument] = useState<MediaItem | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💡', '🎉', '🚀', '⭐', '💯', '🎯', '✨', '🌟'];

  // Load content when selectedIdea changes
  useEffect(() => {
    if (selectedIdea) {
      const savedContent = localStorage.getItem(`idea-content-${selectedIdea.id}`);
      const savedMedia = localStorage.getItem(`idea-media-${selectedIdea.id}`);
      
      if (savedContent) {
        setContent(savedContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = savedContent;
        }
      } else {
        const initialContent = `<h2>Working on: ${selectedIdea.title}</h2><p>${selectedIdea.description}</p><p><br></p>`;
        setContent(initialContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = initialContent;
        }
      }
      
      if (savedMedia) {
        try {
          setMediaItems(JSON.parse(savedMedia));
        } catch (error) {
          console.error('Error parsing saved media:', error);
          setMediaItems([]);
        }
      } else {
        setMediaItems([]);
      }
    } else {
      setContent('');
      setMediaItems([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [selectedIdea]);

  // Save content and media
  const saveContent = () => {
    if (!selectedIdea || !editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    setContent(currentContent);
    
    // Save content
    localStorage.setItem(`idea-content-${selectedIdea.id}`, currentContent);
    
    // Save media
    localStorage.setItem(`idea-media-${selectedIdea.id}`, JSON.stringify(mediaItems));
    
    // Save to edit history
    const history = getEditHistory(selectedIdea.id);
    const newEntry: EditEntry = {
      id: Date.now().toString(),
      content: currentContent,
      timestamp: new Date().toISOString(),
      title: selectedIdea.title,
      description: selectedIdea.description
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50 entries
    localStorage.setItem(`idea-history-${selectedIdea.id}`, JSON.stringify(updatedHistory));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('ideasUpdated', { detail: ideas }));
  };

  const getEditHistory = (ideaId: string): EditEntry[] => {
    const history = localStorage.getItem(`idea-history-${ideaId}`);
    return history ? JSON.parse(history) : [];
  };

  // Auto-save functionality
  useEffect(() => {
    if (!selectedIdea) return;

    const autoSave = setTimeout(() => {
      saveContent();
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [content, mediaItems, selectedIdea]);

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const formatText = (command: string, value?: string) => {
    if (!selectedIdea) return;
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const insertEmoji = (emoji: string) => {
    if (!selectedIdea) return;
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
    handleContentChange();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIdea) return;
    
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const newMediaItem: MediaItem = {
              id: Date.now().toString() + Math.random(),
              type: 'image',
              name: file.name,
              url: imageUrl,
              file: file
            };
            
            setMediaItems(prev => [...prev, newMediaItem]);
            insertImagePreview(newMediaItem);
          };
          reader.readAsDataURL(file);
        }
      });
    }
    event.target.value = '';
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIdea) return;
    
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileUrl = e.target?.result as string;
          const newMediaItem: MediaItem = {
            id: Date.now().toString() + Math.random(),
            type: 'document',
            name: file.name,
            url: fileUrl,
            file: file
          };
          
          setMediaItems(prev => [...prev, newMediaItem]);
          insertDocumentPreview(newMediaItem);
        };
        reader.readAsDataURL(file);
      });
    }
    event.target.value = '';
  };

  const insertImagePreview = (mediaItem: MediaItem) => {
    if (!editorRef.current) return;
    
    const imagePreview = document.createElement('div');
    imagePreview.className = 'image-preview-container';
    imagePreview.setAttribute('data-media-id', mediaItem.id);
    imagePreview.innerHTML = `
      <img src="${mediaItem.url}" alt="${mediaItem.name}" style="width: 200px; height: auto; max-height: 200px; object-fit: contain;" />
      <div class="image-caption">${mediaItem.name}</div>
      <button class="delete-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add click handler for preview
    const img = imagePreview.querySelector('img');
    if (img) {
      img.addEventListener('click', () => {
        setModalImageUrl(mediaItem.url);
        setShowImageModal(true);
      });
    }
    
    editorRef.current.appendChild(imagePreview);
    handleContentChange();
  };

  const insertDocumentPreview = (mediaItem: MediaItem) => {
    if (!editorRef.current) return;
    
    const docPreview = document.createElement('div');
    docPreview.className = 'document-preview-container';
    docPreview.setAttribute('data-media-id', mediaItem.id);
    docPreview.innerHTML = `
      <div class="document-preview">
        <div class="document-icon">📄</div>
        <div class="document-info">
          <div class="document-name">${mediaItem.name}</div>
          <div class="document-type">${getFileExtension(mediaItem.name).toUpperCase()} Document</div>
        </div>
      </div>
      <button class="delete-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add click handler for preview
    const preview = docPreview.querySelector('.document-preview');
    if (preview) {
      preview.addEventListener('click', () => {
        setModalDocument(mediaItem);
        setShowDocumentModal(true);
      });
    }
    
    editorRef.current.appendChild(docPreview);
    handleContentChange();
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop() || '';
  };

  const handleVoiceTranscription = (text: string) => {
    if (!selectedIdea) return;
    document.execCommand('insertText', false, text + ' ');
    handleContentChange();
  };

  const generatePreview = () => {
    if (!editorRef.current) return;
    
    let previewHtml = editorRef.current.innerHTML;
    
    // Replace media containers with proper content for preview
    const mediaContainers = editorRef.current.querySelectorAll('[data-media-id]');
    mediaContainers.forEach(container => {
      const mediaId = container.getAttribute('data-media-id');
      const mediaItem = mediaItems.find(item => item.id === mediaId);
      
      if (mediaItem) {
        if (mediaItem.type === 'image') {
          const img = container.querySelector('img');
          if (img) {
            previewHtml = previewHtml.replace(
              container.outerHTML,
              `<div class="preview-image"><img src="${mediaItem.url}" alt="${mediaItem.name}" style="max-width: 100%; height: auto;" /><p><em>Image: ${mediaItem.name}</em></p></div>`
            );
          }
        } else if (mediaItem.type === 'document') {
          previewHtml = previewHtml.replace(
            container.outerHTML,
            `<div class="preview-document"><p><strong>📄 Document: ${mediaItem.name}</strong></p></div>`
          );
        }
      }
    });
    
    setPreviewContent(previewHtml);
    setShowPreview(true);
  };

  const generatePDF = async () => {
    if (!selectedIdea || !editorRef.current) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedIdea.title, margin, yPosition);
      yPosition += 15;

      // Add description
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const descriptionLines = pdf.splitTextToSize(selectedIdea.description, pageWidth - 2 * margin);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 7 + 10;

      // Add separator
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Process content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorRef.current.innerHTML;
      
      // Process all elements
      const elements = tempDiv.children;
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        
        if (element.classList.contains('image-preview-container')) {
          // Handle images
          const mediaId = element.getAttribute('data-media-id');
          const mediaItem = mediaItems.find(item => item.id === mediaId);
          
          if (mediaItem && mediaItem.type === 'image') {
            try {
              // Add image to PDF
              const imgWidth = 150;
              const imgHeight = 100;
              
              if (yPosition + imgHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              
              pdf.addImage(mediaItem.url, 'JPEG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 5;
              
              // Add image caption
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'italic');
              pdf.text(`Image: ${mediaItem.name}`, margin, yPosition);
              yPosition += 10;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(12);
            } catch (error) {
              console.error('Error adding image to PDF:', error);
              // Add text placeholder if image fails
              pdf.text(`[Image: ${mediaItem.name}]`, margin, yPosition);
              yPosition += 10;
            }
          }
        } else if (element.classList.contains('document-preview-container')) {
          // Handle documents
          const mediaId = element.getAttribute('data-media-id');
          const mediaItem = mediaItems.find(item => item.id === mediaId);
          
          if (mediaItem && mediaItem.type === 'document') {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`📄 Document: ${mediaItem.name}`, margin, yPosition);
            yPosition += 10;
            pdf.setFont('helvetica', 'normal');
          }
        } else {
         const initialContent = `<p>${selectedIdea.description}</p><p><br></p>`;
          const textContent = element.textContent || '';
          if (textContent.trim()) {
            // Handle different text styles
            if (element.tagName === 'H1') {
              pdf.setFontSize(18);
              pdf.setFont('helvetica', 'bold');
            } else if (element.tagName === 'H2') {
              pdf.setFontSize(16);
              pdf.setFont('helvetica', 'bold');
            } else if (element.tagName === 'H3') {
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'normal');
            }
            
            const lines = pdf.splitTextToSize(textContent, pageWidth - 2 * margin);
            
            // Check if content fits on current page
            if (yPosition + (lines.length * 7) > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * 7 + 5;
          }
        }
      }

      // Add footer with timestamp
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on ${timestamp}`, margin, pageHeight - 10);

      // Save the PDF
      pdf.save(`${selectedIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Filter ideas based on search term
  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIdeaSelect = (idea: Idea) => {
    onSelectIdea(idea);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onSelectIdea(null as any);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <div className="rich-text-editor relative min-h-screen">
      <style>{`
        .rich-text-editor { padding-bottom: 80px; }
        .image-preview-container {
          display: inline-block;
          margin: 10px;
          padding: 8px;
          border: 2px solid #374151;
          border-radius: 8px;
          background: #1f2937;
          position: relative;
          max-width: 250px;
        }
        .image-preview-container img {
          display: block;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .image-preview-container img:hover {
          transform: scale(1.05);
        }
        .image-caption {
          margin-top: 5px;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
          word-break: break-word;
        }
        .document-preview-container {
          display: inline-block;
          margin: 10px;
          position: relative;
        }
        .document-preview {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #374151;
          border: 2px solid #4b5563;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }
        .document-preview:hover {
          border-color: #60a5fa;
          background: #4b5563;
        }
        .document-icon {
          font-size: 24px;
          margin-right: 12px;
        }
        .document-info {
          flex: 1;
        }
        .document-name {
          font-weight: 600;
          color: #e5e7eb;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .document-type {
          font-size: 12px;
          color: #9ca3af;
        }
        .delete-btn {
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
        }
        .delete-btn:hover {
          background: #dc2626;
        }
      `}</style>

      {/* Idea Selection Dropdown */}
      <div className="mb-6">
        <div className="relative">
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className={`w-full p-4 bg-slate-800 border-2 rounded-xl text-left flex items-center justify-between transition-all duration-300 cursor-pointer ${
              selectedIdea 
                ? 'border-purple-500 bg-gradient-to-r from-slate-800 to-purple-900/30' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowDropdown(!showDropdown);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <Lightbulb className={`w-5 h-5 ${selectedIdea ? 'text-purple-400' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedIdea ? 'text-white' : 'text-gray-400'}`}>
                {selectedIdea ? selectedIdea.title : 'Select an idea to start writing...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedIdea && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="p-1 hover:bg-red-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {showDropdown && (
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
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20"
                    autoFocus
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
                     className="w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 bg-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {idea.isPinned && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          )}
                          <div>
                            <div className="font-medium text-white">{idea.title}</div>
                            <div className="text-sm text-gray-400 line-clamp-1">{idea.description}</div>
                          </div>
                        </div>
                        {idea.category && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                            {idea.category}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    {searchTerm ? `No ideas found matching "${searchTerm}"` : 'No ideas available'}
                    <div className="text-sm mt-1">
                      {searchTerm ? 'Try different search terms' : 'Create your first idea to get started'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!selectedIdea ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-600">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-3">Select an Idea to Start Writing</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Choose an idea from the dropdown above to unlock the full text editor with all formatting tools, media uploads, and AI features.
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('switchToIdeas'));
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Browse Ideas
          </button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="editor-toolbar">
            <div className="toolbar-group">
              <button onClick={() => formatText('bold')} className="toolbar-button" title="Bold">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('italic')} className="toolbar-button" title="Italic">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('underline')} className="toolbar-button" title="Underline">
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="toolbar-group">
              <button onClick={() => formatText('insertUnorderedList')} className="toolbar-button" title="Bullet List">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('insertOrderedList')} className="toolbar-button" title="Numbered List">
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            <div className="toolbar-group">
              <select
                onChange={(e) => formatText('formatBlock', e.target.value)}
                className="toolbar-select"
                defaultValue=""
              >
                <option value="">Format</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="p">Paragraph</option>
              </select>
            </div>

            <div className="toolbar-group">
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
            </div>

            <div className="toolbar-group">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="toolbar-button"
                  title="Insert Emoji"
                >
                  😀
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <div className="emoji-grid">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => insertEmoji(emoji)}
                          className="emoji-item"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="toolbar-group">
              <VoiceRecorder onTranscription={handleVoiceTranscription} />
            </div>

            <div className="toolbar-group">
              <button onClick={generatePreview} className="toolbar-button" title="Preview">
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={generatePDF} className="toolbar-button" title="Export PDF">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            className="rich-editor"
            contentEditable
            onInput={handleContentChange}
            style={{ minHeight: '500px' }}
          />

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            multiple
            onChange={handleDocumentUpload}
            style={{ display: 'none' }}
          />

          {/* Save Button */}
          <button
            onClick={saveContent}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-40"
            title="Save Content"
          >
            <Save className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowImageModal(false)}
        >
          <div className="max-w-[90vw] max-h-[90vh] relative">
            <img 
              src={modalImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && modalDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-600">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📄</div>
                <div>
                  <h2 className="text-xl font-bold text-white">{modalDocument.name}</h2>
                  <p className="text-gray-400">{getFileExtension(modalDocument.name).toUpperCase()} Document</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-white mb-2">Document Preview</h3>
                <p className="text-gray-400 mb-4">
                  {modalDocument.name} ({getFileExtension(modalDocument.name).toUpperCase()})
                </p>
                <div className="flex gap-3 justify-center">
                  <a
                    href={modalDocument.url}
                    download={modalDocument.name}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => window.open(modalDocument.url, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;