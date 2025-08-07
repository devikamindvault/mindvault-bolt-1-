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
  const [documentModalContent, setDocumentModalContent] = useState('');
  const [documentModalTitle, setDocumentModalTitle] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalDocument, setModalDocument] = useState<MediaItem | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Load ideas from localStorage on component mount and listen for updates
  useEffect(() => {
    const handleIdeasUpdate = () => {
      // This will trigger a re-render with updated ideas from props
      // The ideas prop is already being updated by the parent App component
    };

    // Listen for ideas updates from Ideas page
    window.addEventListener('ideasUpdated', handleIdeasUpdate);
    window.addEventListener('storage', handleIdeasUpdate);

    return () => {
      window.removeEventListener('ideasUpdated', handleIdeasUpdate);
      window.removeEventListener('storage', handleIdeasUpdate);
    };
  }, []);
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💡', '🎉', '🚀', '⭐', '💯', '🎯', '✨', '🌟'];

  // Load content when selectedIdea changes
  useEffect(() => {
    if (selectedIdea) {
      const loadContent = async () => {
        const savedContent = localStorage.getItem(`idea-content-${selectedIdea.id}`);
        
        if (savedContent) {
          setContent(savedContent);
          if (editorRef.current) {
            editorRef.current.innerHTML = savedContent;
          }
        } else {
          const initialContent = `<p>${selectedIdea.description}</p><p><br></p>`;
          setContent(initialContent);
          if (editorRef.current) {
            editorRef.current.innerHTML = initialContent;
          }
        }
        
        // Load media from IndexedDB
        try {
          const mediaFromDB = await loadMediaFromIndexedDB(selectedIdea.id);
          setMediaItems(mediaFromDB);
        } catch (error) {
          console.error('Error loading media:', error);
          setMediaItems([]);
        }
      };
      
      loadContent();
    } else {
      setContent('');
      setMediaItems([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
    
    // Add event listener for content changes
    const handleContentChanged = () => {
      if (editorRef.current) {
        handleContentChange();
      }
    };
    
    window.addEventListener('contentChanged', handleContentChanged);
    
    return () => {
      window.removeEventListener('contentChanged', handleContentChanged);
    };
  }, [selectedIdea]);

  // Save content and media
  const saveContent = async () => {
    if (!selectedIdea || !editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    setContent(currentContent);
    
    try {
      // Save content
      localStorage.setItem(`idea-content-${selectedIdea.id}`, currentContent);
      
      // Store large media files in IndexedDB
      await saveMediaToIndexedDB(selectedIdea.id, mediaItems);
      
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Consider reducing file sizes or number of files.');
        alert('Storage limit reached. Please reduce the number or size of uploaded files.');
      } else {
        console.error('Error saving content:', error);
      }
    }
    
    // Save to edit history
    try {
      const history = await getEditHistory(selectedIdea.id);
      const newEntry: EditEntry = {
        id: Date.now().toString(),
        content: currentContent,
        timestamp: new Date().toISOString(),
        title: selectedIdea.title,
        description: selectedIdea.description
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50 entries
      await saveHistoryToIndexedDB(selectedIdea.id, updatedHistory);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded for history. Consider reducing content size.');
        alert('Storage limit reached for edit history. Please reduce content size.');
      } else {
        console.error('Error saving history:', error);
      }
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('ideasUpdated', { detail: ideas }));
  };

  // IndexedDB functions for storing large media files
  const saveMediaToIndexedDB = async (ideaId: string, mediaItems: MediaItem[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IdeaMediaDB', 3);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        
        // Clear existing media for this idea
        const clearRequest = store.delete(`idea-${ideaId}`);
        
        clearRequest.onsuccess = () => {
          // Store new media data
          const mediaData = {
            id: `idea-${ideaId}`,
            items: mediaItems
          };
          const addRequest = store.add(mediaData);
          
          addRequest.onsuccess = () => {
            resolve();
          };
          
          addRequest.onerror = () => {
            reject(addRequest.error);
          };
        };
        
        clearRequest.onerror = () => {
          reject(clearRequest.error);
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  };

  const loadMediaFromIndexedDB = async (ideaId: string): Promise<MediaItem[]> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('IdeaMediaDB', 3);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['media'], 'readonly');
          const store = transaction.objectStore('media');
          const getRequest = store.get(`idea-${ideaId}`);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(getRequest.result.items);
            } else {
              resolve([]);
            }
          };
          
          getRequest.onerror = () => {
            resolve([]);
          };
        };
        
        request.onerror = () => {
          resolve([]);
        };
      } catch (error) {
        console.error('Error loading from IndexedDB:', error);
        resolve([]);
      }
    });
  };

  const saveHistoryToIndexedDB = async (ideaId: string, history: EditEntry[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IdeaMediaDB', 3);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        const historyData = {
          id: `idea-${ideaId}`,
          entries: history
        };
        
        // Use put to update existing or create new
        const putRequest = store.put(historyData);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = () => {
          reject(putRequest.error);
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  };

  const loadHistoryFromIndexedDB = async (ideaId: string): Promise<EditEntry[]> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('IdeaMediaDB', 3);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['history'], 'readonly');
          const store = transaction.objectStore('history');
          const getRequest = store.get(`idea-${ideaId}`);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(getRequest.result.entries);
            } else {
              // Try to migrate from localStorage if exists
              const legacyHistory = localStorage.getItem(`idea-history-${ideaId}`);
              if (legacyHistory) {
                try {
                  const parsed = JSON.parse(legacyHistory);
                  // Save to IndexedDB and remove from localStorage
                  saveHistoryToIndexedDB(ideaId, parsed);
                  localStorage.removeItem(`idea-history-${ideaId}`);
                  resolve(parsed);
                } catch (e) {
                  resolve([]);
                }
              } else {
                resolve([]);
              }
            }
          };
          
          getRequest.onerror = () => {
            resolve([]);
          };
        };
        
        request.onerror = () => {
          resolve([]);
        };
      } catch (error) {
        console.error('Error loading history from IndexedDB:', error);
        resolve([]);
      }
    });
  };

  const getEditHistory = async (ideaId: string): Promise<EditEntry[]> => {
    return await loadHistoryFromIndexedDB(ideaId);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!selectedIdea) return;

    const autoSave = setTimeout(async () => {
      await saveContent();
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
        // Check file size (limit to 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          alert(`Image "${file.name}" is too large. Please use images smaller than 5MB.`);
          return;
        }
        
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
        // Check file size (limit to 10MB per document)
        if (file.size > 10 * 1024 * 1024) {
          alert(`Document "${file.name}" is too large. Please use documents smaller than 10MB.`);
          return;
        }
        
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
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'media-container';
    imageContainer.contentEditable = 'false';
    imageContainer.setAttribute('data-media-id', mediaItem.id);
    
    imageContainer.innerHTML = `
      <div class="image-preview">
        <img src="${mediaItem.url}" alt="${mediaItem.name}" style="max-width: 300px; max-height: 200px; width: auto; height: auto; display: block; margin: 0 auto; object-fit: contain;" />
        <div class="media-caption">${mediaItem.name}</div>
        <button class="media-delete-btn" onclick="this.parentElement.parentElement.remove(); window.dispatchEvent(new Event('contentChanged'));">×</button>
      </div>
    `;
    
    // Add click handler for preview
    const img = imageContainer.querySelector('img');
    if (img) {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setModalImageUrl(mediaItem.url);
        setShowImageModal(true);
      });
    }
    
    // Insert at the end of editor content
    const br1 = document.createElement('br');
    const br2 = document.createElement('br');
    editorRef.current.appendChild(br1);
    editorRef.current.appendChild(imageContainer);
    editorRef.current.appendChild(br2);
    
    // Create a new paragraph for continued typing
    const newParagraph = document.createElement('p');
    newParagraph.innerHTML = '<br>';
    editorRef.current.appendChild(newParagraph);
    
    // Focus back to editor
    editorRef.current.focus();
    
    // Set cursor to the new paragraph
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(newParagraph, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    handleContentChange();
  };

  const insertDocumentPreview = (mediaItem: MediaItem) => {
    if (!editorRef.current) return;
    
    // Create document container
    const docContainer = document.createElement('div');
    docContainer.className = 'media-container';
    docContainer.contentEditable = 'false';
    docContainer.setAttribute('data-media-id', mediaItem.id);
    
    docContainer.innerHTML = `
      <div class="document-preview">
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <div class="doc-name">${mediaItem.name}</div>
          <div class="doc-type">${getFileExtension(mediaItem.name).toUpperCase()} Document</div>
        </div>
        <button class="media-delete-btn" onclick="this.parentElement.parentElement.remove(); window.dispatchEvent(new Event('contentChanged'));">×</button>
      </div>
    `;
    
    // Add click handler
    const preview = docContainer.querySelector('.document-preview');
    if (preview) {
      preview.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setModalDocument(mediaItem);
        setShowDocumentModal(true);
      });
    }
    
    // Insert at the end of editor content
    const br1 = document.createElement('br');
    const br2 = document.createElement('br');
    editorRef.current.appendChild(br1);
    editorRef.current.appendChild(docContainer);
    editorRef.current.appendChild(br2);
    
    // Create a new paragraph for continued typing
    const newParagraph = document.createElement('p');
    newParagraph.innerHTML = '<br>';
    editorRef.current.appendChild(newParagraph);
    
    // Focus back to editor
    editorRef.current.focus();
    
    // Set cursor to the new paragraph
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(newParagraph, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    handleContentChange();
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop() || '';
  };
  
  // Make images resizable like Google Docs
  const makeImageResizable = (img: HTMLImageElement, container: HTMLElement) => {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    const resizeHandle = container.querySelector('.resize-se') as HTMLElement;
    if (!resizeHandle) return;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(window.getComputedStyle(img).width, 10);
      startHeight = parseInt(window.getComputedStyle(img).height, 10);
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      
      // Add resizing class for visual feedback
      container.classList.add('resizing');
    });
    
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Maintain aspect ratio
      const aspectRatio = startWidth / startHeight;
      let newWidth = startWidth + deltaX;
      
      // Set minimum and maximum sizes
      newWidth = Math.max(100, Math.min(800, newWidth));
      const newHeight = newWidth / aspectRatio;
      
      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
    };
    
    const stopResize = () => {
      isResizing = false;
      container.classList.remove('resizing');
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      handleContentChange();
    };
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
              // Calculate image dimensions to fit page
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = 120;
              
              // Create image element to get dimensions
              const img = new Image();
              img.src = mediaItem.url;
              
              await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });
              
              let imgWidth = img.naturalWidth || maxWidth;
              let imgHeight = img.naturalHeight || maxHeight;
              
              // Scale image to fit
              const aspectRatio = imgWidth / imgHeight;
              if (imgWidth > maxWidth) {
                imgWidth = maxWidth;
                imgHeight = imgWidth / aspectRatio;
              }
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * aspectRatio;
              }
              
              if (yPosition + imgHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              
              // Add image to PDF
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
            // Add document icon and info
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`📄 Document Attached:`, margin, yPosition);
            yPosition += 8;
            
            pdf.setFont('helvetica', 'normal');
            pdf.text(`• File Name: ${mediaItem.name}`, margin + 5, yPosition);
            yPosition += 6;
            pdf.text(`• File Type: ${getFileExtension(mediaItem.name).toUpperCase()}`, margin + 5, yPosition);
            yPosition += 6;
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text(`(Document content not embedded - download separately)`, margin + 5, yPosition);
            yPosition += 12;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
          }
        } else {
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
            } else if (element.tagName === 'UL' || element.tagName === 'OL') {
              // Handle lists
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'normal');
              const listItems = element.querySelectorAll('li');
              listItems.forEach((li, index) => {
                const bullet = element.tagName === 'UL' ? '• ' : `${index + 1}. `;
                const lines = pdf.splitTextToSize(bullet + (li.textContent || ''), pageWidth - 2 * margin - 10);
                
                if (yPosition + (lines.length * 7) > pageHeight - margin) {
                  pdf.addPage();
                  yPosition = margin;
                }
                
                pdf.text(lines, margin + 10, yPosition);
                yPosition += lines.length * 7 + 2;
              });
              continue;
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

      // Add media summary at the end
      if (mediaItems.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }
        
        yPosition += 10;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Media Summary', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const images = mediaItems.filter(item => item.type === 'image');
        const documents = mediaItems.filter(item => item.type === 'document');
        
        if (images.length > 0) {
          pdf.text(`Images (${images.length}):`, margin, yPosition);
          yPosition += 6;
          images.forEach(img => {
            pdf.text(`• ${img.name}`, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
        
        if (documents.length > 0) {
          pdf.text(`Documents (${documents.length}):`, margin, yPosition);
          yPosition += 6;
          documents.forEach(doc => {
            pdf.text(`• ${doc.name} (${getFileExtension(doc.name).toUpperCase()})`, margin + 5, yPosition);
            yPosition += 5;
          });
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
            className="fixed bottom-6 right-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-40"
            title="Save Content"
          >
            <Save className="w-6 h-6" />
          </button>

          {/* PDF Download Button */}
          <button
            onClick={generatePDF}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-40"
            title="Download as PDF"
          >
            <Download className="w-6 h-6" />
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
                    View
                  </button>
                  <button
                    onClick={() => {
                      try {
                        // Create a temporary link element for download
                        const link = document.createElement('a');
                        link.href = modalDocument.url;
                        link.download = modalDocument.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (error) {
                        console.error('Error opening document:', error);
                        alert('Unable to open document. Please try downloading it instead.');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Open File
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