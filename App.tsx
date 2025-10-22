
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Button from './components/Button';
import OptionGroup from './components/OptionGroup';
import { generateImageFromImageAndText } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { FileWithPreview } from './types';

const cameraAnglesAndViews = [
  { id: 'interior', label: 'Nội thất', prompt: 'Show a photorealistic interior view of this building, focusing on a beautifully designed living space that matches the exterior architectural style.' },
  { id: 'rear', label: 'Mặt sau', prompt: 'Show a photorealistic view of the rear facade of this building, maintaining the same architectural style and level of detail as the front.' },
  { id: 'frontal', label: 'Chính diện', prompt: 'Render a full frontal view of the building, perfectly centered and symmetrical, showcasing the main entrance and facade details.' },
  { id: 'left_3_4', label: 'Góc 3/4 trái', prompt: 'Render a 3/4 angle view from the left, showing both the front and side facades to give a sense of depth and volume.' },
  { id: 'right_3_4', label: 'Góc 3/4 phải', prompt: 'Render a 3/4 angle view from the right, capturing the building\'s depth and relationship with its immediate surroundings.' },
  { id: 'drone', label: 'Nhìn từ trên cao (Drone)', prompt: 'Show a photorealistic aerial drone view from directly above, highlighting the roof design, layout, and the entire surrounding campus or landscape.' },
  { id: 'low_angle', label: 'Góc nhìn thấp', prompt: 'Render a low-angle shot looking up at the building to emphasize its height, grandeur, and imposing presence against the sky.' },
  { id: 'close_up', label: 'Cận cảnh chi tiết', prompt: 'Generate a close-up view focusing on the main entrance and the texture of the facade materials. Highlight the craftsmanship and material details like stone, wood, or metalwork.' },
  { id: 'seno_console_closeup', label: 'Cận cảnh Sê-nô/Console', prompt: `Generate a detailed close-up of a "sê-nô" or cantilevered console balcony, a characteristic feature of Indochine architecture. Focus on the ornate decorative patterns, the texture of the materials (like plaster, tile, or wrought iron), and how it integrates with the window and wall facade.` },
  { id: 'framed_view', label: 'Nhìn qua khung cảnh', prompt: 'Render the building as seen through a natural frame, like looking through trees, foliage, or an archway. This should create a sense of discovery and integrate the building with its landscape.' },
  { id: 'view_from_inside', label: 'Nhìn từ trong ra', prompt: 'Show a view from inside the building or just inside the main gate, looking out towards the garden or street. This should create a feeling of shelter and connection between the interior and exterior.' },
  { id: 'panorama', label: 'Toàn cảnh (Panorama)', prompt: 'Generate a wide, horizontal panoramic view of the building that encompasses its full width and the surrounding environment, showing how it sits within its context.' },
];

