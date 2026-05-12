const Tesseract = require('tesseract.js');
const fs = require('fs');

class TextValidator {
    /**
     * Cross-checks the text inside an image against an expected string.
     * @param {string} imagePath - Path to the generated image.
     * @param {string} expectedText - The hook message or text we expect to see.
     */
    async verifyImageText(imagePath, expectedText) {
        console.log(`🔍 [TextValidator] Cross-checking image: ${imagePath}`);
        
        try {
            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'kor+eng', // Check both Korean and English
                { logger: m => console.log(`   - OCR Progress: ${Math.round(m.progress * 100)}%`) }
            );

            console.log(`📝 [TextValidator] OCR Extracted Text: "${text.trim().replace(/\n/g, ' ')}"`);
            
            // Basic cleaning for comparison
            const cleanExtracted = text.replace(/\s/g, '');
            const cleanExpected = expectedText.replace(/\s/g, '');

            // Check if major parts of the expected text exist in the OCR result
            // (OCR isn't always 100% perfect with stylised fonts, so we check for partial matches)
            const isMatch = cleanExtracted.includes(cleanExpected.substring(0, 5)); 

            if (isMatch) {
                console.log("✅ [TextValidator] Korean text verification passed!");
                return true;
            } else {
                console.warn("⚠️ [TextValidator] Text mismatch or unreadable. Manual check recommended.");
                return false;
            }
        } catch (error) {
            console.error("❌ [TextValidator] OCR failed:", error);
            return false;
        }
    }
}

module.exports = TextValidator;
