import 'package:flutter/material.dart';

void main() {
  runApp(const MahmudGPTApp());
}

class MahmudGPTApp extends StatelessWidget {
  const MahmudGPTApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MahmudGPT',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF00B0FF),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        fontFamily: 'SpaceGrotesk',
      ),
      home: const ChatPage(),
    );
  }
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  String _activeMode = 'Assistant';

  void _handleSend() {
    if (_controller.text.trim().isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(
        text: _controller.text,
        isUser: true,
        mode: _activeMode,
      ));
      _controller.clear();
    });
    // Simulate AI response
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        String response = 'Hello! I am MahmudGPT. How can I help you today?';
        if (_activeMode == 'Dev Mode') {
          response = 'SYSTEM_READY: Kernel-space initialized. Memory-mapped I/O at 0x7FFF. Awaiting low-level instructions. O(1) complexity guaranteed.';
        }
        _messages.add(ChatMessage(
          text: response,
          isUser: false,
          mode: _activeMode,
        ));
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('MahmudGPT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text(_activeMode, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.5))),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () {}),
        ],
      ),
      drawer: Drawer(
        backgroundColor: const Color(0xFF15151A),
        child: Column(
          children: [
            const DrawerHeader(
              child: Center(child: Text('MAHMUD GPT', style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.bold))),
            ),
            ListTile(
              title: const Text('Assistant'),
              leading: const Icon(Icons.chat_bubble_outline),
              onTap: () => setState(() => _activeMode = 'Assistant'),
            ),
            ListTile(
              title: const Text('Dev Mode'),
              leading: const Icon(Icons.memory),
              onTap: () => setState(() => _activeMode = 'Dev Mode'),
            ),
          ],
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topLeft,
            radius: 1.5,
            colors: [
              const Color(0xFF00B0FF).withOpacity(0.05),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _messages.length,
                itemBuilder: (context, index) => _messages[index],
              ),
            ),
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF15151A).withOpacity(0.8),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
              ),
              child: TextField(
                controller: _controller,
                style: const TextStyle(fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Message...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _handleSend,
            child: Container(
              height: 44,
              width: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF00B0FF), Color(0xFF0081CB)]),
                borderRadius: BorderRadius.circular(15),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF00B0FF).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

class ChatMessage extends StatelessWidget {
  final String text;
  final bool isUser;
  final String mode;

  const ChatMessage({super.key, required this.text, required this.isUser, required this.mode});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              height: 32,
              width: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF00B0FF).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome, size: 16, color: Color(0xFF00B0FF)),
            ),
            const SizedBox(width: 12),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isUser ? const Color(0xFF00B0FF) : const Color(0xFF1C1C23),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 20),
                ),
              ),
              child: Text(
                text,
                style: TextStyle(
                  color: isUser ? Colors.white : Colors.white.withOpacity(0.9),
                  fontSize: 14,
                  fontFamily: mode == 'Dev Mode' && !isUser ? 'Courier' : null,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
