const ChatWindow = () => {
  return (
    <div className="chat-window">
      <div className="chat-messages">
        <p>No messages yet</p>
      </div>
      <div className="chat-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
