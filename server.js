const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    allowEIO3: true
});

let activeUsers = new Map();

// === TEŞHİS (DIAGNOSTİK) MODÜLÜ ===
io.engine.on("connection_error", (err) => {
    console.error("❌ [MOTOR HATASI] Bağlantı reddedildi!");
    console.error("   ➤ Sebep:", err.code);
    console.error("   ➤ Mesaj:", err.message);
});

io.on('connection', (socket) => {
    console.log(`\n🟢 [BAĞLANTI] Bir cihaz frekansa bağlandı. ID: ${socket.id}`);

    socket.on('join_network', (userData) => {
        userData.socketId = socket.id;
        activeUsers.set(socket.id, userData);
        console.log(`[AĞA KATILIM] ${userData.nickname} [${userData.role}] giriş yaptı.`);
        io.emit('user_list_changed', Array.from(activeUsers.values()));
    });

    socket.on('send_message', (data) => {
        console.log(`[MESAJ] ${data.sender}: ${data.text}`);
        io.emit('receive_message', data);
    });

    socket.on('audio_stream', (buffer) => {
        socket.broadcast.emit('audio_receive', {
            senderId: socket.id,
            buffer: buffer
        });
    });

    socket.on('disconnect', (reason) => {
        if (activeUsers.has(socket.id)) {
            const user = activeUsers.get(socket.id);
            console.log(`🔴 [AYRILMA] ${user.nickname} çıktı. Sebep: ${reason}`);
            activeUsers.delete(socket.id);
            io.emit('user_list_changed', Array.from(activeUsers.values()));
        }
    });
});

// SUNUCU AYAĞA KALKIYOR
http.listen(3712, '0.0.0.0', () => {
    console.log("=============================================");
    console.log("        BEARPAW TELSİZ KULESİ YAYINDA        ");
    console.log("  Port: 3712 | Frekans dinleniyor...         ");
    console.log("=============================================");
});