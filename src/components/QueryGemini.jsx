import { useState, useEffect, useRef } from 'react';
import { useProtectedApiMutation } from '../hooks/useApi';
import {
  Typography,
  Box,
  Container,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Grid,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';

export default function QueryGemini({ name = 'Query Gemini AI' }) {
  const [prompt, setPrompt] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const conversationEndRef = useRef(null);

  const queryMutation = useProtectedApiMutation('', {
    method: 'POST',
    mutationConfig: {
      onSuccess: (responseData, variables) => {
        // Extract the response text from Gemini format
        const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

        // Add user prompt and AI response to conversation history
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'user',
            text: variables.userPrompt,
            timestamp: new Date().toLocaleTimeString()
          },
          {
            role: 'model',
            text: responseText,
            timestamp: new Date().toLocaleTimeString(),
            metadata: {
              model: responseData?.modelVersion,
              finishReason: responseData?.candidates?.[0]?.finishReason,
              tokensUsed: responseData?.usageMetadata?.totalTokenCount
            }
          }
        ]);

        // Clear the input field
        setPrompt('');
      },
      onError: (err) => {
        // Add error message to conversation
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'error',
            text: `Error: ${err.message}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      return;
    }

    const userPrompt = prompt;

    // Make POST request
    await queryMutation.mutateAsync({
      endpoint: `/google/google_ai_prompt?prompt=${encodeURIComponent(userPrompt)}`,
      userPrompt
    });
  };

  const handleClearHistory = () => {
    setConversationHistory([]);
  };

  // Auto-scroll to bottom when new messages arrive or when loading
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, queryMutation.isPending]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" color="primary" fontWeight="medium">
            {name}
          </Typography>
        </Box>
        {conversationHistory.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearHistory}
            disabled={queryMutation.isPending}
          >
            Clear History
          </Button>
        )}
      </Box>

      {/* Conversation History */}
      {(conversationHistory.length > 0 || queryMutation.isPending) && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, maxHeight: '60vh', overflowY: 'auto' }}>
          <Stack spacing={3}>
            {conversationHistory.map((message, index) => (
              <Box key={index}>
                {message.role === 'user' && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ maxWidth: '75%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary">
                          {message.timestamp}
                        </Typography>
                        <PersonIcon fontSize="small" color="action" />
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText'
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                )}

                {message.role === 'model' && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Box sx={{ maxWidth: '75%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <SmartToyIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">
                          {message.timestamp}
                        </Typography>
                        {message.metadata?.model && (
                          <Chip
                            label={message.metadata.model}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: 'grey.100'
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                      </Paper>
                      {message.metadata && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {message.metadata.tokensUsed && (
                            <Typography variant="caption" color="text.secondary">
                              Tokens: {message.metadata.tokensUsed}
                            </Typography>
                          )}
                          {message.metadata.finishReason && (
                            <Typography variant="caption" color="text.secondary">
                              • {message.metadata.finishReason}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {message.role === 'error' && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Alert severity="error" sx={{ maxWidth: '75%' }}>
                      <Typography variant="body2">{message.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp}
                      </Typography>
                    </Alert>
                  </Box>
                )}

                {index < conversationHistory.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}

            {/* Thinking Indicator */}
            {queryMutation.isPending && (
              <>
                {conversationHistory.length > 0 && <Divider sx={{ my: 1 }} />}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Box sx={{ maxWidth: '75%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <SmartToyIcon fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Box>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        backgroundColor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <CircularProgress size={20} thickness={4} />
                      <Typography variant="body1" color="text.secondary">
                        Gemini is thinking...
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </>
            )}

            {/* Scroll anchor */}
            <div ref={conversationEndRef} />
          </Stack>
        </Paper>
      )}

      {/* Prompt Form */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item size={{ xs: 12, md: 10 }}>
              <TextField
                fullWidth
                label="Enter your prompt"
                placeholder="Ask Gemini anything..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                maxRows={6}
                required
                disabled={queryMutation.isPending}
                helperText="Press Enter to send, Shift+Enter for new line"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                startIcon={queryMutation.isPending ? <CircularProgress size={16} /> : <SendIcon />}
                disabled={queryMutation.isPending || !prompt.trim()}
                sx={{ height: 56 }}
              >
                {queryMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Searching Alert */}
      {queryMutation.isPending && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Searching...</Typography>
          <Typography variant="body2">Querying Gemini AI for a response</Typography>
        </Alert>
      )}

      {/* Initial state */}
      {conversationHistory.length === 0 && !queryMutation.isPending && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start a conversation with Gemini
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a prompt above to begin chatting with Google's Gemini AI
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
