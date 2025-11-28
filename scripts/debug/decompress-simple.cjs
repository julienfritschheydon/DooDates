const LZString = require('lz-string');

const data = '㞂⃆འ瘆ɰ㎁ం椤˦¾Ð耭鱊ꀹ蕺ቹ梠঺⧒㳉攞 쀎考࢐Ⓚ⎎踳棸ɦᒠ⬀婡ĸ띨ʯ쀻⸀찀�ໟ�⵱ �䚎堰ᒒ칚덎麡覩耇⸒耋₹ꡩ莉ᰀހΆᒒʟ몆뼰遱馥ꦵ궂䠆ሀ㢀⮅⊮ᨂᵁĐ';

console.log('🔍 Décompression des données localStorage...');

try {
  const decompressed = LZString.decompress(data);
  
  if (decompressed) {
    const parsed = JSON.parse(decompressed);
    
    console.log('✅ Décompression réussie!');
    console.log('📦 Structure:', Object.keys(parsed));
    
    if (parsed.conversations) {
      console.log('\n💬 Conversations (' + Object.keys(parsed.conversations).length + '):');
      Object.values(parsed.conversations).forEach((conv, i) => {
        console.log(`${i+1}. "${conv.title}"`);
        console.log(`   ID: ${conv.id}`);
        console.log(`   Status: ${conv.status}`);
        console.log(`   Messages: ${conv.messageCount}`);
        console.log(`   Créé: ${new Date(conv.createdAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    if (parsed.messages) {
      console.log('📝 Messages par conversation:');
      Object.entries(parsed.messages).forEach(([convId, messages]) => {
        console.log(`\nConversation ${convId} (${messages.length} messages):`);
        messages.forEach((msg, i) => {
          console.log(`  ${i+1}. [${msg.role}] ${msg.content.substring(0, 80)}...`);
        });
      });
    }
    
    if (parsed.metadata) {
      console.log('\n🔧 Métadonnées:');
      console.log(JSON.stringify(parsed.metadata, null, 2));
    }
    
  } else {
    console.log('❌ Décompression échouée - données invalides');
  }
  
} catch (error) {
  console.log('❌ Erreur:', error.message);
}
