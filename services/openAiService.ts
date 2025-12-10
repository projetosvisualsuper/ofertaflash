// ... (código omitido)

/**
 * Função para gerar áudio usando a Edge Function de TTS (agora ElevenLabs).
 * Retorna um URL de objeto local (Blob URL) para reprodução.
 */
export const generateAudioFromText = async (text: string): Promise<string> => {
  // NOTA: A Edge Function 'gerar-audio' agora chama a 'elevenlabs-tts' internamente.
  const { data, error } = await supabase.functions.invoke('gerar-audio', {
    method: 'POST',
    body: { text },
    options: { responseType: 'arraybuffer' } 
  });

  if (error) {
    console.error("Error invoking 'gerar-audio' Edge Function:", error);
    // Tenta extrair a mensagem de erro detalhada da Edge Function
    const errorDetails = (error as any).context?.body?.error || error.message;
    throw new Error(`Falha na geração de áudio: ${errorDetails}`);
  }
  
  if (!data) {
      throw new Error("A Edge Function retornou dados vazios.");
  }
  
  // CRITICAL CHECK: Se o ArrayBuffer for muito pequeno (ex: < 10KB), é um erro.
  const MIN_AUDIO_SIZE_BYTES = 10000; 
  if (data.byteLength < MIN_AUDIO_SIZE_BYTES) {
      console.warn(`Audio data is too small (${data.byteLength} bytes). Assuming API key or voice ID error.`);
      
      // Tenta decodificar como erro JSON antes de lançar o erro de tamanho
      try {
        const decoder = new TextDecoder('utf-8');
        const textData = decoder.decode(data);
        const errorJson = JSON.parse(textData);
        
        if (errorJson.error) {
            // Se for um erro JSON retornado pelo backend, lança o erro
            throw new Error(errorJson.error);
        }
      } catch (e) {
        // Se falhar a decodificação, lança o erro de tamanho
      }
      
      // MENSAGEM DE ERRO MAIS CLARA
      throw new Error(`Falha na geração de áudio. O arquivo retornado é muito pequeno (${data.byteLength} bytes). Verifique se a ELEVENLABS_API_KEY e a ELEVENLABS_VOICE_ID estão corretas e se a voz suporta o modelo 'eleven_multilingual_v2' para Português.`);
  }
  
  // Cria um Blob a partir do ArrayBuffer retornado
  const audioBlob = new Blob([data], { type: 'audio/mpeg' });
  
  // Cria um URL de objeto para o Blob
  return URL.createObjectURL(audioBlob);
};