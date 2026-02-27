import { GoogleGenAI } from "@google/genai";
import { VocalMetrics } from "./mockScoring";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getVocalFeedback(metrics: VocalMetrics): Promise<string> {
  try {
    const prompt = `
      Bạn là một huấn luyện viên thanh nhạc chuyên nghiệp. Học viên vừa hoàn thành bài tập hát với kết quả sau (thang điểm 100):
      - Điểm tổng quát: ${metrics.score}
      - Nhịp điệu (Rhythm): ${metrics.rhythm}
      - Độ ổn định (Stability): ${metrics.stability}
      - Độ rung giọng (Vibrato): ${metrics.vibrato}

      Hãy phân tích ngắn gọn về kỹ thuật của họ, đưa ra nhận xét về cảm xúc giọng hát (dựa trên các chỉ số), và gợi ý 1-2 bài tập cá nhân hóa để cải thiện.
      Trả lời bằng tiếng Việt, thân thiện và khích lệ.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Không thể lấy nhận xét từ AI lúc này.";
  } catch (error) {
    console.error("Error getting Gemini feedback:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Hãy chép lời (transcribe) chính xác đoạn âm thanh này bằng tiếng Việt hoặc tiếng Anh. Chỉ trả về phần lời (lyrics) bạn nghe được, tuyệt đối không thêm bình luận hay dấu ngoặc kép. Nếu chỉ là tiếng ngân nga không rõ chữ hoặc không có tiếng người, hãy trả về đúng câu: 'Không nhận diện được lời'.",
          },
        ],
      },
    });
    return response.text?.trim() || "Không nhận diện được lời";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Lỗi chép lời.");
  }
}

export async function searchSongByLyrics(lyrics: string): Promise<string> {
  if (!lyrics || lyrics.includes("Không nhận diện được lời")) {
    return "Không thể tìm bài hát vì không có lời.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tìm tên bài hát và ca sĩ gốc dựa trên đoạn lời sau: "${lyrics}". Trả về kết quả ngắn gọn theo định dạng: "Tên bài hát - Ca sĩ". Nếu không tìm thấy, hãy nói "Không tìm thấy bài hát phù hợp".`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text?.trim() || "Không tìm thấy bài hát.";
  } catch (error) {
    console.error("Error searching song:", error);
    return "Lỗi tìm kiếm bài hát.";
  }
}
