// Script pour décompresser les données localStorage
import LZString from "lz-string";

// Données compressées copiées depuis localStorage
const compressedData = `㞂⃆འ瘆ɰ㎁ం椤˦¾Ð耭鱊ꀹ蕺ቹ梠঺⧒㳉攞 쀎考࢐Ⓚ⎎踳棸ɦᒠ⬀婡ĸ띨ʯ쀻⸀찀�ໟ�⵱ �䚎堰ᒒ칚덎麡覩耇⸒耋₹ꡩ莉ᰀހΆᒒʟ몆뼰遱馥ꦵ궂䠆ሀ㢀⮅⊮ᨂᵁĐ`;

try {
  console.log("🔍 Décompression des données localStorage...");

  const decompressed = LZString.decompress(compressedData);

  if (decompressed) {
    const parsed = JSON.parse(decompressed);

    console.log("\n📦 Structure des données:");
    console.log("- Conversations:", Object.keys(parsed.conversations || {}).length);
    console.log("- Messages:", Object.keys(parsed.messages || {}).length);

    console.log("\n💬 Conversations stockées:");
    if (parsed.conversations) {
      Object.values(parsed.conversations).forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.title} (ID: ${conv.id})`);
        console.log(`   - Status: ${conv.status}`);
        console.log(`   - Messages: ${conv.messageCount}`);
        console.log(`   - Créé: ${new Date(conv.createdAt).toLocaleString()}`);
        console.log("");
      });
    }

    console.log("\n📝 Messages stockés:");
    if (parsed.messages) {
      Object.entries(parsed.messages).forEach(([convId, messages]) => {
        console.log(`Conversation ${convId}:`);
        messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
        });
        console.log("");
      });
    }

    console.log("\n🔧 Métadonnées:");
    if (parsed.metadata) {
      console.log(JSON.stringify(parsed.metadata, null, 2));
    }
  } else {
    console.log("❌ Échec de la décompression");
  }
} catch (error) {
  console.error("❌ Erreur:", error.message);
}
