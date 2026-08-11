const { processAIChat } = require('../services/ai.service');

/**
 * @desc    Process natural language AI chat request with role-aware tools & confirmation
 * @route   POST /api/ai/chat
 * @access  Private (student, organizer, admin)
 */
exports.chatWithAI = async (req, res) => {
  try {
    const { messages, confirmAction } = req.body;
    const user = req.user;

    if (!user || !user.Id) {
      return res.status(401).json({ success: false, message: 'User identity not found in token' });
    }

    if (!confirmAction && (!messages || !Array.isArray(messages) || messages.length === 0)) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const aiResponse = await processAIChat({
      user,
      messages: messages || [],
      confirmAction: confirmAction || null
    });

    return res.status(200).json({
      success: true,
      ...aiResponse
    });
  } catch (error) {
    console.error('AI Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI chat request',
      error: error.message
    });
  }
};