const environmentalTransformations = [
  { id: 'night_lighting', label: 'Ban đêm (Ánh sáng đẹp)', prompt: 'Show a photorealistic view of this building at night, emphasizing the artificial lighting design. Highlight how spotlights, interior lights, and landscape lighting create a dramatic and inviting atmosphere.' },
  { id: 'twilight_after_rain', label: 'Chiều tà sau mưa', prompt: 'Tái hiện tòa nhà này trong một khung cảnh chiều tà lãng mạn ngay sau một cơn mưa. Đường phố phải ướt đẫm, lấp loáng phản chiếu ánh đèn vàng từ các cửa sổ và đèn đường. Bầu trời nên có màu sắc ấm của hoàng hôn, có thể vẫn còn những gợn mây mưa. Bầu không khí phải trong lành, yên tĩnh và có chút hoài cổ.' },
  { id: 'sunset_after_rain', label: 'Hoàng hôn sau mưa', prompt: 'Tái hiện tòa nhà này trong một khung cảnh hoàng hôn rực rỡ ngay sau một cơn mưa. Đường phố ướt đẫm, phản chiếu mạnh mẽ những màu sắc cam, hồng, và tím của bầu trời hoàng hôn. Ánh đèn từ tòa nhà và đèn đường tạo ra những vệt sáng lấp lánh trên mặt đường ướt. Bầu không khí trong lành, lãng mạn và đầy kịch tính.' },
  { id: 'hoian_riverside', label: 'Bờ sông Hội An', prompt: 'Integrate this building along the riverside of ancient Hoi An, Vietnam. The scene should feature yellow-walled houses, colorful lanterns, and small wooden boats on the river. The lighting should be warm, like late afternoon sun, reflecting the romantic and peaceful atmosphere of the old town.' },
  { id: 'saigon_alley', label: 'Hẻm Sài Gòn xưa', prompt: 'Situate this building within a narrow, vibrant alley of old Saigon. The scene should be full of life, with hanging electrical wires, small street food stalls, and classic motorbikes. The architecture should be adapted to fit into the dense, energetic urban fabric of a historic Vietnamese alley.' },
  { id: 'sapa_market', label: 'Chợ phiên Sapa', prompt: `Place this building in a vibrant Sapa market scene. The surroundings should be filled with H'Mong and Dao ethnic people dressed in their intricate, colorful traditional clothing. In the background, show the iconic terraced rice paddies of the northern Vietnamese mountains. The overall mood should be lively and culturally rich.` },
  { id: 'mekong_floating_market', label: 'Chợ nổi miền Tây', prompt: `Integrate this building onto the riverbank of a bustling Mekong Delta floating market. The scene should be crowded with wooden boats selling fruits and vegetables. People should be wearing traditional 'Áo Bà Ba' and conical hats ('Nón Lá'). The atmosphere should feel sunny, tropical, and full of life.` },
  { id: 'hue_imperial', label: 'Cố đô Huế', prompt: `Situate this building within the serene and elegant context of the Hue Imperial City. The scene should include Vietnamese people dressed in traditional, formal 'Áo Dài', walking through gardens or courtyards typical of the ancient capital. The architecture should blend respectfully with the historical and royal ambiance of Hue.` },
  { id: 'central_highlands_festival', label: 'Lễ hội Tây Nguyên', prompt: `Place this building in a village in Vietnam's Central Highlands during a cultural festival. The scene should feature Ede or Jarai ethnic people in their traditional woven attire, perhaps gathered around a 'Nhà Rông' (communal house) or participating in a gong performance. The surrounding landscape should be lush with coffee plantations or forests.` },
  { id: 'hue_garden_truong_house', label: 'Vườn Huế nhà họ Trương', prompt: `Place this building within a traditional Hue-style garden, characteristic of a 'nhà vườn' (garden house) belonging to a noble clan like the Truong family. The garden should be serene and poetic, featuring a small lotus pond, an ornate 'hòn non bộ' (rockery), ancient bonsai trees, and winding stone paths. The entrance to the garden should be a traditional moon gate or an intricately decorated gate. The building's architecture should be adapted to harmonize with the garden, perhaps reflecting the style of a traditional Hue 'nhà rường' with a dark tiled roof and wooden pillars. The atmosphere should be one of timeless elegance and tranquility.` },
]

