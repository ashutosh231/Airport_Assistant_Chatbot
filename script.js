const API_KEY = 'AIzaSyCUDPifdtDZgftNExQkkWHkweHL5YMM9t0'; 
// Replace with your actual Gemini API key

const API_URL = `https://gemini.ai/api/v1/generate`;

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Global language mode flag - default is English
window.isHindiMode = false;
// Global speech flag - default is disabled
window.speechEnabled = false;

// Initialize Speech Synthesis
const synth = window.speechSynthesis;
let currentlySpeaking = false;
let speakingIndicator;
let currentUtterance = null; // Track current utterance for control

// Add current airport context tracking
let currentAirport = null;

// List of major airports for context detection
const airportKeywords = {
    'JFK': ['jfk', 'kennedy', 'new york'],
    'LAX': ['lax', 'los angeles'],
    'LHR': ['heathrow', 'lhr', 'london'],
    'SIN': ['changi', 'sin', 'singapore'],
    'DXB': ['dubai', 'dxb'],
    'ORD': ["o'hare", 'ord', 'chicago'],
    'HND': ['haneda', 'hnd', 'tokyo'],
    // Indian Airports
    'DEL': ['del', 'indira gandhi', 'delhi', 'new delhi', 'igi'],
    'BOM': ['bom', 'csia', 'mumbai', 'chhatrapati shivaji', 'bombay'],
    'BLR': ['blr', 'bengaluru', 'bangalore', 'kempegowda'],
    'MAA': ['maa', 'chennai', 'madras'],
    'CCU': ['ccu', 'kolkata', 'netaji subhas', 'calcutta'],
    'HYD': ['hyd', 'hyderabad', 'rajiv gandhi'],
    'AMD': ['amd', 'ahmedabad', 'sardar vallabhbhai patel'],
    'COK': ['cok', 'kochi', 'cochin'],
    'GOI': ['goi', 'goa', 'dabolim'],
    'GAU': ['gau', 'guwahati', 'lokpriya gopinath bordoloi'],
    'JAI': ['jai', 'jaipur', 'sanganeer'],
    'LKO': ['lko', 'lucknow', 'chaudhary charan singh'],
    'IXC': ['ixc', 'chandigarh'],
    // Add more airports as needed
};

// Hindi airport keywords for better detection in Hindi queries
const hindiAirportKeywords = {
    'DEL': ['दिल्ली', 'इंदिरा गांधी', 'आईजीआई', 'नई दिल्ली'],
    'BOM': ['मुंबई', 'छत्रपति शिवाजी', 'बॉम्बे'],
    'BLR': ['बेंगलुरु', 'बैंगलोर', 'केम्पेगौड़ा'],
    'MAA': ['चेन्नई', 'मद्रास'],
    'CCU': ['कोलकाता', 'नेताजी सुभाष', 'कलकत्ता'],
    'HYD': ['हैदराबाद', 'राजीव गांधी'],
    'AMD': ['अहमदाबाद', 'सरदार वल्लभभाई पटेल'],
    'COK': ['कोच्चि', 'कोचीन'],
    'GOI': ['गोवा', 'डाबोलिम'],
    'GAU': ['गुवाहाटी', 'लोकप्रिया गोपीनाथ बोरदोलोई'],
    'JAI': ['जयपुर', 'संगानेर'],
    'LKO': ['लखनऊ', 'चौधरी चरण सिंह'],
    'IXC': ['चंडीगढ़'],
};

// Function to detect if a message mentions a specific airport
function detectAirport(message) {
    const lowercaseMsg = message.toLowerCase();
    
    // Check English keywords
    for (const [airport, keywords] of Object.entries(airportKeywords)) {
        if (keywords.some(keyword => lowercaseMsg.includes(keyword))) {
            return airport;
        }
    }
    
    // If in Hindi mode, also check Hindi keywords
    if (window.isHindiMode) {
        for (const [airport, keywords] of Object.entries(hindiAirportKeywords)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return airport;
            }
        }
    }
    
    return null;
}

