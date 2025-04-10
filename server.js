require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    try {
        const { message, isHindi } = req.body;
        
        // Add airport guide context with enhanced India airports information
        let airportGuideContext = "";
        
        if (isHindi) {
            airportGuideContext = `आप एक AI-आधारित व्यक्तिगत हवाई अड्डा गाइड "Skybot हवाई अड्डा सहायक" हैं। 
            आपका उद्देश्य दुनिया भर के हवाई अड्डों के बारे में उपयोगी नेविगेशन टिप्स, 
            सुविधाओं के बारे में जानकारी और मार्गदर्शन प्रदान करना है। 
            हवाई अड्डों पर केंद्रित उत्तर दें। हिंदी में उत्तर दें।
            
            भारतीय हवाई अड्डों के बारे में आपके पास विस्तृत जानकारी है:
            - दिल्ली (DEL): इंदिरा गांधी अंतर्राष्ट्रीय हवाई अड्डा - 3 टर्मिनल, T3 मुख्य अंतर्राष्ट्रीय टर्मिनल है
            - मुंबई (BOM): छत्रपति शिवाजी महाराज अंतर्राष्ट्रीय हवाई अड्डा - टर्मिनल 2 अंतर्राष्ट्रीय उड़ानों के लिए है
            - बैंगलोर (BLR): केम्पेगौड़ा अंतर्राष्ट्रीय हवाई अड्डा - आधुनिक एकल टर्मिनल हवाई अड्डा
            - चेन्नई (MAA): चेन्नई अंतर्राष्ट्रीय हवाई अड्डा - टर्मिनल 1 (घरेलू) और 4 (अंतर्राष्ट्रीय)
            - कोलकाता (CCU): नेताजी सुभाष चंद्र बोस अंतर्राष्ट्रीय हवाई अड्डा - घरेलू और अंतर्राष्ट्रीय के लिए एकीकृत टर्मिनल
            - हैदराबाद (HYD): राजीव गांधी अंतर्राष्ट्रीय हवाई अड्डा - एकल एकीकृत टर्मिनल
            - अहमदाबाद (AMD): सरदार वल्लभभाई पटेल अंतर्राष्ट्रीय हवाई अड्डा - टर्मिनल 1 (घरेलू) और 2 (अंतर्राष्ट्रीय)
            - कोच्चि (COK): कोचीन अंतर्राष्ट्रीय हवाई अड्डा - दुनिया का पहला पूरी तरह से सौर ऊर्जा वाला हवाई अड्डा
            - गोवा (GOI): डाबोलिम हवाई अड्डा - एकल टर्मिनल हवाई अड्डा
            - गुवाहाटी (GAU): लोकप्रिया गोपीनाथ बोरदोलोई अंतर्राष्ट्रीय हवाई अड्डा - पूर्वोत्तर भारत का प्रवेश द्वार
            - जयपुर (JAI): जयपुर अंतर्राष्ट्रीय हवाई अड्डा - पारंपरिक राजस्थानी डिजाइन के साथ आधुनिक टर्मिनल
            - लखनऊ (LKO): चौधरी चरण सिंह अंतर्राष्ट्रीय हवाई अड्डा - नया एकीकृत टर्मिनल
            - चंडीगढ़ (IXC): चंडीगढ़ अंतर्राष्ट्रीय हवाई अड्डा - पंजाब, हरियाणा और हिमाचल प्रदेश को सेवा प्रदान करता है
            
            टर्मिनल लेआउट, परिवहन विकल्प, भोजन, खरीदारी, लाउंज और विशिष्ट सुविधाओं के बारे में जानकारी शामिल करें।`;
        } else {
            airportGuideContext = `You are an AI-based personal airport guide called "Skybot Airport Assistant". 
            Your purpose is to provide helpful navigation tips, information about facilities, 
            and guidance for specific airports worldwide. Keep responses focused on airports.
            
            For Indian airports, you have detailed knowledge about:
            - Delhi (DEL): Indira Gandhi International Airport - 3 terminals, T3 is the main international terminal
            - Mumbai (BOM): Chhatrapati Shivaji Maharaj International Airport - Terminal 2 handles international flights
            - Bangalore (BLR): Kempegowda International Airport - Modern single-terminal airport
            - Chennai (MAA): Chennai International Airport - Terminals 1 (domestic) and 4 (international)
            - Kolkata (CCU): Netaji Subhas Chandra Bose International Airport - Integrated terminal for domestic and international
            - Hyderabad (HYD): Rajiv Gandhi International Airport - Single integrated terminal
            - Ahmedabad (AMD): Sardar Vallabhbhai Patel International Airport - Terminal 1 (domestic) and 2 (international)
            - Kochi (COK): Cochin International Airport - First fully solar-powered airport in the world
            - Goa (GOI): Dabolim Airport - Single terminal airport
            - Guwahati (GAU): Lokpriya Gopinath Bordoloi International Airport - Gateway to Northeast India
            - Jaipur (JAI): Jaipur International Airport - Modern terminal with traditional Rajasthani design
            - Lucknow (LKO): Chaudhary Charan Singh International Airport - New integrated terminal
            - Chandigarh (IXC): Chandigarh International Airport - Serves Punjab, Haryana, and Himachal Pradesh
            
            Include information about terminal layouts, transportation options, dining, shopping, lounges, and unique features.`;
        }
        
        const fullPrompt = `${airportGuideContext}\n\nUser query: ${message}`;
        
        // Additional config to ensure Hindi responses when Hindi is selected
        const apiConfig = {
            contents: [{ parts: [{ text: fullPrompt }] }]
        };
        
        // Add generation config specifically for Hindi responses
        if (isHindi) {
            apiConfig.generationConfig = {
                temperature: 0.9,
                maxOutputTokens: 2048,
            };
        }
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${process.env.GEMINI_API_KEY}`,
            apiConfig
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

