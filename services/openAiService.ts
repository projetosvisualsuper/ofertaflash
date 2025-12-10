import { supabase } from "@/src/integrations/supabase/client";
import { Product, AdScript } from "../types";
import { dataURLtoBlob } from "../src/utils/cn";

// Helper function to invoke the edge function and handle responses
async function invokeOpenAIProxy(task: string, data: any) {
  const { data: result, error } = await supabase.functions.invoke('openai-proxy', {
    body: { task, data },
  });

  if (error) {
    console.error(`Error invoking edge function for task "${task}":`, error);
    
    // Tenta extrair a mensagem de erro detalhada da Edge Function
    const edgeFunctionError = (error as any).context?.body?.error;
    if (edgeFunctionError) {
        throw new Error(edgeFunctionError);
    }
    
    // Se não houver erro detalhado, lança o erro padrão
    throw new Error(error.message);
  }
  
  // CRITICAL CHECK: Ensure the result object and the nested response exist
  if (!result) {
    console.error(`Edge function returned empty or malformed result for task "${task}":`, result);
    throw new Error("Edge function returned an empty or malformed response.");
  }
  
  // Se a Edge Function retornar um erro no corpo (ex: Saldo insuficiente - status 200 com erro no corpo)
  if (result.error) {
      throw new Error(result.error);
  }
  
  // Se a Edge Function retornar um objeto com 'imageBase64' (tarefa de imagem), retorna o resultado completo.
  if (result.imageBase64) {
      return result;
  }
  
  // Se for uma tarefa de texto, o resultado do OpenAI está aninhado em 'response'.
  if (!result.response) {
    console.error(`Edge function returned malformed text response for task "${task}":`, result);
    throw new Error("Edge function returned a malformed text response (missing 'response' field).");
  }
  
  return result.response;
}

export const generateMarketingCopy = async (topic: string): Promise<string> => {
  try {
    const response = await invokeOpenAIProxy('generateMarketingCopy', { topic });
    return response.text?.trim() || "Ofertas Imperdíveis";
  } catch (error) {
    console.error("Error generating copy:", error);
    throw error; // Propaga o erro para o componente tratar
  }
};

export const parseProductsFromText = async (text: string): Promise<Product[]> => {
  try {
    const response = await invokeOpenAIProxy('parseProductsFromText', { text });
    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    
    // O GPT pode envolver o array em um objeto, então tentamos extrair o array diretamente.
    let rawProducts;
    try {
        const parsed = JSON.parse(jsonStr);
        // Se for um objeto com uma chave principal (ex: {products: [...]}), tentamos extrair.
        if (parsed.products && Array.isArray(parsed.products)) {
            rawProducts = parsed.products;
        } else if (Array.isArray(parsed)) {
            rawProducts = parsed;
        } else {
            // Se não for um array, falha.
            throw new Error("AI did not return a valid product array.");
        }
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", e);
        throw new Error("A IA não retornou um formato JSON de produtos válido.");
    }
    
    return rawProducts.map((p: any) => ({
      ...p,
      id: crypto.randomUUID(),
    }));
  } catch (error) {
    console.error("Error parsing products:", error);
    throw error;
  }
};

export const generateBackgroundImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await invokeOpenAIProxy('generateBackgroundImage', { prompt });
    
    // A Edge Function agora retorna imageBase64 e mimeType diretamente
    if (response.imageBase64) {
        return `data:${response.mimeType};base64,${response.imageBase64}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error; // Propaga o erro
  }
};

export const generateAdScript = async (products: Product[]): Promise<AdScript> => {
  if (products.length === 0) {
    return { headline: "Nenhuma Oferta", script: "Selecione produtos para gerar o roteiro.", suggestions: { music: "Nenhuma", voice: "Nenhuma" } };
  }

  try {
    const response = await invokeOpenAIProxy('generateAdScript', { products });
    const jsonStr = response.text?.trim();
    
    if (!jsonStr) {
        throw new Error("A IA não conseguiu gerar o roteiro. Tente produtos diferentes ou verifique o console para erros de segurança.");
    }
    
    // O GPT retorna o JSON como string, precisamos garantir que seja um objeto AdScript
    let parsedScript;
    try {
        parsedScript = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse AdScript JSON:", e);
        throw new Error("A IA retornou um formato de roteiro inválido.");
    }
    
    return parsedScript as AdScript;
  } catch (error) {
    console.error("Error generating ad script:", error);
    throw error;
  }
};

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
  
  // NOVO LOG DE DEBUG
  console.log("Received audio data size:", data.byteLength, "bytes.");
  if (data.byteLength < 100) {
      console.warn("Audio data is suspiciously small. Attempting to decode as error message.");
  }
  
  // NOVO TRATAMENTO DE ERRO: Verifica se o ArrayBuffer é, na verdade, um erro JSON
  try {
    const decoder = new TextDecoder('utf-8');
    const textData = decoder.decode(data);
    const errorJson = JSON.parse(textData);
    
    if (errorJson.error) {
        // Se conseguirmos decodificar e encontrar um campo 'error', lançamos o erro.
        throw new Error(errorJson.error);
    }
    // Se não for um erro, mas for JSON, algo está errado, mas continuamos.
  } catch (e) {
    // Se a decodificação falhar, é provável que seja um ArrayBuffer binário (o MP3), o que é bom.
  }

  // Cria um Blob a partir do ArrayBuffer retornado
  const audioBlob = new Blob([data], { type: 'audio/mpeg' });
  
  // Cria um URL de objeto para o Blob
  return URL.createObjectURL(audioBlob);
};