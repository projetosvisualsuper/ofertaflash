import { supabase } from "@/src/integrations/supabase/client";
import { Product, AdScript } from "../types";
import { dataURLtoBlob } from "../src/utils/cn"; // Importando a função auxiliar

// Helper function to invoke the edge function and handle responses
async function invokeGeminiProxy(task: string, data: any) {
  const { data: result, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { task, data },
  });

  if (error) {
    console.error(`Error invoking edge function for task "${task}":`, error);
    throw new Error(error.message);
  }
  
  // CRITICAL CHECK: Ensure the result object and the nested response exist
  if (!result || !result.response) {
    console.error(`Edge function returned empty or malformed result for task "${task}":`, result);
    throw new Error("Edge function returned an empty or malformed response (missing 'response' field).");
  }
  
  // The actual Gemini response is nested inside the function's response
  return result.response;
}

export const generateMarketingCopy = async (topic: string): Promise<string> => {
  try {
    const response = await invokeGeminiProxy('generateMarketingCopy', { topic });
    return response.text?.trim() || "Ofertas Imperdíveis";
  } catch (error) {
    console.error("Error generating copy:", error);
    return "Super Ofertas";
  }
};

export const parseProductsFromText = async (text: string): Promise<Product[]> => {
  try {
    const response = await invokeGeminiProxy('parseProductsFromText', { text });
    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    
    const rawProducts = JSON.parse(jsonStr);
    return rawProducts.map((p: any) => ({
      ...p,
      id: crypto.randomUUID(),
    }));
  } catch (error) {
    console.error("Error parsing products:", error);
    return [];
  }
};

export const generateBackgroundImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await invokeGeminiProxy('generateBackgroundImage', { prompt });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateAdScript = async (products: Product[]): Promise<AdScript> => {
  if (products.length === 0) {
    return { headline: "Nenhuma Oferta", script: "Selecione produtos para gerar o roteiro.", suggestions: { music: "Nenhuma", voice: "Nenhuma" } };
  }

  try {
    const response = await invokeGeminiProxy('generateAdScript', { products });
    const jsonStr = response.text?.trim();
    
    if (!jsonStr) {
        throw new Error("A IA não conseguiu gerar o roteiro. Tente produtos diferentes ou verifique o console para erros de segurança.");
    }
    
    return JSON.parse(jsonStr) as AdScript;
  } catch (error) {
    console.error("Error generating ad script:", error);
    throw error;
  }
};

/**
 * Gera uma imagem de produto com IA e faz o upload para o Supabase Storage.
 * @param productName O nome do produto para gerar a imagem.
 * @returns A URL pública da imagem salva.
 */
export const generateProductImageAndUpload = async (productName: string): Promise<string> => {
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data.user?.id;

    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    
    // 1. Chamar a Edge Function para gerar a imagem
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('generate-product-image', {
        body: { productName },
    });
    
    if (edgeError) {
        throw new Error(`Falha na Edge Function: ${edgeError.message}`);
    }
    
    const { imageBase64, mimeType } = edgeData;
    if (!imageBase64) {
        throw new Error("A IA não retornou uma imagem válida.");
    }
    
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    
    // 2. Converter Base64 para Blob
    const imageBlob = dataURLtoBlob(dataUrl);
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}-${crypto.randomUUID()}.png`;
    const filePath = `${userId}/${fileName}`; 

    // 3. Upload para o Supabase Storage (Bucket 'product_images')
    const { error: uploadError } = await supabase.storage
        .from('product_images') // Usando um bucket dedicado para imagens de produtos
        .upload(filePath, imageBlob, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
    }

    // 4. Obter URL pública
    const { data: urlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);
        
    if (!urlData.publicUrl) {
        throw new Error("Falha ao obter URL pública do Storage.");
    }
    
    return urlData.publicUrl;
};