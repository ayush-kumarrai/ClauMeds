import React, { useState, useEffect } from 'react';
import './App.css'; // Adjust the path as necessary


const MedicalReportAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  


  // Updated API configuration with new model
  const API_KEY = 'AIzaSyBMf2LoAeGhHBcWFrEsgg1sdlopHphPmsQ';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;


  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bho', name: 'Bhojpuri' },
  ];


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
      
      ,languageControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      position: 'relative',
    },
    languageSelector: {
      position: 'relative',
      display: 'inline-block',
    },
    languageButton: {
      padding: '8px 15px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    dropdownContent: {
      display: 'none',
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      minWidth: '160px',
      boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
      borderRadius: '4px',
      zIndex: 1,
    },
    dropdownContentShow: {
      display: 'block',
    },
    dropdownItem: {
      color: 'white',
      padding: '12px 16px',
      textDecoration: 'none',
      display: 'block',
      cursor: 'pointer',
      textAlign: 'left',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    speakerButton: {
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
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

const translateAnalysis = async (text, targetLang) => {
  if (targetLang === 'en') {
    setTranslation(null);
    return;
  }

  try {
    const translationPrompt = `
        Translate this medical report to ${languages.find(l => l.code === targetLang).name}. 
        Important instructions:
        1. Convert ALL text to ${languages.find(l => l.code === targetLang).name} script
        2. Translate medical terms to common ${languages.find(l => l.code === targetLang).name} terms that people understand
        3. Maintain the formatting but convert everything including:
           - Numbers should be written in ${languages.find(l => l.code === targetLang).name} numerals if applicable
           - Convert all technical terms to their ${languages.find(l => l.code === targetLang).name} equivalents
           - Keep the structure but make it natural in ${languages.find(l => l.code === targetLang).name}

        Text to translate:
        ${text}
      `;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: translationPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const translatedText = data.candidates[0].content.parts[0].text;
        const cleanedTranslation = translatedText
        
        setTranslation(cleanedTranslation);

        // If currently speaking, restart with new translation
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setTimeout(() => window.speechSynthesis.speak(utterance), 100);
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
    }
  };


// Handle language change
const handleLanguageChange = async (code) => {
  setSelectedLanguage(code);
  setShowLanguageDropdown(false);
  setIsLoading(true);
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  // Translate the content
  if (analysis) {
    await translateAnalysis(analysis, code);
  }

  // Hide loading screen after 8 seconds
  setTimeout(() => {
    setIsLoading(false);
  }, 8000); // Adjust to 10,000 for a 10-second timeout if preferred
};

// Text-to-speech function
const speak = (text) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance();
    
    // Set the text and language
    utterance.text = translation || text;

    // Language mapping
    const langMapping = {
      'hi': 'hi-IN',
      'bho': 'hi-IN', // Fallback to Hindi for Bhojpuri
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'en': 'en-US'
    };

    utterance.lang = langMapping[selectedLanguage] || 'en-US';

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a voice for the selected language
    const voice = voices.find(v => v.lang.startsWith(langMapping[selectedLanguage]) || v.lang.startsWith(selectedLanguage));
    if (voice) {
      utterance.voice = voice;
    }

    // Adjust speech parameters for better results
    utterance.rate = 0.9; // Slightly slower rate
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setError('Text-to-speech failed. Please try again.');
    };
    

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Add a small delay to ensure voices are loaded
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }, 100);
    }
  } else {
    setError('Text-to-speech is not supported in your browser.');
  }
};

// Add this useEffect to load voices when component mounts
useEffect(() => {
  let voices = [];

  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices);
  };

  loadVoices();
  
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  return () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };
}, []);


  return (
    <div style={styles.mainn}>
      {isLoading && <div className="loading-screen"></div>}
     <div style={styles.container}>
      <h1>Medical Report Analyzer</h1>


      <div style={styles.languageControls}>
        <div style={styles.languageSelector}>
          <button 
            style={styles.languageButton}
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <span role="img" aria-label="globe">🌐</span>
            {languages.find(l => l.code === selectedLanguage)?.name}
          </button>
          <div style={{
            ...styles.dropdownContent,
            ...(showLanguageDropdown ? styles.dropdownContentShow : {})
          }}>
            {languages.map((lang) => (
              <div
                key={lang.code}
                style={styles.dropdownItem}
                onClick={() => handleLanguageChange(lang.code)}
              >
                {lang.name}
              </div>
            ))}
          </div>
        </div>

        {(analysis || translation) && (
          <button
            onClick={() => speak(translation || analysis)}
            style={styles.speakerButton}
            title={isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
          >
            <span role="img" aria-label={isSpeaking ? 'mute' : 'speak'}>
              {isSpeaking ? '🔇 Pause Listening' : '🔊 Start Listening'}
            </span>
          </button>
        )}
      </div>


      {error && (
        <div style={{
          display: 'none',
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
      {(analysis || translation) && (
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