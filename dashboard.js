document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Update user information
    document.getElementById('username').textContent = currentUser.username;

    // Get DOM elements
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const modal = document.getElementById('addFriendModal');
    const closeModal = document.querySelector('.close-modal');
    const searchFriendBtn = document.getElementById('searchFriend');
    const searchResults = document.getElementById('searchResults');
    const friendUsernameInput = document.getElementById('friendUsername');

    let currentChatUser = null;
    let lastMessageCount = 0;

    // Initialize messages in localStorage if they don't exist
    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify({}));
    }

    // Add Friend Modal Functionality
    addFriendBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Search and add friends functionality
    searchFriendBtn.addEventListener('click', searchUsers);
    friendUsernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });

    function searchUsers() {
        const searchTerm = friendUsernameInput.value.trim();
        if (!searchTerm) return;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const results = users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
            user.username !== currentUser.username
        );

        displaySearchResults(results);
    }

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="user-result">No users found</div>';
            return;
        }

        results.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-result';
            div.innerHTML = `
                <span>${user.username}</span>
                <button onclick="addFriend('${user.username}')">Add Friend</button>
            `;
            searchResults.appendChild(div);
        });
    }

    // Message handling functions
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message && currentChatUser) {
            const messageObj = {
                text: message,
                sender: currentUser.username,
                receiver: currentChatUser,
                timestamp: new Date().toISOString(),
                type: 'sent'
            };

            saveMessage(messageObj);
            addMessage(messageObj);
            messageInput.value = '';
            lastMessageCount++; // Increment the message count
        }
    }

    function saveMessage(messageObj) {
        const messages = JSON.parse(localStorage.getItem('messages')) || {};
        const chatKey = getChatKey(messageObj.sender, messageObj.receiver);
        
        if (!messages[chatKey]) {
            messages[chatKey] = [];
        }
        
        messages[chatKey].push(messageObj);
        localStorage.setItem('messages', JSON.stringify(messages));
        updateContactsList(); // Update contacts list to show latest message
    }

    function getChatKey(user1, user2) {
        return [user1, user2].sort().join('_');
    }

    function loadMessages(otherUser) {
        const messages = JSON.parse(localStorage.getItem('messages')) || {};
        const chatKey = getChatKey(currentUser.username, otherUser);
        return messages[chatKey] || [];
    }

    function addMessage(messageObj) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageObj.type}`;
        
        const timeString = new Date(messageObj.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-text">${messageObj.text}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function selectContact(contact) {
        currentChatUser = contact.username;
        document.getElementById('currentChatName').textContent = currentChatUser;
        document.querySelector('.contact-status').textContent = 'online';
        
        // Clear previous messages
        chatMessages.innerHTML = '';
        
        // Load and display messages
        const messages = loadMessages(currentChatUser);
        messages.forEach(msg => {
            msg.type = msg.sender === currentUser.username ? 'sent' : 'received';
            addMessage(msg);
        });
        
        // Update lastMessageCount for new message checking
        lastMessageCount = messages.length;

        // Update active state
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }

    function updateContactsList() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const contactsList = document.getElementById('contactsList');
        contactsList.innerHTML = '';
        
        if (currentUser.friends && currentUser.friends.length > 0) {
            currentUser.friends.forEach(friendUsername => {
                const friend = users.find(u => u.username === friendUsername);
                if (friend) {
                    const messages = loadMessages(friend.username);
                    const lastMessage = messages[messages.length - 1];
                    
                    const contactElement = document.createElement('div');
                    contactElement.className = 'contact-item';
                    contactElement.innerHTML = `
                        <div>
                            <div class="contact-name">${friend.username}</div>
                            <div class="contact-last-message">
                                ${lastMessage ? lastMessage.text.substring(0, 30) + '...' : 'No messages yet'}
                            </div>
                        </div>
                    `;
                    contactElement.onclick = () => selectContact(friend);
                    contactsList.appendChild(contactElement);
                }
            });
        }
    }

    // Event listeners
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    // Update time display
    function updateTime() {
        const timeElement = document.getElementById('currentTime');
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    updateTime();
    setInterval(updateTime, 1000);

    // Initial contacts list update
    updateContactsList();

    // Function to check for new messages
    function checkNewMessages() {
        if (currentChatUser) {
            const messages = loadMessages(currentChatUser);
            if (messages.length > lastMessageCount) {
                // New messages found
                const newMessages = messages.slice(lastMessageCount);
                newMessages.forEach(msg => {
                    msg.type = msg.sender === currentUser.username ? 'sent' : 'received';
                    addMessage(msg);

                    // Show notification for received messages
                    if (msg.type === 'received') {
                        showNotification(msg.sender, msg.text);
                    }
                });
                lastMessageCount = messages.length;
                
                // Update contacts list to show latest message
                updateContactsList();
            }
        }
    }

    // Start checking for new messages every 1 second
    setInterval(checkNewMessages, 1000);

    // Add these new variables
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const closeDeleteModal = deleteConfirmModal.querySelector('.close-modal');

    // Add delete chat functionality
    clearChatBtn.addEventListener('click', () => {
        if (currentChatUser) {
            deleteConfirmModal.classList.add('active');
        }
    });

    closeDeleteModal.addEventListener('click', () => {
        deleteConfirmModal.classList.remove('active');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteConfirmModal.classList.remove('active');
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentChatUser) {
            clearChatHistory(currentChatUser);
            deleteConfirmModal.classList.remove('active');
        }
    });

    function clearChatHistory(otherUser) {
        const messages = JSON.parse(localStorage.getItem('messages')) || {};
        const chatKey = getChatKey(currentUser.username, otherUser);
        
        // Delete the messages for this chat
        if (messages[chatKey]) {
            delete messages[chatKey];
            localStorage.setItem('messages', JSON.stringify(messages));
            
            // Clear the chat display
            chatMessages.innerHTML = '';
            
            // Update the contacts list to show "No messages"
            updateContactsList();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'message system';
            successMessage.innerHTML = `
                <div class="message-text">Chat history cleared</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                })}</div>
            `;
            chatMessages.appendChild(successMessage);
        }
    }

    // Add this style for system messages
    const style = document.createElement('style');
    style.textContent = `
        .message.system {
            max-width: none;
            align-self: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 0.9rem;
            margin: 10px 0;
        }
    `;
    document.head.appendChild(style);

    // Add these variables at the top
    let hasNotificationPermission = false;
    const notificationSound = new Audio('notif.wav'); // Create a notif.wav sound file

    // Request notification permission when page loads
    requestNotificationPermission();

    async function requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            hasNotificationPermission = permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    function showNotification(sender, message) {
        // Browser notification
        if (hasNotificationPermission && document.hidden) {
            const notification = new Notification('New message from ' + sender, {
                body: message,
                icon: 'phoenix-logo.png', // Make sure this path is correct
                badge: 'phoenix-logo.png'
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
            };
        }

        // Play notification sound
        notificationSound.play().catch(error => console.log('Error playing sound:', error));

        // Add visual notification in title
        if (document.hidden) {
            document.title = '(New Message) Phoenix Chat';
        }
    }

    // Reset title when window gains focus
    window.addEventListener('focus', function() {
        document.title = 'Phoenix Chat';
    });

    // Add unread message indicators to contacts
    function updateContactsList() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const contactsList = document.getElementById('contactsList');
        contactsList.innerHTML = '';
        
        if (currentUser.friends && currentUser.friends.length > 0) {
            currentUser.friends.forEach(friendUsername => {
                const friend = users.find(u => u.username === friendUsername);
                if (friend) {
                    const messages = loadMessages(friend.username);
                    const lastMessage = messages[messages.length - 1];
                    const unreadCount = getUnreadCount(messages, friend.username);
                    
                    const contactElement = document.createElement('div');
                    contactElement.className = 'contact-item';
                    contactElement.innerHTML = `
                        <div>
                            <div class="contact-name">
                                ${friend.username}
                                ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
                            </div>
                            <div class="contact-last-message">
                                ${lastMessage ? lastMessage.text.substring(0, 30) + '...' : 'No messages yet'}
                            </div>
                        </div>
                    `;
                    contactElement.onclick = () => {
                        selectContact(friend);
                        markMessagesAsRead(friend.username);
                    };
                    contactsList.appendChild(contactElement);
                }
            });
        }
    }

    function getUnreadCount(messages, friendUsername) {
        return messages.filter(msg => 
            msg.sender === friendUsername && 
            !msg.read && 
            msg.receiver === currentUser.username
        ).length;
    }

    function markMessagesAsRead(friendUsername) {
        const messages = JSON.parse(localStorage.getItem('messages')) || {};
        const chatKey = getChatKey(currentUser.username, friendUsername);
        
        if (messages[chatKey]) {
            messages[chatKey] = messages[chatKey].map(msg => {
                if (msg.sender === friendUsername && msg.receiver === currentUser.username) {
                    msg.read = true;
                }
                return msg;
            });
            localStorage.setItem('messages', JSON.stringify(messages));
            updateContactsList();
        }
    }

    // Mobile menu handling
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const chatSidebar = document.querySelector('.chat-sidebar');
    const chatMain = document.querySelector('.chat-main');

    mobileMenuBtn.addEventListener('click', () => {
        chatSidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    chatMain.addEventListener('click', (e) => {
        if (chatSidebar.classList.contains('active') && 
            !e.target.closest('.mobile-menu-btn')) {
            chatSidebar.classList.remove('active');
        }
    });

    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 200);
    });

    // Prevent elastic scrolling on iOS
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.closest('.chat-messages') || 
            e.target.closest('.contacts-list') || 
            e.target.closest('.search-results')) {
            return;
        }
        e.preventDefault();
    }, { passive: false });
});

// Global functions
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function addFriend(username) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (!currentUser.friends) {
        currentUser.friends = [];
    }

    if (currentUser.friends.includes(username)) {
        alert('Already friends with this user!');
        return;
    }

    currentUser.friends.push(username);
    
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    users[userIndex] = currentUser;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('addFriendModal').classList.remove('active');
    alert('Friend added successfully!');
    
    // Update the contacts list
    const contactsList = document.getElementById('contactsList');
    const friend = users.find(u => u.username === username);
    if (friend) {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <div>
                <div class="contact-name">${friend.username}</div>
                <div class="contact-last-message">No messages yet</div>
            </div>
        `;
        contactElement.onclick = () => selectContact(friend);
        contactsList.appendChild(contactElement);
    }
} 