const historicalAndCulturalStyles = [
  { id: 'cholon_saigon_1824_1946', label: 'Chợ Lớn - Sài Gòn (1824-46)', prompt: `Tái hiện tòa nhà này trong bối cảnh khu phố thương mại sầm uất của Chợ Lớn - Sài Gòn giai đoạn 1824-1946. Kiến trúc là sự pha trộn giữa kiểu nhà phố (shophouse) truyền thống của người Hoa miền Nam và ảnh hưởng kiến trúc Pháp thuộc thời kỳ đầu. Tòa nhà nên có cấu trúc thấp tầng, mái ngói, cửa sổ lá sách bằng gỗ, và tường trát vữa. Đường phố phải sống động với xe kéo, hàng rong, và người dân trong trang phục thời xưa, phản ánh không khí đa văn hóa và nhộn nhịp của trung tâm thương mại Sài Gòn lịch sử.` },
  { id: 'saigon_street_1828_1966', label: 'Đường phố Sài Gòn 1828 - 1966', prompt: `Tái hiện tòa nhà này trên một con phố Sài Gòn sôi động, phản ánh sự phát triển kiến trúc từ năm 1828 đến 1966. Cảnh quan đường phố nên là sự kết hợp của các tòa nhà thuộc địa Pháp trang nghiêm, nhà phố truyền thống Việt Nam, và các công trình kiến trúc hiện đại ban đầu của giữa thế kỷ 20. Con đường phải tràn đầy sức sống với sự pha trộn của xe kéo, xe máy cổ điển, và người dân trong trang phục đa dạng từ áo dài truyền thống đến thời trang phương Tây, thể hiện sự biến đổi năng động của thành phố qua nhiều thời kỳ lịch sử.` },
  { id: 'hanoi_36_streets', label: 'Hà Nội 36 Phố Phường (1828-54)', prompt: `Place this building within the iconic '36 Streets' of Hanoi's Old Quarter, planned between 1828-1954. The architecture should be a mix of traditional Vietnamese 'tube houses' and early French colonial styles, featuring long, narrow facades, tiled roofs, and wooden shutters. The street should be narrow and bustling with pedestrians, cyclos, and street vendors, capturing the dense, historic, and vibrant commercial atmosphere of old Hanoi.` },
  { id: 'street_view_hanoi', label: 'Đường phố Hà Nội xưa', prompt: 'Place this building on a bustling street in old Hanoi, Vietnam. The scene should include traditional tube houses, cyclos, and people in ao dai. Maintain the building\'s original architecture but integrate it seamlessly into the historical Vietnamese cityscape with a nostalgic, slightly faded color palette.' },
  { id: 'hao_si_phuong_cholon', label: 'Phố Hảo Sĩ Phường (Chợ Lớn)', prompt: `Place this building into the iconic Hao Si Phuong alley in Cho Lon, Ho Chi Minh City. The architecture should reflect the Southern Chinese style brought by Ming Dynasty refugees. Feature the characteristic dense, colorful, and slightly weathered apartment blocks surrounding a central courtyard. The scene should be vibrant and authentic, with details like hanging laundry, intricate ironwork on balconies, and a sense of close-knit community life, evoking the unique historical atmosphere of this well-known Chinese quarter.` },
  { id: 'mekong_nguyen_dynasty', label: 'Miền Tây triều Nguyễn', prompt: `Situate this building in the Mekong Delta, adapting its decorative elements with influence from Nguyen Dynasty art. Feature intricate wooden carvings and ceramic mosaics typical of Hue's imperial style, but integrated into a traditional riverside wooden house. The scene is on a riverbank with coconut palms, with locals in 'Áo Bà Ba' on small boats, creating a unique fusion of royal elegance and rustic tropical charm.` },
  { id: 'indochine_kinh_culture', label: 'Đông Dương (Văn hóa Kinh)', prompt: `Transform this building into a major public, cultural, or religious structure in the Indochine style, representative of Vietnam's Kinh ethnic group across Tonkin, Annam, and Cochinchina (Bắc, Trung, và Nam Kỳ). The design should blend French colonial architecture (Neoclassical, Art Deco) with traditional Vietnamese aesthetics. Imagine it as a grand theater, a communal temple (đình), a historic pagoda, or a cathedral from that era. Key features must include yin-yang tiled roofs, intricate wooden carvings, ceramic details, and symmetrical structures. Place the building in a historical urban setting characteristic of one of the three regions, evoking a dignified and nostalgic grandeur.` },
  { id: 'northern_stilt_house', label: 'Nhà sàn miền Bắc (1800-45)', prompt: `Transform this building into a large, traditional wooden stilt house ('nhà sàn') of the Tay or Thai ethnic people in Northern Vietnam, dated between 1800-1945. The structure should be elevated, made of dark, weathered wood and bamboo, with a thatched or leaf-covered roof. Place it in a serene valley surrounded by green rice paddies and limestone mountains.` },
  { id: 'hmong_stone_house', label: `Nhà trình tường H'Mông (1800-45)`, prompt: `Reimagine this building as a traditional H'mong house from the 1800-1945 period. It must feature thick, pounded earth walls ('nhà trình tường') and a heavy stone tile roof. Set the house on a high, rocky plateau like the Dong Van Karst Plateau, enclosed by characteristic stone fences. The scene should convey a sense of resilience and harmony with the rugged mountain landscape.` },
  { id: 'central_highlands_communal_house', label: 'Nhà Rông Tây Nguyên (1800-45)', prompt: `Convert this structure into a majestic 'Nhà Rông,' the communal house of the Ba Na or Gia Rai ethnic groups in the Central Highlands (1800-1945). It must have a towering, steeply pitched thatched roof resembling an axe head, supported by a sturdy wooden frame. Place it at the center of a village, with smaller stilt houses around it, embodying the spiritual and social heart of the community.` },
  { id: 'cham_cultural_influence', label: 'Văn hóa Chăm (Trung Kỳ 1800-45)', prompt: `Reimagine the building as a cultural hall or a prominent residence in a Chăm village in coastal Central Vietnam (Trung Kỳ) between 1800-1945. Integrate architectural motifs from Chăm temples, such as terracotta reliefs, boat-shaped roof details, and decorative brickwork, into a period-appropriate structure. The surrounding landscape should be arid, with sand and cacti, and feature villagers in traditional Chăm attire.` },
  { id: 'interior_us_viet_45_75', label: 'Nội thất Mỹ-Việt (1945-75)', prompt: `Show a photorealistic interior view of this building. The style is a fusion of American modernism from the 1945-1975 period and traditional Vietnamese/Nguyen Dynasty aesthetics. Incorporate mid-century modern furniture, clean lines, and open spaces, but with Vietnamese elements like carved wooden panels, mother-of-pearl inlay, and local pottery, creating a unique, sophisticated, and culturally syncretic living space.` },
];

