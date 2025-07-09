@@ .. @@
   const createThumbnail = async (src: string): Promise<string> => {
     return new Promise((resolve, reject) => {
-      const img = new Image();
+      // Use document.createElement instead of Image constructor
+      const img = document.createElement('img');
       
       img.onload = () => {
         const canvas = document.createElement('canvas');
@@ .. @@
   const downloadAsPDF = async () => {
     try {
       const { jsPDF } = await import('jspdf');
-      const doc = new jsPDF();
+      const doc = new jsPDF('p', 'mm', 'a4');
       
       const content = editorRef.current?.querySelector('.rich-editor');
       if (!content) return;
       
-      // Process images before adding content to PDF
-      const images = content.querySelectorAll('img');
-      for (let i = 0; i < images.length; i++) {
-        const img = images[i];
-        try {
-          const dataUrl = await createThumbnail(img.src);
-          img.setAttribute('data-pdf-src', dataUrl);
-        } catch (error) {
-          console.error("Error processing image:", error);
-        }
-      }
+      // Get the content's width and height
+      const contentWidth = content.offsetWidth;
+      const contentHeight = content.offsetHeight;
+      
+      // Calculate the PDF dimensions
+      const pdfWidth = doc.internal.pageSize.getWidth();
+      const pdfHeight = doc.internal.pageSize.getHeight();
+      
+      // Calculate the scale factor to fit content to PDF
+      const scale = Math.min(pdfWidth / contentWidth, pdfHeight / contentHeight) * 0.9;
       
       // Convert HTML content to canvas
       const { toCanvas } = await import('html-to-image');
-      const canvas = await toCanvas(content);
+      const canvas = await toCanvas(content, {
+        pixelRatio: 2,
+        skipFonts: true,
+        style: {
+          transform: 'scale(1)',
+          transformOrigin: 'top left',
+          width: `${contentWidth}px`,
+          height: `${contentHeight}px`
+        }
+      });
       
-      // Add canvas to PDF
-      const imgData = canvas.toDataURL('image/jpeg', 0.95);
-      doc.addImage(imgData, 'JPEG', 10, 10, 190, 0);
+      // Convert canvas to image data
+      const imgData = canvas.toDataURL('image/png');
+      
+      // Calculate dimensions to maintain aspect ratio
+      const scaledWidth = contentWidth * scale;
+      const scaledHeight = contentHeight * scale;
+      
+      // Add image to PDF with proper dimensions
+      doc.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight);
       
       // Save the PDF
       doc.save('document.pdf');
       
       toast({
-        title: "PDF Downloaded",
-        description: "Your document has been downloaded as a PDF.",
+        title: "Document Downloaded",
+        description: "Your document with images has been downloaded as a PDF.",
         status: "success",
         duration: 3000,
         isClosable: true,
       });
     } catch (error) {
       console.error("Error generating PDF:", error);
       toast({
         title: "Error",
         description: "Failed to generate PDF. Please try again.",
         status: "error",
         duration: 3000,
         isClosable: true,
       });
     }
   };
@@ .. @@