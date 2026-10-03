import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate consultant profile photo
export async function generateConsultantPhoto(
  name: string,
  expertise: string,
  gender: "male" | "female" | "neutral" = "neutral"
): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional headshot portrait of an ESG ${expertise} consultant named ${name}. ${gender === "male" ? "Male" : gender === "female" ? "Female" : "Professional"} wearing business attire against a neutral background. The image should look realistic and professional.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    console.error("Error generating consultant photo:", error);
    throw new Error("Failed to generate consultant photo");
  }
}

// Function to translate text using OpenAI
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are a professional translator. Translate the following text from English to ${targetLanguage === "zh-TW" ? "Traditional Chinese (Taiwan)" : targetLanguage}. 
             Keep the formatting intact and maintain the original meaning as accurately as possible.
             Do not add any explanations or notes. Return only the translated text.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

// Function to analyze consultant reviews
export async function analyzeReviewSentiment(reviewText: string) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `Analyze the sentiment and key points of this ESG consultant review. 
             Provide a JSON response with the following structure:
             {
               "sentiment": "positive" | "neutral" | "negative",
               "keyStrengths": [array of strengths mentioned],
               "areasOfImprovement": [array of improvement areas mentioned],
               "topicAnalysis": {object with ESG topics mentioned and their relevance score from 0-1}
             }`
        },
        {
          role: "user",
          content: reviewText
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("Review analysis error:", error);
    return {
      sentiment: "neutral",
      keyStrengths: [],
      areasOfImprovement: [],
      topicAnalysis: {}
    };
  }
}