async function generateResponse(prompt) {
    try {
        // Check if user is asking about a new airport
        const detectedAirport = detectAirport(prompt);
        if (detectedAirport) {
            currentAirport = detectedAirport;
        }
        
        // Airport assistant context to guide the AI responses
        const airportContext = window.isHindiMode
            ? `आप एक AI-आधारित व्यक्तिगत हवाई अड्डा गाइड "Skybot हवाई अड्डा सहायक" हैं। 
            आपका उद्देश्य दुनिया भर के हवाई अड्डों के बारे में उपयोगी नेविगेशन टिप्स, 
            सुविधाओं के बारे में जानकारी और मार्गदर्शन प्रदान करना है। 
            सभी प्रश्नों का उत्तर हिंदी भाषा में दें। हवाई अड्डे के बारे में पूछे जाने पर 
            टर्मिनल लेआउट, परिवहन विकल्प, भोजन विकल्प, लाउंज, सुरक्षा चेकपॉइंट 
            और उस हवाई अड्डे की किसी भी विशेष सुविधा के बारे में विस्तृत जानकारी प्रदान करें।
            
            ${currentAirport ? `उपयोगकर्ता वर्तमान में ${currentAirport} हवाई अड्डे के बारे में पूछ रहा है। 
            जब तक उपयोगकर्ता स्पष्ट रूप से किसी अन्य हवाई अड्डे का उल्लेख न करे, 
            सभी प्रश्नों का उत्तर मानकर दें कि वे ${currentAirport} के बारे में हैं।` : 
            'यदि उपयोगकर्ता किसी विशिष्ट हवाई अड्डे का उल्लेख नहीं करता है, तो पूछें कि उन्हें किस हवाई अड्डे के बारे में जानकारी चाहिए।'}
            
            अपने उत्तरों को मार्कडाउन का उपयोग करके शीर्षक, बुलेट पॉइंट और प्रमुखता के साथ फॉर्मेट करें।
            उत्तरों को संक्षिप्त और यात्रियों के लिए व्यावहारिक रखें।`
            : `You are an AI-based personal airport guide called "Skybot Airport Assistant". 
            Your purpose is to provide helpful navigation tips, information about facilities, 
            and guidance for specific airports worldwide. When asked about an airport, provide 
            detailed information about terminal layouts, transportation options, dining options, 
            lounges, security checkpoints, and any special features of that airport.
            
            ${currentAirport ? `The user is currently asking about ${currentAirport} airport. 
            Answer all questions assuming they are about ${currentAirport} unless the user clearly mentions another airport.` : 
            'If the user doesn\'t specify an airport, ask which airport they need help with.'}
            
            Format your responses using Markdown with headings, bullet points, and emphasis where appropriate.
            Keep responses concise and practical for travelers.`;
        
        const fullPrompt = `${airportContext}\n\nUser query: ${prompt}`;
        
        // Add language instruction if in Hindi mode
        const apiRequestBody = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': fullPrompt
                        }
                    ]
                }
            ]
        };
        
        // If Hindi mode is enabled, add specific instruction
        if (window.isHindiMode) {
            apiRequestBody.generationConfig = {
                stopSequences: [],
                temperature: 2.3,
                maxOutputTokens: 2048,
            };
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiRequestBody)
        });
        const data = await response.json();

        if (!data || !data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error("Invalid response from Gemini API.");
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("API Error:", error);
        const errorMessage = window.isHindiMode 
            ? "हवाई अड्डे की जानकारी प्राप्त करने में असमर्थ। कृपया बाद में पुनः प्रयास करें।"
            : "Unable to retrieve airport information. Please try again later.";
        showErrorMessage(errorMessage);
        return null;
    }
}

function cleanMarkdown(text) {
    // Less aggressive cleaning - preserve formatting that helps readability
    return text.replace(/\n{3,}/g, '\n\n').trim();
}

