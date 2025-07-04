import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Search } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import type { Transcription } from "@shared/schema";

export function TranscriptionDownloader() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: transcriptions } = useQuery<Transcription[]>({
  });

  const handleSearch = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Define icons at the component level
  const IMAGE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA+0lEQVR4nO2UMQ6CMBiFf40ncOIKOjp6CeNBPIJ6A93UwcWDeBJWnZxMdDQYtgYICRKG9xpaaEopYHDxJV8C6Xv/17wWvWvyAEPIBXRDVgDnqkCEbCTwB1QmQSWwEWCH0ArEj8DTwnaCnxZvJGgR+AkQXPgKsHxO/FXKS6AswTcgQg4SPLEniwWkTXQk4SJnMBjEc2AtFc8FtFSNteTpE/uIppL8gbopbgrHshGHhK8A9Ym4gBoJLmS5JGcr2USHySglePyM6BzASK5WUeV7JhqrQvQl9U9TXAj08Q+QB84SsKPlqiVY5vLJpYDOxHFX4krL/IPegKg7qc1zrebellQAAAABJRU5ErkJggg==";
  const DOC_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO2UQQ6CMBBFf40ncOIKOjrqJYwH4QjqDXRTBxcP4klYdXIy0dFgoKVpSAgJQ/8YoKWUAQYXX/KShmbe79Aw0L96cgAeQCKiG7AGXFMFQmAnwTugNAksgYsEP4BGJH4GnhK0EfiyeCNBe+AkQXPgKsHRO/FXKS6AswTcgRA4SPLYniwSkTXQk4SJHP+jiGbAVEQzEU0keVcldwE6SXSW4B3QmoiHspHEIppL8Ku4Kx7IRh4SvAPWJuIAqCW5kuShnK9lEh8koJHj8jOgcwEiuVlHleyYaq0L0JfVPU1wI9PEPkAfOErCj5aokWObyya+7qc1zrebellQAAAABJRU5ErkJggg==";

  // Placeholder image for fallbacks
  const PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NUFDRjg3OTZGNTlDMTFFOEJFQTZFMjI1RDk3NDM3QUMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NUFDRjg3OTdGNTlDMTFFOEJFQTZFMjI1RDk3NDM3QUMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1QUNGODc5NEY1OUMxMUU4QkVBNkUyMjVEOTc0MzdBQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1QUNGODc5NUY1OUMxMUU4QkVBNkUyMjVEOTc0MzdBQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pne+/t8AAA/4SURBVHja7FwHlBVF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";

  // Helper function to create thumbnails with improved error handling
  const createThumbnail = async (url: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!url) {
        console.log("No URL provided for thumbnail");
        return resolve(PLACEHOLDER_IMAGE); // Fallback for missing URL
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Set timeout to handle hanging image loads
      const timeout = setTimeout(() => {
        console.log("Creating thumbnail for:", url);
        console.log("Image load timed out");
        resolve(PLACEHOLDER_IMAGE);
      }, 3000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Canvas logic for resizing
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.log("Could not get canvas context");
            return resolve(PLACEHOLDER_IMAGE);
          }
          
          // Calculate dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85)); // Better quality
        } catch (error) {
          console.log("Error processing image for PDF:", error);
          resolve(PLACEHOLDER_IMAGE); // Fallback on error
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.log("Error loading image:", url);
        resolve(PLACEHOLDER_IMAGE);
      };

      // Add cache-busting to avoid CORS issues with cached images
      img.src = url.includes("?") ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;
    });
  };

  const handleMediaElement = async (
    element: HTMLElement,
    doc: jsPDF,
    position: { y: number },
    margin: number,
    pageHeight: number
  ) => {
    const isImage = element.hasAttribute('data-type') 
      ? element.getAttribute('data-type') === 'image'
      : element.tagName.toLowerCase() === 'img';
    let url = element.getAttribute('data-url') || element.getAttribute('src') || element.getAttribute('href');
    let title = element.getAttribute('data-title') || element.textContent || '';
    if (!title && url) {
      title = decodeURIComponent(url.split('/').pop() || '');
    }
    const size = element.getAttribute('data-size');

    const ICON_SIZE = isImage ? 30 : 15;
    const TEXT_OFFSET = isImage ? 35 : 20;

    // Ensure URL is absolute for PDF compatibility
    if (url && !url.startsWith('http')) {
      url = new URL(url, window.location.origin).href;
    }

    try {
      if (isImage && url) {
        // Create thumbnail for the image
        const thumbnail = await createThumbnail(url, 100, 100);
        
        // Add image to PDF
        doc.addImage(thumbnail, 'JPEG', margin, position.y, ICON_SIZE, ICON_SIZE);
        
        // Make the image clickable with absolute URL
        doc.link(margin, position.y, ICON_SIZE, ICON_SIZE, { url });
        
        // Add preview text for image with visual indicators
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 255); // Blue for clickable text
        doc.text("🔗 Click to preview", margin, position.y + ICON_SIZE + 5);
        
        // Add underline for link text
        doc.setLineWidth(0.1);
        doc.line(margin, position.y + ICON_SIZE + 6, margin + doc.getTextWidth("🔗 Click to preview"), position.y + ICON_SIZE + 6);
        
        doc.setTextColor(0, 0, 0); // Reset text color
      } else if (url) {
        // Add document icon
        doc.addImage(DOC_ICON, 'PNG', margin, position.y, ICON_SIZE, ICON_SIZE);
        
        // Make the document icon clickable
        doc.link(margin, position.y, ICON_SIZE, ICON_SIZE, { url });
        
        // Add preview text for document with visual indicators
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 255); // Blue for clickable text
        doc.text("🔗 Click to open", margin, position.y + ICON_SIZE + 5);
        
        // Add underline for link text
        doc.setLineWidth(0.1);
        doc.line(margin, position.y + ICON_SIZE + 6, margin + doc.getTextWidth("🔗 Click to open"), position.y + ICON_SIZE + 6);
        
        doc.setTextColor(0, 0, 0); // Reset text color
      }
    } catch (error) {
      console.error('Error processing media:', error);
      const fallbackIcon = isImage ? IMAGE_ICON : DOC_ICON;
      doc.addImage(fallbackIcon, 'PNG', margin, position.y, ICON_SIZE, ICON_SIZE);
      
      // Add error message
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(8);
      doc.text(`[ERROR: Media could not be loaded]`, margin, position.y + ICON_SIZE + 5);
      doc.setTextColor(0, 0, 0);
    }

    // Add clickable title with visual indicators
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 255);
    doc.text(title, margin + TEXT_OFFSET, position.y + (ICON_SIZE/2), {
      baseline: 'middle'
    });
    
    // Make title text clickable - using a wider area for better click target
    if (url) {
      const titleWidth = doc.getTextWidth(title);
      doc.link(margin + TEXT_OFFSET - 2, position.y - 2, titleWidth + 4, ICON_SIZE + 4, { url });
      
      // Add underline for better visibility of clickable area
      doc.setLineWidth(0.1);
      doc.line(margin + TEXT_OFFSET, position.y + (ICON_SIZE/2) + 2, margin + TEXT_OFFSET + titleWidth, position.y + (ICON_SIZE/2) + 2);
    }
    
    doc.setTextColor(0, 0, 0);

    // Add size information
    if (size) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const sizeText = `${Math.round(parseInt(size) / 1024)} KB`;
      doc.text(sizeText, margin + TEXT_OFFSET, position.y + ICON_SIZE - 2);
    }

    // Set PDF properties for better viewer compatibility
    doc.setProperties({
      title: "Transcription with clickable media",
      subject: "Interactive PDF with clickable media elements",
      creator: "Requires Adobe Acrobat or Chrome PDF viewer",
    });

    position.y += ICON_SIZE + 10;

    if (position.y > pageHeight - margin) {
      doc.addPage();
      position.y = 20;
    }
  };

  const downloadFilteredTranscriptions = async () => {
    if (!transcriptions?.length) return;

    const filteredTranscriptions = transcriptions.filter(t => {
      const transcriptionDate = new Date(t.createdAt || new Date());
      if (startDate && endDate) {
        return transcriptionDate >= startDate && transcriptionDate <= endDate;
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt || new Date());
      const dateB = new Date(b.createdAt || new Date());
      return dateA.getTime() - dateB.getTime();
    });

    if (filteredTranscriptions.length === 0) {
      alert("No transcriptions found in the selected date range");
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    for (const t of filteredTranscriptions) {
      const date = t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : 'No date';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = t.content || '';

      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(date, margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textContent = t.content?.replace(/<[^>]+>/g, '').trim() || '';
      const textLines = doc.splitTextToSize(textContent, 170);
      textLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Use Array.from to convert NodeList to array for compatibility
      const mediaElements = Array.from(tempDiv.querySelectorAll('span[data-preview]'));
      for (const element of mediaElements) {
        const type = element.getAttribute('data-type');
        let url = element.getAttribute('data-url');
        const title = element.getAttribute('data-title') || '';
        const size = element.getAttribute('data-size') || '';

        if (yPosition + 40 > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
        }

        // Ensure URL is absolute for PDF compatibility
        if (url && !url.startsWith('http')) {
          url = new URL(url, window.location.origin).href;
        }

        try {
          if (type === 'image' && url) {
            // Create thumbnail
            const thumbnail = await createThumbnail(url, 100, 100);
            
            // Add image with higher quality and bigger size for better visibility
            doc.addImage(thumbnail, 'JPEG', margin, yPosition, 30, 30);
            
            // Make image clickable with absolute URL
            doc.link(margin, yPosition, 30, 30, { url });
            
            // Add visual indicator for clickable content
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 255); // Blue for clickable text
            doc.text("🔗 Click to view full image", margin + 35, yPosition + 20);
            
            // Add underline for better visibility
            doc.setLineWidth(0.1);
            doc.line(margin + 35, yPosition + 21, margin + 35 + doc.getTextWidth("🔗 Click to view full image"), yPosition + 21);
            
            doc.setTextColor(0, 0, 0); // Reset text color
          } else if (url) {
            // Add document icon
            doc.addImage(DOC_ICON, 'PNG', margin, yPosition, 15, 15);
            
            // Make icon clickable
            doc.link(margin, yPosition, 15, 15, { url });
            
            // Add visual indicator for clickable document
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 255); // Blue for clickable text
            doc.text("🔗 Click to open document", margin + 20, yPosition + 20);
            
            // Add underline for better visibility
            doc.setLineWidth(0.1);
            doc.line(margin + 20, yPosition + 21, margin + 20 + doc.getTextWidth("🔗 Click to open document"), yPosition + 21);
            
            doc.setTextColor(0, 0, 0); // Reset text color
          }
        } catch (error) {
          console.error('Error loading media:', error);
          const fallbackIcon = type === 'image' ? IMAGE_ICON : DOC_ICON;
          doc.addImage(fallbackIcon, 'PNG', margin, yPosition, 15, 15);
          
          // Add error message
          doc.setTextColor(255, 0, 0);
          doc.setFontSize(8);
          doc.text(`[ERROR: Media could not be loaded]`, margin, yPosition + 25);
          doc.setTextColor(0, 0, 0);
        }

        // Add title as clickable text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 255); // Blue color for clickable title
        doc.text(title, margin + (type === 'image' ? 35 : 20), yPosition + 5);
        
        // Make title clickable with wider area
        if (url) {
          const titleX = margin + (type === 'image' ? 35 : 20);
          const titleWidth = doc.getTextWidth(title);
          doc.link(titleX - 2, yPosition, titleWidth + 4, 15, { url });
          
          // Add underline for title
          doc.setLineWidth(0.1);
          doc.line(titleX, yPosition + 7, titleX + titleWidth, yPosition + 7);
        }
        
        doc.setTextColor(0, 0, 0); // Reset text color

        // Add size information
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const sizeText = size ? `${Math.round(parseInt(size) / 1024)} KB` : '';
        doc.text(sizeText, margin + (type === 'image' ? 35 : 20), yPosition + 12);

        yPosition += 35;
      }
      
      // Set PDF properties for better viewer compatibility
      doc.setProperties({
        title: "Transcriptions with clickable media",
        subject: "Interactive PDF with clickable media elements",
        creator: "Requires Adobe Acrobat or Chrome PDF viewer",
      });

      yPosition += lineHeight * 2;
    }

    doc.save('transcriptions.pdf');
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {startDate ? format(startDate, 'PP') : 'Start Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {endDate ? format(endDate, 'PP') : 'End Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button onClick={handleSearch} variant="outline">
        <Search className="w-4 h-4" />
      </Button>

      <Button onClick={downloadFilteredTranscriptions}>
        <Download className="w-4 h-4 mr-2" />
        Download Transcriptions
      </Button>
    </div>
  );
}