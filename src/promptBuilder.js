function buildChatPreviewPayload({ message, stickyNote, recentMessages }) {
  const normalizedRecentMessages = Array.isArray(recentMessages) ? recentMessages : [];
  const noteText = stickyNote && stickyNote.trim() ? stickyNote.trim() : "(empty)";

  return {
    model: "not-connected",
    messages: [
      {
        role: "system",
        content: [
          "You are helping inside Local AI Lab Starter, a local-first learning prototype.",
          "No AI API is connected in this build.",
          "",
          "Sticky Note:",
          noteText
        ].join("\n")
      },
      ...normalizedRecentMessages.map((item) => ({
        role: item.role,
        content: item.content
      })),
      {
        role: "user",
        content: message
      }
    ]
  };
}

module.exports = {
  buildChatPreviewPayload
};
