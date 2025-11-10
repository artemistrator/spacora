export async function triggerN8NWorkflow(workflowName: string, data: any) {
  const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/${workflowName}`
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

// Примеры использования:
export const aiJobs = {
  processImage: (imageUrl: string, postId: string) => 
    triggerN8NWorkflow('image-processing', { imageUrl, postId }),
    
  replaceObject: (originalImageUrl: string, favoriteImageUrl: string, prompt: string) =>
    triggerN8NWorkflow('ai-replacement', { originalImageUrl, favoriteImageUrl, prompt }),
    
  moderateContent: (content: string, postId: string) =>
    triggerN8NWorkflow('content-moderation', { content, postId })
}