const architecturalStyles = [
  { id: 'tam_quan_gate', label: 'Cổng Tam Quan & Bình Phong', prompt: `Reimagine the main entrance of this building as a traditional Vietnamese 'Cổng Tam Quan' (Three-entrance Gate). Directly in front of it, add a decorative 'bình phong' (screen). Both structures should feature ornate details typical of imperial or temple architecture, such as yin-yang roof tiles, carved reliefs, and ceramic mosaics, while harmonizing with the building's overall style.` },
  { id: 'tropical_southern_vietnam', label: 'Kiến trúc nhiệt đới 2 mùa (Miền Nam)', prompt: `Transform this building into a tropical architectural style perfectly adapted for the two distinct seasons (rainy and dry) of Southern Vietnam. The key feature must be a double-layer corridor system providing ample shade during the sunny season and complete protection from heavy downpours during the monsoon season. Emphasize natural ventilation, use local materials like wood and terracotta tiles, and surround the building with a lush, tropical garden that thrives in this climate.` },
];

const westernArchitecturalStyles = [
  // A. Ancient Styles
  { id: 'ancient_greek', label: 'Hy Lạp cổ đại', prompt: 'Transform this building into Ancient Greek Architecture. Emphasize classical elements like Doric, Ionic, or Corinthian columns, pediments, and symmetry. The material should be marble or stone.' },
  { id: 'ancient_roman', label: 'La Mã cổ đại', prompt: 'Transform this building into Ancient Roman Architecture. Emphasize arches, vaults, and domes, using concrete and stone. It should feel monumental.' },
  // B. Medieval and Renaissance Styles
  { id: 'roman_architecture', label: 'Kiến trúc Roman', prompt: 'Transform this building in the Roman architectural style, which can refer to either Ancient Roman (arches, domes) or Romanesque (thick walls, rounded arches). The AI should interpret and apply the most fitting Roman-inspired characteristics.' },
  { id: 'romanesque', label: 'Romanesque', prompt: 'Transform this building in the Romanesque style, with thick walls, semi-circular arches, sturdy piers, and large towers.' },
  { id: 'byzantine', label: 'Byzantine', prompt: 'Transform this building into the Byzantine style, featuring massive domes on pendentives, rounded arches, and elaborate mosaics.' },
  { id: 'gothic', label: 'Gothic', prompt: 'Render this building in a dramatic Gothic architectural style, emphasizing pointed arches, ribbed vaults, flying buttresses, and ornate tracery. Use a dark, moody color palette with dramatic lighting to highlight the intricate details.' },
  { id: 'early_english_gothic', label: 'Tiền Gothic Anh', prompt: 'Transform this building in the Early English Gothic style, with pointed arches, lancet windows, and simple, elegant forms.' },
  { id: 'decorated_gothic', label: 'Gothic trang trí', prompt: 'Transform this building in the Decorated Gothic style, with elaborate window tracery, intricate carvings, and flowing patterns.' },
  { id: 'perpendicular_gothic', label: 'Gothic trực giao', prompt: 'Transform this building in the Perpendicular Gothic style, emphasizing vertical lines, large windows, and fan vaulting.' },
  { id: 'renaissance', label: 'Phục Hưng', prompt: 'Transform this building into Renaissance architecture, with an emphasis on symmetry, proportion, and geometry, using classical elements.' },
  { id: 'palladianism', label: 'Paladio', prompt: 'Transform this building into the Palladian style, characterized by symmetry and classical forms based on the designs of Andrea Palladio.' },
  // C. Baroque and Rococo Styles
  { id: 'baroque', label: 'Baroque', prompt: 'Transform this building into the Baroque style, featuring dramatic forms, opulent ornamentation, and a sense of movement and grandeur.' },
  { id: 'sicilian_baroque', label: 'Sicilian Baroque', prompt: 'Transform this building into the Sicilian Baroque style, known for its dynamic curves, theatrical flair, and highly decorative facades.' },
  { id: 'rococo', label: 'Rococo', prompt: 'Transform this building into the Rococo style, with elaborate ornamentation, pastel colors, and asymmetrical, playful designs.' },
  // D. Neoclassical and Revival Styles
  { id: 'empire_style', label: 'Đế chế', prompt: 'Transform this building into the Empire style, a phase of Neoclassicism characterized by monumental scale and imperial grandeur.' },
  { id: 'federal_style', label: 'Federal', prompt: 'Transform this building into the Federal style of American architecture, featuring symmetry, elliptical fanlights, and delicate decorative elements.' },
  { id: 'georgian_style', label: 'George', prompt: 'Transform this building into the Georgian style, characterized by symmetry, classical proportions, and simple, elegant facades.' },
  { id: 'american_empire', label: 'American Empire', prompt: 'Transform this building into the American Empire style, a neoclassical style with bold forms, classical columns, and patriotic motifs.' },
  { id: 'neoclassicism', label: 'Tân cổ điển', prompt: 'Transform this building into the Neoclassical style, inspired by ancient Greece and Rome, emphasizing grandeur and symmetry.' },
  { id: 'classical_revival', label: 'Phục hồi cổ điển', prompt: 'Transform this building into the Classical Revival style, reviving the forms and motifs of ancient Greek and Roman architecture.' },
  { id: 'beaux_arts', label: 'Beaux-Arts', prompt: 'Transform this building into the Beaux-Arts style, known for its grand, ornate, and monumental designs combining classical and baroque forms.' },
  { id: 'gothic_revival', label: 'Gothic phục sinh', prompt: 'Transform this building into the Gothic Revival style, reviving medieval Gothic forms with pointed arches and castellated details.' },
  { id: 'neo_gothic', label: 'Tân Gothic', prompt: 'Transform this building into the Neo-Gothic style, a revival of Gothic architecture featuring pointed arches, ribbed vaults, and decorative tracery.' },
  { id: 'greek_style', label: 'Hy Lạp', prompt: 'Transform this building in the Greek style, focusing on columns, pediments, and symmetrical forms reminiscent of ancient Greek temples.' },
  { id: 'greek_revival', label: 'Hy Lạp phục sinh', prompt: 'Transform this building into the Greek Revival style, characterized by Greek columns, pediments, and a monumental, temple-like appearance.' },
  { id: 'neo_grec', label: 'Tân Hy Lạp', prompt: 'Transform this building into the Neo-Grec style, a neoclassical style that incorporates stylized classical Greek elements.' },
  { id: 'romanesque_revival', label: 'Romanesque Revival', prompt: 'Transform this building into the Romanesque Revival style, featuring rounded arches, thick walls, and massive, solid forms.' },
  { id: 'neo_byzantine', label: 'Tân Byzantine', prompt: 'Transform this building into the Neo-Byzantine style, characterized by large domes, rounded arches, and decorative mosaics.' },
  { id: 'colonial_revival', label: 'Thuộc địa phục sinh', prompt: 'Transform this building into the Colonial Revival style, reviving elements of American colonial architecture with symmetry and classical details.' },
  { id: 'spanish_colonial_revival', label: 'Spanish Colonial Revival', prompt: 'Transform this building into the Spanish Colonial Revival style, with low-pitched red tile roofs, stucco walls, and arched openings.' },
  // E. 19th and Early 20th Century Styles
  { id: 'elizabethan', label: 'Elizabet - Anh', prompt: 'Transform this building into the Elizabethan style, featuring large multi-paned windows, half-timbering, and complex rooflines.' },
  { id: 'tudor', label: 'Tudor', prompt: 'Transform this building into the Tudor style, characterized by half-timbering, steeply pitched roofs, and prominent gables.' },
  { id: 'queen_anne', label: 'Queen Anne', prompt: 'Transform this building into the Queen Anne style, featuring asymmetrical facades, turrets, and ornate decorative details.' },
  { id: 'second_empire', label: 'Second Empire', prompt: 'Transform this building into the Second Empire style, characterized by a mansard roof, dormer windows, and ornate classical details.' },
  { id: 'eclecticism', label: 'Chiết trung', prompt: 'Transform this building into an Eclectic style, borrowing elements from a variety of historical styles to create a unique design.' },
  { id: 'art_nouveau', label: 'Art Nouveau', prompt: 'Transform this building into the Art Nouveau style, with flowing, organic lines, decorative ironwork, and nature-inspired motifs.' },
  { id: 'chicago_school', label: 'Chicago', prompt: 'Transform this building into the Chicago School style, an early skyscraper with a steel-frame structure and large windows.' },
  { id: 'art_deco', label: 'Art Deco', prompt: 'Transform this building into the Art Deco style, featuring sleek, geometric forms, bold lines, and decorative patterns.' },
  // F. Modern and Post-Modern Styles
  { id: 'modern', label: 'Hiện đại', prompt: 'Transform this building into Modern architecture, with clean lines, simple forms, and an emphasis on function over ornamentation.' },
  { id: 'bauhaus', label: 'Bauhaus', prompt: 'Transform this building into the Bauhaus style, combining arts and crafts with an emphasis on functionality and simple geometric forms.' },
  { id: 'streamline_moderne', label: 'Cận hiện đại Mỹ', prompt: 'Transform this building into the Streamline Moderne style, with curving forms, long horizontal lines, and nautical elements.' },
  { id: 'russian_constructivism', label: 'Kết cấu Nga', prompt: 'Transform this building into Russian Constructivist architecture, with an emphasis on geometric abstraction and social purpose.' },
  { id: 'expressionism', label: 'Biểu hiện', prompt: 'Transform this building into Expressionist architecture, with distorted forms and a focus on emotional expression.' },
  { id: 'soviet_style', label: 'Soviet', prompt: 'Transform this building into Soviet style architecture, often characterized by monumental scale and brutalist forms.' },
  { id: 'postmodern', label: 'Hậu Hiện đại', prompt: 'Transform this building into Postmodern architecture, with a playful mix of historical references, bold colors, and unconventional forms.' },
  { id: 'post_postmodern', label: 'Hậu-Hậu Hiện đại', prompt: 'Transform this building into Post-Postmodern architecture, exploring themes of complexity and digital fabrication.' },
  { id: 'deconstructivism', label: 'Giải tỏa kết cấu', prompt: 'Transform this building into Deconstructivist architecture, with fragmented forms, distorted structures, and a sense of controlled chaos.' },
  { id: 'high_tech', label: 'High-Tech', prompt: 'Transform this building into High-Tech architecture, with an emphasis on exposing the building\'s structural and mechanical systems.' },
  { id: 'archigram', label: 'Archigram', prompt: 'Transform this building in the style of Archigram, a futuristic style featuring modular structures and mobile elements.' },
  // G. Regional and Other Styles
  { id: 'persian', label: 'Ba Tư', prompt: 'Transform this building into Persian architecture, characterized by intricate tilework, domes, and serene courtyards.' },
  { id: 'bosnian', label: 'Bosna', prompt: 'Transform this building into Bosnian architecture, showing influences from Ottoman and Austro-Hungarian styles.' },
  { id: 'colonial', label: 'Thuộc địa', prompt: 'Transform this building into Colonial style architecture, adapted to local climates and materials.' },
  { id: 'spanish_colonial', label: 'Spanish Colonial', prompt: 'Transform this building into Spanish Colonial architecture, with stucco walls, red tile roofs, and courtyards.' },
  { id: 'moorish', label: 'Moroc', prompt: 'Transform this building into Moorish/Moroccan style, featuring intricate tilework (zellige) and horseshoe arches.' },
  { id: 'mudejar', label: 'Mudéjar', prompt: 'Transform this building into the Mudéjar style, a fusion of Moorish and European traditions with ornate brickwork.' },
];