// Convert text to plain text by removing markdown and HTML tags
function textToPlainSpeech(text) {
    // First convert markdown to HTML
    let htmlText = marked.parse(text);
    
    // Then remove HTML tags
    let plainText = htmlText.replace(/<[^>]*>?/gm, '');
    
    // Handle special characters and common markdown artifacts
    plainText = plainText.replace(/&nbsp;/g, ' ')
                         .replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>')
                         .replace(/&quot;/g, '"')
                         .replace(/&#39;/g, "'")
                         .replace(/\*\*/g, '')
                         .replace(/\*/g, '')
                         .replace(/\_\_/g, '')
                         .replace(/\_/g, '')
                         .replace(/\`\`\`/g, '')
                         .replace(/\`/g, '');
    
    return plainText;
}

// Function to gracefully stop any ongoing speech
function stopSpeaking() {
    if (synth.speaking) {
        // Cancel any ongoing speech
        synth.cancel();
        currentlySpeaking = false;
        
        // Reset the UI
        if (speakingIndicator) {
            speakingIndicator.classList.add('hidden');
        }
        
        // Clear the current utterance reference
        currentUtterance = null;
    }
}

// Function to speak text with proper voice selection but without introductions
function speakText(text) {
    // If speech is not enabled or browser doesn't support speech synthesis, return
    if (!window.speechEnabled || !window.speechSynthesis) return;
    
    // If already speaking, stop current speech
    if (synth.speaking) {
        stopSpeaking();
    }
    
    // Convert markdown text to plain text suitable for speech
    const plainText = textToPlainSpeech(text);
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(plainText);
    
    // Store reference to current utterance
    currentUtterance = utterance;
    
    // Set language based on current mode
    utterance.lang = window.isHindiMode ? 'hi-IN' : 'en-US';
    
    // Set voice based on language
    let voices = synth.getVoices();
    if (voices.length) {
        const languageCode = window.isHindiMode ? 'hi' : 'en';
        
        // Try to find a suitable voice for the current language
        let selectedVoice = voices.find(voice => 
            voice.lang.startsWith(languageCode) && 
            voice.localService === true
        );
        
        // If no native voice found, try any voice matching the language
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.startsWith(languageCode)
            );
        }
        
        // If a suitable voice is found, use it
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            console.warn(`No suitable ${window.isHindiMode ? 'Hindi' : 'English'} voice found`);
        }
    }
    
    // Show speaking indicator
    speakingIndicator = document.getElementById('speaking-indicator');
    if (speakingIndicator) {
        speakingIndicator.classList.remove('hidden');
    }
    
    // Mark as currently speaking
    currentlySpeaking = true;
    
    // Handle speech events
    utterance.onend = () => {
        currentlySpeaking = false;
        currentUtterance = null;
        if (speakingIndicator) {
            speakingIndicator.classList.add('hidden');
        }
    };
    
    utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        currentlySpeaking = false;
        currentUtterance = null;
        if (speakingIndicator) {
            speakingIndicator.classList.add('hidden');
        }
    };
    
    // Start speaking
    synth.speak(utterance);
}

function addMessage(message, isUser) {
    const messageContainerElement = document.createElement('div');
    messageContainerElement.classList.add('message-container');
    messageContainerElement.classList.add(isUser ? 'user-message-container' : 'bot-message-container');

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

    const profileImage = document.createElement('img');
    profileImage.classList.add('profile-image');
    profileImage.src = isUser ? 'user.jpg' : 'bot.jpg';
    profileImage.alt = isUser ? 'User' : 'Bot';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    
    // Use Markdown for bot messages, plain text for user
    if (isUser) {
        messageContent.textContent = message;
    } else {
        // Parse markdown and set as HTML
        messageContent.innerHTML = marked.parse(message);
        
        // If speech is enabled, speak the bot's response
        if (window.speechEnabled && !isUser) {
            speakText(message);
        }
    }

    if (isUser) {
        messageElement.appendChild(messageContent);
        messageElement.appendChild(profileImage);
    } else {
        messageElement.appendChild(profileImage);
        messageElement.appendChild(messageContent);
    }
    
    messageContainerElement.appendChild(messageElement);
    chatMessages.appendChild(messageContainerElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingContainer = document.createElement('div');
    typingContainer.id = 'typing-indicator';
    typingContainer.classList.add('typing-indicator');
    
    // Add the three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingContainer.appendChild(dot);
    }
    
    chatMessages.appendChild(typingContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 🚀 New Function: Display an error message
function showErrorMessage(errorText) {
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message'); // Apply a CSS class for styling
    errorElement.textContent = errorText;
    
    chatMessages.appendChild(errorElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => errorElement.remove(), 5000); // Auto-remove error after 5 seconds
}

// Suggest common airport queries with improved styling
function addSuggestionChips(isHindi = false) {
    // Remove any existing suggestion chips
    const existingChips = document.querySelector('.suggestion-container');
    if (existingChips) {
        existingChips.remove();
    }
    
    const suggestions = isHindi ? [
        "दिल्ली हवाई अड्डे की जानकारी",
        "मुंबई हवाई अड्डे पर परिवहन विकल्प",
        "बैंगलोर हवाई अड्डे पर लाउंज",
        "चेन्नई हवाई अड्डे के टर्मिनल",
        "हैदराबाद हवाई अड्डे पर खाने की जगह",
        "अहमदाबाद हवाई अड्डे पर शॉपिंग",
        "गोवा हवाई अड्डे तक कैसे पहुंचें",
        "जयपुर हवाई अड्डे की सुविधाएं"
    ] : [
        "Help with JFK Airport navigation",
        "Best food options at LAX",
        "Heathrow Airport terminal connections",
        "Singapore Changi Airport attractions",
        "Dubai Airport duty-free shopping",
        "Delhi Airport terminal guide",
        "Mumbai Airport transportation options",
        "Bangalore Airport lounges"
    ];
    
    const suggestionContainer = document.createElement('div');
    suggestionContainer.classList.add('suggestion-container', 'flex', 'flex-wrap', 'gap-2', 'my-3', 'justify-center');
    
    suggestions.forEach(text => {
        const chip = document.createElement('button');
        chip.classList.add('suggestion-chip', 'bg-blue-600', 'text-white', 'text-sm', 'px-3', 'py-1', 'rounded-full', 'hover:bg-blue-500', 'transition-all', 'hover:scale-105');
        chip.textContent = text;
        chip.addEventListener('click', () => {
            userInput.value = text;
            handleUserInput();
        });
        suggestionContainer.appendChild(chip);
    });
    
    chatMessages.appendChild(suggestionContainer);
}

// Initialize with welcome message and suggestions
function initializeChat() {
    const welcomeMessage = "## 👋 Welcome to Skybot Airport Assistant!\n\nI can help you navigate airports worldwide. Some things I can assist with:\n\n- Terminal layouts and connections\n- Transportation options\n- Dining and shopping recommendations\n- Lounge information\n- Security tips\n\nWhich airport are you traveling through?";
    addMessage(welcomeMessage, false);
    
    // If speech is enabled, explicitly speak the welcome message
    if (window.speechEnabled) {
        speakText(welcomeMessage);
    }
    
    addSuggestionChips();
}

// Add initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize speech synthesis voices
    if ('speechSynthesis' in window) {
        // Force load voices
        window.speechSynthesis.getVoices();
        
        // Chrome requires this to be triggered by user action
        // Firefox and Safari populate voices automatically
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = function() {
                // Voices are loaded and ready
                console.log("Speech synthesis voices loaded:", speechSynthesis.getVoices().length);
            };
        }
    }
    
    // Get reference to speech indicator
    speakingIndicator = document.getElementById('speaking-indicator');
    
    // Get reference to speaker toggle
    const speakerToggle = document.getElementById('speaker-toggle-input');
    if (speakerToggle) {
        speakerToggle.addEventListener('change', function() {
            window.speechEnabled = this.checked;
            
            // If turning off speech, stop any current speech
            if (!window.speechEnabled) {
                stopSpeaking();
            } else if (window.speechEnabled) {
                // If enabling speech, speak the current welcome message if visible
                const messages = document.querySelectorAll('.bot-message');
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage) {
                        const messageContent = lastMessage.querySelector('.message-content');
                        if (messageContent) {
                            speakText(messageContent.innerHTML);
                        }
                    }
                }
            }
            
            // Visual feedback for speaker state
            const muteIcon = document.querySelector('.fa-volume-mute');
            const volumeIcon = document.querySelector('.fa-volume-up');
            
            if (window.speechEnabled) {
                muteIcon.classList.add('text-gray-400');
                volumeIcon.classList.add('text-green-400');
            } else {
                muteIcon.classList.remove('text-gray-400');
                volumeIcon.classList.remove('text-green-400');
            }
            
            console.log("Speaker toggled:", window.speechEnabled ? "on" : "off");
        });
    }
    
    const airportSelector = document.getElementById('airport-selector');
    if (airportSelector) {
        airportSelector.addEventListener('change', function() {
            if (this.value) {
                currentAirport = this.value;
                // Use Hindi text if in Hindi mode
                if (window.isHindiMode) {
                    document.getElementById('user-input').value = `${this.value} हवाई अड्डे के बारे में बताएं`;
                } else {
                    document.getElementById('user-input').value = `Tell me about ${this.value} airport`;
                }
                document.getElementById('send-button').click();
                this.selectedIndex = 0; // Reset selector
            }
        });
    }
    
    // Initialize chat
    initializeChat();
});

// Voice recognition setup
const micButton = document.getElementById('mic-button');
let recognition;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    micButton.addEventListener('click', () => {
        if (recognition) {
            // Set language based on current mode
            recognition.lang = window.isHindiMode ? 'hi-IN' : 'en-US';
            recognition.start();
            micButton.disabled = true;
            micButton.classList.add('recording');
            userInput.placeholder = window.isHindiMode ? "सुन रहा हूँ..." : "Listening...";
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        micButton.disabled = false;
        micButton.classList.remove('recording');
        userInput.placeholder = window.isHindiMode 
            ? "हवाई अड्डे के बारे में पूछें, सुविधाओं या सलाह के लिए..."
            : "Ask about airport navigation, facilities, or tips...";
        handleUserInput(); // Automatically send the transcribed text to GPT
    };

    recognition.onerror = () => {
        const errorMessage = window.isHindiMode 
            ? "आवाज़ पहचान विफल हुई। कृपया पुनः प्रयास करें।"
            : "Voice recognition failed. Please try again.";
        showErrorMessage(errorMessage);
        micButton.disabled = false;
        micButton.classList.remove('recording');
        userInput.placeholder = window.isHindiMode 
            ? "हवाई अड्डे के बारे में पूछें, सुविधाओं या सलाह के लिए..."
            : "Ask about airport navigation, facilities, or tips...";
    };

    recognition.onend = () => {
        micButton.disabled = false;
        micButton.classList.remove('recording');
        userInput.placeholder = window.isHindiMode 
            ? "हवाई अड्डे के बारे में पूछें, सुविधाओं या सलाह के लिए..."
            : "Ask about airport navigation, facilities, or tips...";
    };
} else {
    micButton.disabled = true;
    micButton.title = "Voice recognition not supported in this browser.";
}

// Handle language toggle - simplified without voice introductions
document.getElementById('language-toggle-input').addEventListener('change', function() {
    const isHindi = this.checked;
    
    // First stop any ongoing speech when changing languages
    if (synth.speaking) {
        stopSpeaking();
    }
    
    // Set language preference for API calls
    window.isHindiMode = isHindi;
    
    // Update placeholder text based on language
    const userInput = document.getElementById('user-input');
    userInput.placeholder = isHindi 
        ? "हवाई अड्डे के बारे में पूछें, सुविधाओं या सलाह के लिए..."
        : "Ask about airport navigation, facilities, or tips...";
    
    // Add welcome message in the selected language
    const welcomeMessage = isHindi 
        ? "## 👋 हवाई अड्डा सहायक में आपका स्वागत है!\n\nमैं आपको हवाई अड्डों पर मार्गदर्शन प्रदान कर सक्ती हूँ। मैं आपकी इन चीज़ों में मदद कर सक्ती हूँ:\n\n- टर्मिनल लेआउट और कनेक्शन\n- परिवहन विकल्प\n- खाने और खरीदारी की सिफारिशें\n- लाउंज की जानकारी\n- सुरक्षा संबंधित टिप्स\n\nआप किस हवाई अड्डे के बारे में जानना चाहते हैं?" 
        : "## 👋 Welcome to Skybot Airport Assistant!\n\nI can help you navigate airports worldwide. Some things I can assist with:\n\n- Terminal layouts and connections\n- Transportation options\n- Dining and shopping recommendations\n- Lounge information\n- Security tips\n\nWhich airport are you traveling through?";
    
    addMessage(welcomeMessage, false);
    
    // Speak the welcome message if speech is enabled
    if (window.speechEnabled) {
        speakText(welcomeMessage);
    }
    
    addSuggestionChips(isHindi);
    
    console.log("Language changed to:", isHindi ? "Hindi" : "English");
});

async function handleUserInput() {
    const userMessage = userInput.value.trim();

    if (userMessage) {
        // If currently speaking, stop the speech before processing new input
        if (window.speechEnabled) {
            stopSpeaking();
        }
        
        addMessage(userMessage, true);
        userInput.value = '';

        sendButton.disabled = true;
        userInput.disabled = true;
        
        // Show typing indicator while waiting for response
        showTypingIndicator();

        try {
            const botMessage = await generateResponse(userMessage);
            // Remove typing indicator before adding the response
            removeTypingIndicator();
            
            if (!botMessage) return; // If error occurred, don't proceed further

            addMessage(cleanMarkdown(botMessage), false);
        } catch (error) {
            removeTypingIndicator();
            console.error('Error:', error);
            showErrorMessage("Something went wrong. Please try again.");
        } finally {
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
}

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});
