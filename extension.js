const vscode = require('vscode');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');

dotenv.config();

// Hard-coded API Key
const apiKey = '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';

// Initialize the Groq API client with the hard-coded API key
const groq = new Groq({
    apiKey: apiKey
});

class ExperimentViewProvider {
    constructor(_extensionUri) {
        this.extensionUri = _extensionUri;
    }

    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this.getWebviewContent();

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendMessage') {
                const userMessage = message.text;

                // Call the Groq API with the user's message
                try {
                    const response = await this.callGroqAPI(userMessage);
                    webviewView.webview.postMessage({
                        command: 'showResponse',
                        text: response
                    });
                } catch (error) {
                    console.error('Error from Groq API:', error);
                    webviewView.webview.postMessage({
                        command: 'showResponse',
                        text: 'Sorry, there was an error with the AI.'
                    });
                }
            }
        });
    }

    getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chatbot</title>
    <style>
       html, body {
    height: 100%;
    margin: 0; /* Ensure there's no default margin */
}
        #navbar {
            
            padding: 5px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content:start;
        }
        .nav-button {
            background-color: #ddd;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
        }
        .nav-button.active {
            background-color: #bbb;
        }
        #chatPage, #contextPage {
            display: none;
        }
        #chatPage.active, #contextPage.active {
            display: block;
        }
        #chatOutput {
            border: 1px solid #ddd;
            padding: 10px;
            height: 300px;
            overflow-y: scroll;
        }
       #userInput {
    width: 80%;
    padding: 8px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box; /* Include padding and border in element's total width and height */
    transition: border-color 0.3s ease;
}

#userInput:focus {
    border-color: #007acc; /* Change border color on focus */
    outline: none; /* Remove default focus outline */
}

#sendButton {
    width: 18%;
    padding: 8px;
    border: none;
    border-radius: 4px;
    background-color: #007acc; /* Blue background */
    color: white; /* White text */
    font-size: 14px;
    cursor: pointer; /* Pointer cursor on hover */
    transition: background-color 0.3s ease;
}

#sendButton:hover {
    background-color: #005fa3; /* Darker blue on hover */
}

#sendButton:active {
    background-color: #004d7a; /* Even darker blue on click */
}

        #contextOptions {
            margin-top: 20px;
        }
        #contextOptions button {
            margin: 5px;
            padding: 5px;
            font-size:15px;
            cursor: pointer;
        }
        #contextOptions button.active {
            background-color: #ddd;
        }
            #contextOptions {
    display: flex;
    flex-direction: column; /* Stack buttons vertically */
    gap: 10px; /* Space between buttons */
}

.chat-input-container {
    display: flex;
    gap: 5px;
    margin-top: 10px; 
}


.context-button {
    background-color: #007bff; /* Primary button color */
    color: #fff; /* Text color */
    border: none; /* Remove default border */
    padding: 10px 20px; /* Button padding */
    border-radius: 8px; /* Rounded corners */
    font-size: 10px; /* Font size */
    cursor: pointer; /* Pointer cursor on hover */
    transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
}

.context-button:hover {
    background-color: #0056b3; /* Darker background on hover */
    transform: scale(1.05); /* Slight zoom effect */
}

.context-button:focus {
    outline: none; /* Remove default focus outline */
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5); /* Add custom focus outline */
}

    </style>
</head>
<body>
    <div id="navbar">
        <button class="nav-button active" id="chatNav">Chat</button>
        <button class="nav-button" id="contextNav">Context</button>
    </div>
    
    <!-- Chat Page -->
    <div id="chatPage" class="active">
        <h3>Welcome to Lask.AI✨</h3>
        <div id="chatOutput"></div>

        <div class="chat-input-container">
        <input type="text" id="userInput" placeholder="Type your message..." />
        <button id="sendButton">Send</button>
   
        </div>
     </div>
    <!-- Context Page -->
    <div id="contextPage">
        <h3>Context Management</h3>
       <div id="contextOptions">
    <button class="context-button" id="addFileContext">+ Add File Context</button>
    <button class="context-button" id="addCodeBlockContext">+ Add Code Block Context</button>
    <button class="context-button" id="addDirectoryContext">+ Add Directory Context</button>
    <button class="context-button" id="addGitHubRepoContext">+ Add GitHub Repo Context</button>
</div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('chatNav').addEventListener('click', () => {
            document.getElementById('chatPage').classList.add('active');
            document.getElementById('contextPage').classList.remove('active');
            document.getElementById('chatNav').classList.add('active');
            document.getElementById('contextNav').classList.remove('active');
        });
        
        document.getElementById('contextNav').addEventListener('click', () => {
            document.getElementById('chatPage').classList.remove('active');
            document.getElementById('contextPage').classList.add('active');
            document.getElementById('chatNav').classList.remove('active');
            document.getElementById('contextNav').classList.add('active');
        });

        document.getElementById('sendButton').addEventListener('click', function() {
            const userMessage = document.getElementById('userInput').value;
            if (userMessage.trim() !== '') {
                const userMessageElement = document.createElement('div');
                userMessageElement.textContent = 'You: ' + userMessage;
                document.getElementById('chatOutput').appendChild(userMessageElement);
                document.getElementById('userInput').value = '';

                // Send message to VS Code extension
                vscode.postMessage({
                    command: 'sendMessage',
                    text: userMessage
                });
            }
        });

        // Handle context buttons
        document.getElementById('addFileContext').addEventListener('click', () => {
            vscode.postMessage({ command: 'addFileContext' });
        });

        document.getElementById('addCodeBlockContext').addEventListener('click', () => {
            vscode.postMessage({ command: 'addCodeBlockContext' });
        });

        document.getElementById('addDirectoryContext').addEventListener('click', () => {
            vscode.postMessage({ command: 'addDirectoryContext' });
        });

        document.getElementById('addGitHubRepoContext').addEventListener('click', () => {
            vscode.postMessage({ command: 'addGitHubRepoContext' });
        });

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'showResponse') {
                const botResponseElement = document.createElement('div');
                botResponseElement.textContent = 'AI: ' + message.text;
                document.getElementById('chatOutput').appendChild(botResponseElement);
            }
        });
    </script>
</body>
</html>
`;
    }

    async callGroqAPI(userMessage) {
        try {
            // Create a chat completion request
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'user', content: userMessage }
                ],
                model: 'llama3-8b-8192',
                temperature: 1,
                max_tokens: 1024,
                top_p: 1,
                stream: false, // Adjust based on Groq SDK's capabilities
                stop: null
            });

            // Extract response text
            return chatCompletion.choices[0]?.message?.content || '';

        } catch (error) {
            console.error('Error from Groq API:', error);
            return 'Sorry, there was an error communicating with the AI.';
        }
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "experiment" is now active!');

    const provider = new ExperimentViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "experiment.sidebarView",
            provider
        )
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
