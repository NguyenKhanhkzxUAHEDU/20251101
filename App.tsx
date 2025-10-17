import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Button from './components/Button';
import { generateImageFromImageAndText } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { FileWithPreview } from './types';

const viewOptions = [
  { id: 'interior', label: 'Nội thất', prompt: 'Show a photorealistic interior view of this building, focusing on a beautifully designed living space that matches the exterior architectural style.' },
  { id: 'aerial', label: 'Nhìn từ trên cao', prompt: 'Show a photorealistic aerial view (drone shot) of this building, including the roof details and immediate landscape context, maintaining the original architectural style.' },
  { id: 'night', label: 'Ban đêm', prompt: 'Show a photorealistic view of this building at night. It should be beautifully illuminated, with both interior and exterior lights on, creating a warm and inviting atmosphere.' },
  { id: 'rear', label: 'Mặt sau', prompt: 'Show a photorealistic view of the rear facade of this building, maintaining the same architectural style and level of detail as the front.' },
  { id: 'street_view_hanoi', label: 'Đường phố Hà Nội xưa', prompt: 'Place this building on a bustling street in old Hanoi, Vietnam. The scene should include traditional tube houses, cyclos, and people in ao dai. Maintain the building\'s original architecture but integrate it seamlessly into the historical Vietnamese cityscape with a nostalgic, slightly faded color palette.' },
  { id: 'hoian_riverside', label: 'Bờ sông Hội An', prompt: 'Integrate this building along the riverside of ancient Hoi An, Vietnam. The scene should feature yellow-walled houses, colorful lanterns, and small wooden boats on the river. The lighting should be warm, like late afternoon sun, reflecting the romantic and peaceful atmosphere of the old town.' },
  { id: 'saigon_alley', label: 'Hẻm Sài Gòn xưa', prompt: 'Situate this building within a narrow, vibrant alley of old Saigon. The scene should be full of life, with hanging electrical wires, small street food stalls, and classic motorbikes. The architecture should be adapted to fit into the dense, energetic urban fabric of a historic Vietnamese alley.' },
  { id: 'sapa_market', label: 'Chợ phiên Sapa', prompt: `Place this building in a vibrant Sapa market scene. The surroundings should be filled with H'Mong and Dao ethnic people dressed in their intricate, colorful traditional clothing. In the background, show the iconic terraced rice paddies of the northern Vietnamese mountains. The overall mood should be lively and culturally rich.` },
  { id: 'mekong_floating_market', label: 'Chợ nổi miền Tây', prompt: `Integrate this building onto the riverbank of a bustling Mekong Delta floating market. The scene should be crowded with wooden boats selling fruits and vegetables. People should be wearing traditional 'Áo Bà Ba' and conical hats ('Nón Lá'). The atmosphere should feel sunny, tropical, and full of life.` },
  { id: 'hue_imperial', label: 'Cố đô Huế', prompt: `Situate this building within the serene and elegant context of the Hue Imperial City. The scene should include Vietnamese people dressed in traditional, formal 'Áo Dài', walking through gardens or courtyards typical of the ancient capital. The architecture should blend respectfully with the historical and royal ambiance of Hue.` },
  { id: 'central_highlands_festival', label: 'Lễ hội Tây Nguyên', prompt: `Place this building in a village in Vietnam's Central Highlands during a cultural festival. The scene should feature Ede or Jarai ethnic people in their traditional woven attire, perhaps gathered around a 'Nhà Rông' (communal house) or participating in a gong performance. The surrounding landscape should be lush with coffee plantations or forests.` },
  { id: 'mekong_nguyen_dynasty', label: 'Miền Tây triều Nguyễn', prompt: `Situate this building in the Mekong Delta, adapting its decorative elements with influence from Nguyen Dynasty art. Feature intricate wooden carvings and ceramic mosaics typical of Hue's imperial style, but integrated into a traditional riverside wooden house. The scene is on a riverbank with coconut palms, with locals in 'Áo Bà Ba' on small boats, creating a unique fusion of royal elegance and rustic tropical charm.` },
  { id: 'indochine_kinh_culture', label: 'Đông Dương (Văn hóa Kinh)', prompt: `Transform this building into a major public, cultural, or religious structure in the Indochine style, representative of Vietnam's Kinh ethnic group across Tonkin, Annam, and Cochinchina (Bắc, Trung, và Nam Kỳ). The design should blend French colonial architecture (Neoclassical, Art Deco) with traditional Vietnamese aesthetics. Imagine it as a grand theater, a communal temple (đình), a historic pagoda, or a cathedral from that era. Key features must include yin-yang tiled roofs, intricate wooden carvings, ceramic details, and symmetrical structures. Place the building in a historical urban setting characteristic of one of the three regions, evoking a dignified and nostalgic grandeur.` },
  { id: 'northern_stilt_house', label: 'Nhà sàn miền Bắc (1800-45)', prompt: `Transform this building into a large, traditional wooden stilt house ('nhà sàn') of the Tay or Thai ethnic people in Northern Vietnam, dated between 1800-1945. The structure should be elevated, made of dark, weathered wood and bamboo, with a thatched or leaf-covered roof. Place it in a serene valley surrounded by green rice paddies and limestone mountains.` },
  { id: 'hmong_stone_house', label: `Nhà trình tường H'Mông (1800-45)`, prompt: `Reimagine this building as a traditional H'mong house from the 1800-1945 period. It must feature thick, pounded earth walls ('nhà trình tường') and a heavy stone tile roof. Set the house on a high, rocky plateau like the Dong Van Karst Plateau, enclosed by characteristic stone fences. The scene should convey a sense of resilience and harmony with the rugged mountain landscape.` },
  { id: 'central_highlands_communal_house', label: 'Nhà Rông Tây Nguyên (1800-45)', prompt: `Convert this structure into a majestic 'Nhà Rông,' the communal house of the Ba Na or Gia Rai ethnic groups in the Central Highlands (1800-1945). It must have a towering, steeply pitched thatched roof resembling an axe head, supported by a sturdy wooden frame. Place it at the center of a village, with smaller stilt houses around it, embodying the spiritual and social heart of the community.` },
  { id: 'cham_cultural_influence', label: 'Văn hóa Chăm (Trung Kỳ 1800-45)', prompt: `Reimagine the building as a cultural hall or a prominent residence in a Chăm village in coastal Central Vietnam (Trung Kỳ) between 1800-1945. Integrate architectural motifs from Chăm temples, such as terracotta reliefs, boat-shaped roof details, and decorative brickwork, into a period-appropriate structure. The surrounding landscape should be arid, with sand and cacti, and feature villagers in traditional Chăm attire.` },
];


