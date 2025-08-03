// ЗАГЛУШКА вместо OpenAI
export const aiControllerStub = (req, res) => {
  res.status(501).json({ error: 'AI functionality is disabled (no OpenAI key)' });
};