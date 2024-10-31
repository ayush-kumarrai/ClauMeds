import React, { useState } from 'react';
import './App.css'; // Adjust the path as necessary


const MedicalReportAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Updated API configuration with new model
  const API_KEY = 'AIzaSyBMf2LoAeGhHBcWFrEsgg1sdlopHphPmsQ';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

  const styles = {
    container: {
        maxWidth: '600px',
        margin: '20px auto',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Solid blackish color with opacity
        backdropFilter: 'blur(10px)', // Glass effect
        WebkitBackdropFilter: 'blur(10px)', // Vendor prefix for compatibility
        borderRadius: '20px', // Rounded corners
        border: '1px solid rgba(255, 255, 255, 0.18)', // Light border
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // Shadow effect
      }
      
      ,
    uploadArea: {
      border: '2px dashed #cccccc',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
    },
    preview: {
      maxHeight: '250px',
      borderRadius: '8px',
      maxWidth: '100%',
      objectFit: 'contain'
    },
    button: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    errorMessage: {
      color: 'red',
      marginBottom: '10px',
    },
    analysisCard: {
      border: '6px solid #e0e0e0',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px',
    }, 
  };

  const getVerificationStatus = (analysis) => {
    if (analysis.includes("Accepted")) {
      return { message: "Verified", color: "green" };
    } else if (analysis.includes("Rejected")) {
      return { message: "Not Verified", color: "red" };
    } else {
      return { message: "Not Confirmed", color: "orange" };
    }
  }; 
  

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload an image (JPEG, PNG) or PDF file');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size should be less than 5MB');
    }
  };

  const handleFileChange = async (e) => {
    try {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      validateFile(selectedFile);
      setFile(selectedFile);
      setError(null);

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      }
      else if (selectedFile.type === 'application/pdf') {
        // Handle PDF file preview
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result); // Set preview to Base64 string
        reader.readAsDataURL(selectedFile);
      } 
       else {
        setPreview(null);
      }
    } catch (err) {
      setError(err.message);
      setFile(null);
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange({ target: { files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default to allow drop
  };

  const analyzeReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];

        try {
          // Construct full URL with API key as a query parameter
          const fullUrl = `${API_URL}?key=${API_KEY}`;

          const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: "Analyze this medical document thoroughly. Provide a comprehensive yet concise medical report assessment including:"
                    + "\n1. Document Type Identification"
                    + "\n2. Comprehensive Key Findings"
                    + "\n3. Detailed Abnormal Value Analysis"
                    + "\n4. Specific Recommendations for Next Steps"
                    + "\n5. Classification as 'Accepted', 'Rejected', or 'Not Confirmed' based on validity:"
      + "\n   - Accepted: If it is a valid medical report"
      + "\n   - Rejected: If it is not a valid medical report or not verified, then dont give any above detail just write something like not a medical report"
      + "\n   - Not Confirmed: If validity is indeterminate,"
      + "\n\nNote: Provide professional, clear, and actionable insights."
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048
              }
            })
          });

          // Log the full response for debugging
          console.log('Full API Response:', response);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error Response Body:', errorBody);
            throw new Error(`API responded with ${response.status}: ${errorBody}`);
          }

          const data = await response.json();
          console.log('Parsed Response Data:', data);
          
          // Check if the response has the expected structure
          if (
            data && 
            data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts
          ) {
            setAnalysis(data.candidates[0].content.parts[0].text);
          } else {
            throw new Error('Unexpected API response format');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          setError(`Analysis error: ${apiError.message}`);
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      console.error('General Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatAnalysis = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold formatting
      .replace(/\*\s/g, '<br>')                         // Bullet point replacement
      .replace(/(<strong>.*?<\/strong>)/g, '<br><br>$1')    // Add line breaks after strong tags
      .replace(/##\s(.*?)(\n|$)/g, '<span style="font-style: italic; font-weight: bold;">$1</span><br>'); // Style full line after ##
};

  return (
    <div style={styles.mainn}>
     <div style={styles.container}>
      <h1>Medical Report Analyzer</h1>
      
      {/* Debugging Information */}
      {error && (
        <div style={{
          backgroundColor: '#ffeeee',
          border: '1px solid red',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '5px'
        }}>
          <strong>Error Details:</strong>
          <p>{error}</p>
        </div>
      )}
      
      {/* File Upload Area */}
      <div style={styles.uploadArea} onClick={() => document.querySelector('input[type=file]').click()} onDrop={handleDrop}  onDragOver={handleDragOver} >
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          style={{ display: 'none'  }}
        />
       <p>Upload medical report (Image or PDF)</p>
      </div>

      {/* Preview Section */}
      {preview && (
        <div style={{
            display: 'flex',
            justifyContent: 'center', // Center the image horizontally
            margin: '20px 0',
          }}>

            {file && file.type === 'application/pdf' ? (
                <iframe 
                    src={preview}
                    alt="Pdf Report preview" 
                    title="PDF Preview"
                    style={{
                        height: '400px', // Set your desired height here
                        width: '60%', // Keep the width full
                        borderRadius: '8px',
                        border: 'none', // Remove border
                      }}
                />
                ) : (
                    <img 
                    src={preview} 
                    alt="Image Report Preview" 
                    style={styles.preview}
                    />
                    )}
            </div>
            )}

      {/* File Info */}
      {file && (
        <div style={{ paddingBottom: '20px' }}>
          Selected file: {file.name}
        </div>
      )}

      {/* Analyze Button */}
      {file && !error && (
        <button 
          onClick={analyzeReport} 
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Report'}
        </button>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div style={styles.analysisCard}>
          <h2>Analysis Results</h2>
          <p dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}></p>
          {
            (() => {
              const status = getVerificationStatus(analysis);
              return (
                <div style={{
                  backgroundColor: status.color,
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  marginTop: '10px',
                  textAlign: 'center',
                }}>
                  {status.message}
                </div>
              );
            })()
          }
        </div>
      )}
    </div>
    <footer style={{
    position: 'fixed', // Make the footer fixed
    bottom: 0, // Stick it to the bottom
    left: 0, // Align it to the left edge
    right: 0, // Align it to the right edge
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    textAlign: 'center',
    padding: '0',
    height: '40px'
}}>
    <p>Made by <a href="https://www.linkedin.com/in/ayush-kumarrai/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Ayush</a></p>
</footer>

    </div>

  );
};

export default MedicalReportAnalyzer;