const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<FileWithPreview | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string>('A modern, minimalist building with large glass windows and a wooden facade.');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file),
    });
    setUploadedImage(fileWithPreview);
    setGeneratedImage(null);
    setError(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image of a building block first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { base64, mimeType } = await fileToBase64(uploadedImage);
      const initialPrompt = `Based on the following geometric shape, render a complete, photorealistic architectural building. The style should be: ${stylePrompt}. Focus on realistic lighting, textures, and environmental context.`;
      const result = await generateImageFromImageAndText(base64, mimeType, initialPrompt);
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, stylePrompt]);

  const handleGenerateViewClick = useCallback(async (viewPrompt: string) => {
    if (!generatedImage) {
      setError('A base image must be generated first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [header, base64Data] = generatedImage.split(',');
      if (!header || !base64Data) {
        throw new Error('Invalid generated image format.');
      }
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      
      const result = await generateImageFromImageAndText(base64Data, mimeType, viewPrompt);
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the new view.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Control Panel */}
          <div className="flex flex-col space-y-6 bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
            <div>
              <label htmlFor="image-upload" className="block text-lg font-semibold mb-2 text-cyan-400">
                1. Tải lên hình khối
              </label>
              <ImageUploader onImageUpload={handleImageUpload} uploadedImagePreview={uploadedImage?.preview} />
            </div>

            <div>
              <label htmlFor="style-prompt" className="block text-lg font-semibold mb-2 text-cyan-400">
                2. Mô tả phong cách kiến trúc
              </label>
              <textarea
                id="style-prompt"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="e.g., A brutalist tower made of concrete, a cozy Scandinavian cabin..."
                className="w-full h-32 p-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleGenerateClick} disabled={!uploadedImage || isLoading}>
                {isLoading ? 'Đang tạo...' : 'Tạo thiết kế'}
              </Button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="flex flex-col bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-cyan-400">
              3. Kết quả từ AI
            </h2>
            <ResultDisplay
              isLoading={isLoading}
              generatedImage={generatedImage}
              error={error}
            />

            {generatedImage && !isLoading && !error && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-md font-semibold mb-4 text-cyan-400">
                  Khám phá các góc nhìn khác
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {viewOptions.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => handleGenerateViewClick(view.prompt)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white disabled:bg-gray-700/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200"
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;