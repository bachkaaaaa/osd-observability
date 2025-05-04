// In a new file: /server/routes/chat/chat_router.ts
import { schema } from '@osd/config-schema';
import { IOpenSearchDashboardsResponse, IRouter, ResponseError } from '../../../../src/core/server';

export function registerChatRoutes(router: IRouter) {
  router.post(
    {
      path: '/api/observability/chat/message',
      validate: {
        body: schema.object({
          message: schema.string()
        }),
      },
    },
    async (context, req, res) => {
      try {
        // Forward the message to the external API
        const response = await fetch('http://localhost:5000/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: req.body.message,
          }),
        });

        if (!response.ok) {
          throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Return the external API response to the client
        return res.ok({
          body: {
            // Return the original response data structure
            response: data.response.response || data.result || JSON.stringify(data),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        // Log the error for server-side debugging
        console.error('Error forwarding message to external API:', error);
        
        return res.customError({
          statusCode: error.statusCode || 500,
          body: {
            message: `Error processing chat message: ${error.message}`,
          },
        });
      }
    }
  );
}