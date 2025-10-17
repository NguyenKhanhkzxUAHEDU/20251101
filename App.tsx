import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Button from './components/Button';
import { generateImageFromImageAndText } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { FileWithPreview } from './types';

const viewOptions = [
  // Standard Views & Camera Angles
  { id: 'interior', label: 'Nội thất', prompt: 'Show a photorealistic interior view of this building, focusing on a beautifully designed living space that matches the exterior architectural style.' },
  { id: 'rear', label: 'Mặt sau', prompt: 'Show a photorealistic view of the rear facade of this building, maintaining the same architectural style and level of detail as the front.' },
  { id: 'frontal', label: 'Chính diện', prompt: 'Render a full frontal view of the building, perfectly centered and symmetrical, showcasing the main entrance and facade details.' },
  { id: 'left_3_4', label: 'Góc 3/4 trái', prompt: 'Render a 3/4 angle view from the left, showing both the front and side facades to give a sense of depth and volume.' },
  { id: 'right_3_4', label: 'Góc 3/4 phải', prompt: 'Render a 3/4 angle view from the right, capturing the building\'s depth and relationship with its immediate surroundings.' },
  { id: 'drone', label: 'Nhìn từ trên cao (Drone)', prompt: 'Show a photorealistic aerial drone view from directly above, highlighting the roof design, layout, and the entire surrounding campus or landscape.' },
  { id: 'low_angle', label: 'Góc nhìn thấp', prompt: 'Render a low-angle shot looking up at the building to emphasize its height, grandeur, and imposing presence against the sky.' },
  { id: 'close_up', label: 'Cận cảnh chi tiết', prompt: 'Generate a close-up view focusing on the main entrance and the texture of the facade materials. Highlight the craftsmanship and material details like stone, wood, or metalwork.' },
  { id: 'framed_view', label: 'Nhìn qua khung cảnh', prompt: 'Render the building as seen through a natural frame, like looking through trees, foliage, or an archway. This should create a sense of discovery and integrate the building with its landscape.' },
  { id: 'view_from_inside', label: 'Nhìn từ trong ra', prompt: 'Show a view from inside the building or just inside the main gate, looking out towards the garden or street. This should create a feeling of shelter and connection between the interior and exterior.' },
  { id: 'night_lighting', label: 'Ban đêm (Ánh sáng đẹp)', prompt: 'Show a photorealistic view of this building at night, emphasizing the artificial lighting design. Highlight how spotlights, interior lights, and landscape lighting create a dramatic and inviting atmosphere.' },
  { id: 'panorama', label: 'Toàn cảnh (Panorama)', prompt: 'Generate a wide, horizontal panoramic view of the building that encompasses its full width and the surrounding environment, showing how it sits within its context.' },
  
  // Stylistic & Cultural Transformations
  { id: 'gothic', label: 'Kiến trúc Gothic', prompt: 'Render this building in a dramatic Gothic architectural style, emphasizing pointed arches, ribbed vaults, flying buttresses, and ornate tracery. Use a dark, moody color palette with dramatic lighting to highlight the intricate details.' },
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
  { id: 'interior_us_viet_45_75', label: 'Nội thất Mỹ-Việt (1945-75)', prompt: `Show a photorealistic interior view of this building. The style is a fusion of American modernism from the 1945-1975 period and traditional Vietnamese/Nguyen Dynasty aesthetics. Incorporate mid-century modern furniture, clean lines, and open spaces, but with Vietnamese elements like carved wooden panels, mother-of-pearl inlay, and local pottery, creating a unique, sophisticated, and culturally syncretic living space.` },
];

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<FileWithPreview | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string>('A grand public building in the Indochine architectural style, blending French colonial elegance with traditional Vietnamese elements. Features include a symmetrical layout, yin-yang tiled roofs, and ornate details. Set in a historic Southeast Asian city context.');
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
  
  const handleDownloadClick = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `ai-architect-vision-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <>
                <div className="mt-6">
                  <button
                    onClick={handleDownloadClick}
                    className="w-full flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-lg text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Tải xuống hình ảnh
                  </button>
                </div>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;