const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<FileWithPreview | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string>("Tái hiện tòa nhà này trong bối cảnh khu phố thương mại sầm uất của Chợ Lớn - Sài Gòn giai đoạn 1824-1946. Kiến trúc là sự pha trộn giữa kiểu nhà phố (shophouse) truyền thống của người Hoa miền Nam và ảnh hưởng kiến trúc Pháp thuộc thời kỳ đầu. Tòa nhà nên có cấu trúc thấp tầng, mái ngói, cửa sổ lá sách bằng gỗ, và tường trát vữa. Đường phố phải sống động với xe kéo, hàng rong, và người dân trong trang phục thời xưa, phản ánh không khí đa văn hóa và nhộn nhịp của trung tâm thương mại Sài Gòn lịch sử.");
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

  const renderViewButton = (view: {id: string; label: string; prompt: string}) => (
    <button
      key={view.id}
      onClick={() => handleGenerateViewClick(view.prompt)}
      disabled={isLoading}
      className="w-full px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white disabled:bg-gray-700/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200"
    >
      {view.label}
    </button>
  );

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
                  Khám phá & Biến đổi
                </h3>
                <div className="flex flex-col">
                  <OptionGroup title="Góc nhìn & Máy quay" defaultOpen>
                    {cameraAnglesAndViews.map(renderViewButton)}
                  </OptionGroup>
                   <OptionGroup title="Bối cảnh & Môi trường">
                    {environmentalTransformations.map(renderViewButton)}
                  </OptionGroup>
                   <OptionGroup title="Phong cách Lịch sử & Văn hóa">
                    {historicalAndCulturalStyles.map(renderViewButton)}
                  </OptionGroup>
                   <OptionGroup title="Phong cách Kiến trúc">
                    {architecturalStyles.map(renderViewButton)}
                  </OptionGroup>
                  <OptionGroup title="Phong cách Kiến trúc & Trường phái Nghệ thuật">
                    {westernArchitecturalStyles.map(renderViewButton)}
                  </OptionGroup>
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
